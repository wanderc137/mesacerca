# MesaCerca — Bitácora de desarrollo

**Propósito:** registrar problemas, decisiones y lecciones que no siempre quedan en el código. Sirve para no repetir errores y para que una persona nueva entienda por qué el proyecto es como es.

**Nota:** esta bitácora está sanitizada. No incluye credenciales, datos personales, direcciones reales ni el nombre comercial anterior del proyecto. Las fechas corresponden a los hitos documentados en `docs/17` y `docs/22` (noviembre de 2026).

---

## Índice

1. [Resumen del recorrido](#resumen)
2. [Problemas encontrados y solución](#problemas)
3. [Enfoques descartados](#descartados)
4. [Decisiones técnicas](#decisiones)
5. [Lecciones aprendidas](#lecciones)
6. [Deuda y próximos riesgos](#deuda)

---

<a id="resumen"></a>

## 1. Resumen del recorrido

| Etapa | Qué se buscó | Qué se aprendió |
|---|---|---|
| Investigación | Entender el mercado de delivery local y la economía del local. | La comisión y la transparencia del precio son el núcleo del problema, no solo la app. |
| Diseño | Definir roles, estados y modelo de datos antes de programar. | Un estado mal definido se convierte en deuda de operación. |
| MVP web | Cliente, local, repartidor, admin y pagos demo. | El flujo feliz es fácil; las excepciones son el producto. |
| App móvil | Cliente y repartidor en Expo. | Una app con dos roles necesita navegación y permisos distintos desde el inicio. |
| Auditoría 1 | Buscar fallas de autorización, pagos y sesiones. | La mayoría de los bugs graves estaban en los bordes, no en el centro. |
| Auditoría 2 | Revisar MFA, KYC, webhooks y caché. | Los controles nuevos también introducen superficie nueva. |
| Producción | TLS, MFA, KYC, backups, Cloudflare. | Documentar el despliegue no es desplegar; el checklist debe ejecutarse. |

---

<a id="problemas"></a>

## 2. Problemas encontrados y solución

### 2.1 SQLite para desarrollo, PostgreSQL para producción

**Síntoma:** el MVP inicial podía correr con SQLite, pero producción necesitaba concurrencia, TLS, roles y migraciones reales.

**Causa:** SQLite simplifica el arranque, pero no representa el entorno de producción.

**Solución:** se adoptó PostgreSQL 18 desde el inicio, con Prisma y migraciones versionadas. El entorno local usa PostgreSQL con TLS y un puerto dedicado.

**Lección:** si producción usa PostgreSQL, desarrollo debe usarlo también. Las diferencias de comportamiento aparecen tarde y caras.

### 2.2 Doble aceptación de un pedido

**Síntoma:** dos repartidores podían aceptar el mismo pedido si la request llegaba casi al mismo tiempo.

**Causa:** la comprobación de estado y la escritura no eran atómicas.

**Solución:** aceptación atómica con condición de estado y transacción; la segunda request recibe conflicto. Se agregó una prueba de doble aceptación.

**Lección:** “leer y luego escribir” no es una regla de negocio. La regla debe expresarse en una operación atómica.

### 2.3 PIN sin límite de intentos

**Síntoma:** se podía probar el PIN de entrega muchas veces.

**Causa:** el PIN se validaba, pero no había contador ni bloqueo.

**Solución:** máximo 5 intentos, bloqueo y evento de auditoría. El PIN de retiro y el de entrega son distintos.

**Lección:** un secreto corto (4–6 dígitos) necesita límite, expiración y bloqueo; no basta con que sea “difícil de adivinar”.

### 2.4 Fuga de dirección antes de aceptar

**Síntoma:** el repartidor podía ver la dirección exacta del cliente antes de aceptar la oferta.

**Causa:** el payload de la oferta incluía la dirección completa para “facilitar” la decisión.

**Solución:** la oferta muestra zona/referencia aproximada; la dirección exacta se revela después de aceptar. También se revisó qué ve el cliente del repartidor.

**Lección:** minimizar datos no es solo privacidad; reduce fraude y uso indebido.

### 2.5 Webhook de pago sin firma obligatoria

**Síntoma:** un request falso podía simular un pago aprobado.

**Causa:** la firma se validaba solo si el secreto estaba configurado; en algunos entornos se omitía.

**Solución:** firma obligatoria en producción, comparación timing-safe, validación de monto/moneda e idempotencia. En sandbox se exige configuración explícita.

**Lección:** un webhook sin firma es un endpoint público que cambia dinero. No debe existir en producción.

### 2.6 Retorno de Transbank sin validar monto

**Síntoma:** el retorno podía marcar pagado sin comprobar `buy_order` ni monto.

**Causa:** se confiaba en el estado devuelto por la pasarela.

**Solución:** se valida `buy_order`, monto y estado contra el pedido antes de marcarlo. Se agregó prueba de manipulación.

**Lección:** el retorno del navegador no es confiable; la verdad está en la consulta al proveedor y en la firma.

### 2.7 CORS abierto

**Síntoma:** cualquier origen podía llamar a la API con credenciales.

**Causa:** se usaba `*` o no se validaba el origen en mutaciones.

**Solución:** allowlist por `CORS_ORIGINS` y `NEXT_PUBLIC_APP_URL`; los orígenes desconocidos reciben `403` en mutaciones; `OPTIONS` responde `204` solo si el origen está permitido.

**Lección:** CORS no es autenticación, pero una allowlist evita abusos y confusión de clientes.

### 2.8 Administración podía cambiar cualquier estado

**Síntoma:** un admin podía mover un pedido a cualquier estado sin respetar la máquina.

**Causa:** la acción de admin no reutilizaba las reglas de transición.

**Solución:** se separaron acciones destructivas (`ADMIN`) de soporte (`SUPPORT`), se validan estados de origen y se escribe auditoría. `SUPPORT` no puede cancelar/reembolsar.

**Lección:** el rol “admin” no debe ser un bypass de la máquina de estados. Las acciones excepcionales necesitan su propio flujo y registro.

### 2.9 Reembolsos solo en base de datos

**Síntoma:** el pedido quedaba `REFUNDED` pero el dinero no se devolvía en la pasarela.

**Causa:** la acción solo actualizaba Prisma.

**Solución:** el reembolso llama al proveedor y solo marca `REFUNDED` con confirmación. Si el pago llega después de una cancelación, queda `REFUND_PENDING`.

**Lección:** el estado local debe reflejar la verdad del proveedor, no reemplazarla.

### 2.10 IDOR en el retorno de KYC

**Síntoma:** un usuario podía consultar el caso KYC de otro cambiando un ID.

**Causa:** la ruta de retorno confiaba en el ID del caso sin comprobar pertenencia.

**Solución:** se valida usuario/rol antes de mostrar o modificar el caso. Se agregó prueba de acceso cruzado.

**Lección:** cada ruta con un ID necesita una comprobación de pertenencia, incluso si es “solo lectura”.

### 2.11 Bypass de MFA en el login móvil

**Síntoma:** una cuenta con MFA podía entrar por la app sin el segundo factor.

**Causa:** el login móvil no consultaba `mfaEnabled`.

**Solución:** el login móvil rechaza cuentas con MFA (`403`); no se inventó un bypass. La app muestra un mensaje claro.

**Lección:** cada superficie de login debe aplicar la misma política. Si no se puede soportar MFA en móvil, se rechaza, no se ignora.

### 2.12 MFA no verificada en server actions

**Síntoma:** una sesión con MFA pendiente podía ejecutar actions sensibles.

**Causa:** la action comprobaba rol, pero no el estado de MFA.

**Solución:** helper de autorización que exige MFA cuando `MFA_ENFORCED=true`; las actions de admin, local y KYC lo usan.

**Lección:** la autenticación no termina en el login. Cada operación sensible debe comprobar el nivel de assurance.

### 2.13 Replay de webhook KYC

**Síntoma:** un webhook repetido podía reprocesar una decisión.

**Causa:** no había idempotencia por `providerRef`.

**Solución:** se registra el evento y se ignora un segundo procesamiento con la misma referencia. Se agregó validación de firma cuando el secreto está configurado.

**Lección:** los webhooks se reintentan por diseño. La idempotencia es obligatoria, no opcional.

### 2.14 Spoofing de IP

**Síntoma:** el rate limit se podía eludir enviando `X-Forwarded-For` o `X-Real-IP` falsos.

**Causa:** se confiaba en headers del cliente sin validar el proxy.

**Solución:** `TRUST_PROXY=1` y extracción de IP solo desde el proxy confiable; en local se usa la IP de la conexión.

**Lección:** un header es input del cliente hasta que el proxy lo sobrescribe. La configuración del borde es parte de la seguridad.

### 2.15 Carrera en las reseñas

**Síntoma:** dos requests simultáneos podían crear dos reseñas del mismo pedido.

**Causa:** la comprobación “ya calificó” no era atómica.

**Solución:** restricción única y transacción; el segundo request recibe `409`.

**Lección:** las reglas “una vez por pedido” necesitan una restricción de base, no solo un `if`.

### 2.16 Abuso de costo KYC

**Síntoma:** un usuario podía iniciar sesiones KYC repetidas, cada una facturable.

**Causa:** no había límite por usuario.

**Solución:** 3 inicios por hora y auditoría; el admin revisa casos pendientes.

**Lección:** los servicios externos con costo por uso necesitan cuotas además de autenticación.

### 2.17 Caché de páginas sensibles

**Síntoma:** una página privada podía quedar en caché y mostrarse a otro usuario.

**Causa:** no todas las rutas privadas tenían `no-store`.

**Solución:** headers `private, no-store` para paneles, checkout, pedidos, login y verificación; auditoría de rutas.

**Lección:** la caché es parte del modelo de autorización. Si la respuesta depende del usuario, no se cachea públicamente.

### 2.18 JWT sin `ver`

**Síntoma:** un token de otro propósito podía reutilizarse.

**Causa:** el JWT no incluía versión/propósito.

**Solución:** claims `ver`, issuer, audience y propósito; validación estricta.

**Lección:** un JWT válido no es un JWT autorizado. Hay que validar contexto, no solo firma.

### 2.19 MFA no revocaba sesiones

**Síntoma:** al activar MFA, las sesiones anteriores seguían activas.

**Causa:** no se incrementaba `tokenVersion`.

**Solución:** activar MFA incrementa `tokenVersion`; las sesiones previas quedan inválidas.

**Lección:** un cambio de factor de autenticación debe invalidar sesiones existentes.

### 2.20 Credenciales de integración en producción

**Síntoma:** era posible arrancar producción con credenciales de prueba de Transbank.

**Causa:** la validación de entorno no distinguía integración de producción.

**Solución:** preflight rechaza integración en producción y exige comercio/llaves reales; Mercado Pago rechaza `TEST-`.

**Lección:** “funciona en sandbox” no significa “está listo para producción”. El entorno debe fallar cerrado.

---

<a id="descartados"></a>

## 3. Enfoques descartados

### 3.1 Microservicios desde el día uno

**Por qué se consideró:** separar pedidos, pagos, dispatch y notificaciones.

**Por qué se descartó:** un MVP con cuatro roles no necesita la complejidad operativa de varios servicios, colas, tracing y contratos distribuidos. El monolito modular permite extraer módulos después si hay una razón medida.

**Qué haría cambiar la decisión:** equipos independientes, cuellos de botella medidos o necesidad de escalar un módulo por separado.

### 3.2 Auth.js / NextAuth como capa principal

**Por qué se consideró:** integración conocida con Next.js.

**Por qué se descartó:** el proyecto necesitaba control fino de `tokenVersion`, propósito, roles, MFA pendiente y sesión móvil Bearer. Se implementó una capa propia con `jose`, más simple para el alcance.

**Costo:** hay que mantenerla y auditarla. No es una decisión para todos los proyectos.

### 3.3 MapLibre + Ably

**Por qué se consideró:** mapas más flexibles y tiempo real.

**Por qué se descartó:** Leaflet + tiles Esri resolvía el mapa sin API key, y el polling de 5 s era suficiente para el MVP. Ably agrega costo y dependencia.

**Deuda:** el tracking no es tiempo real push; el mapa móvil abre una app externa.

### 3.4 Guardar tarjetas o hacer checkout propio

**Por qué se consideró:** control total de la experiencia.

**Por qué se descartó:** aumenta el alcance PCI, el riesgo y la complejidad. Checkout hospedado de Mercado Pago/Transbank es la opción correcta para el MVP.

### 3.5 KYC propio

**Por qué se consideró:** evitar costo por sesión.

**Por qué se descartó:** liveness, face match, AML y fraude de dispositivo no son un proyecto secundario. Didit aporta la especialidad; MesaCerca integra y revisa.

### 3.6 Precios en el cliente

**Por qué se consideró:** mostrar el total sin ida y vuelta.

**Por qué se descartó:** el cliente puede manipular el payload. El servidor recalcula; el cliente solo muestra una estimación.

### 3.7 Floats para dinero

**Por qué se consideró:** simplicidad de cálculo.

**Por qué se descartó:** errores de redondeo en CLP y comisiones. Se usan enteros y redondeo explícito.

### 3.8 SQLite para todo

**Por qué se consideró:** cero configuración.

**Por qué se descartó:** producción necesitaba PostgreSQL, TLS, concurrencia y migraciones. Mantener dos motores aumenta el riesgo.

### 3.9 Capturas de pantalla como documentación principal

**Por qué se consideró:** mostrar la UI rápido.

**Por qué se descartó:** las capturas se desactualizan y no explican arquitectura. Se optó por diagramas SVG editables y documentación en Markdown.

### 3.10 Rate limit en memoria como solución definitiva

**Por qué se consideró:** no agregar infraestructura.

**Por qué se descartó como solución definitiva:** no funciona con múltiples instancias. Se mantiene como transición y está en la deuda técnica.

---

<a id="decisiones"></a>

## 4. Decisiones técnicas

### 4.1 Monolito modular

**Decisión:** una app Next.js con módulos de dominio claros.

**Razón:** menor costo operativo, un solo despliegue, transacciones locales y menor latencia.

**Consecuencia:** hay que cuidar los límites entre módulos y evitar que `app/` contenga reglas de negocio.

### 4.2 PostgreSQL + Prisma

**Decisión:** PostgreSQL 18 y Prisma 6.19.3 con migraciones.

**Razón:** transacciones, tipos, relaciones, TLS y migraciones reproducibles.

**Consecuencia:** el schema es la fuente de verdad; las migraciones deben revisarse, no generarse a ciegas.

### 4.3 Dinero en enteros CLP

**Decisión:** todos los montos son `Int`.

**Razón:** evitar errores de punto flotante y simplificar la conciliación.

**Consecuencia:** no se aceptan montos con decimales; el redondeo se hace una vez y se documenta.

### 4.4 Pago hospedado

**Decisión:** Mercado Pago Checkout Pro y Transbank Webpay Plus.

**Razón:** reducir alcance PCI y delegar fraude/3DS.

**Consecuencia:** la experiencia de pago sale de la app; hay que manejar retorno, webhook y conciliación.

### 4.5 KYC externo con Didit

**Decisión:** workflow Courier Strict con liveness 3D, face match y AML.

**Razón:** no construir biometría propia; obtener señales de fraude.

**Consecuencia:** costo por sesión, dependencia de un proveedor y necesidad de webhook firmado.

### 4.6 MFA solo en roles sensibles

**Decisión:** TOTP para admin, soporte y local; no en cliente ni móvil.

**Razón:** proteger las cuentas con más poder sin bloquear la conversión del cliente.

**Consecuencia:** el login móvil rechaza cuentas con MFA; es una limitación declarada.

### 4.7 Identidad visual oscura

**Decisión:** tema oscuro, amarillo, tipografía densa y números monoespaciados.

**Razón:** operación prolongada, lectura rápida y diferenciación.

**Consecuencia:** hay que cuidar contraste y accesibilidad; no se copiaron assets de terceros.

### 4.8 Expo para móvil

**Decisión:** una app Expo con dos experiencias por rol.

**Razón:** reutilizar TypeScript y API, iterar rápido y probar en Expo Go.

**Consecuencia:** sin push nativo, sin mapa embebido y sin build de tiendas en el MVP.

### 4.9 Cloudflare Tunnel como modo recomendado

**Decisión:** documentar Tunnel y Edge, recomendar Tunnel.

**Razón:** no abrir puertos entrantes, menor superficie y TLS gestionado.

**Consecuencia:** el rate limit de borde y la IP real dependen de la configuración; hay que probar `TRUST_PROXY`.

### 4.10 Documentar los límites

**Decisión:** incluir una sección de límites honestos y no presentar el MVP como producción.

**Razón:** evitar decisiones comerciales o legales basadas en una demo.

**Consecuencia:** el README es más largo, pero el riesgo de malentendido baja.

---

<a id="lecciones"></a>

## 5. Lecciones aprendidas

### 5.1 El servidor es el único autorizado a calcular dinero

Todo precio, comisión, envío, servicio, propina y total se recalcula en servidor. El cliente puede mostrar una estimación, pero nunca es la fuente de verdad. Esta lección se repitió en la auditoría: los bugs de dinero suelen venir de confiar en el payload.

### 5.2 Las reglas de estado necesitan una máquina, no `if`s sueltos

Definir estados, transiciones y actores antes de programar evita inconsistencias. Cada transición debe ser idempotente y dejar un evento. Si el estado se puede cambiar desde tres lugares distintos, la regla se pierde.

### 5.3 La idempotencia se diseña desde el inicio

`clientRequestId`, `providerRef` y claves de transición evitan duplicados por reintentos, doble clic o webhooks repetidos. Agregarla después obliga a migrar datos y a limpiar duplicados.

### 5.4 Los webhooks son endpoints de dinero

Firma, monto, moneda, idempotencia y auditoría no son opcionales. Un webhook que solo “actualiza el estado” es una vulnerabilidad.

### 5.5 La autorización se prueba con casos negativos

No basta con probar que el cliente ve su pedido; hay que probar que no ve el de otro, que el repartidor no crea pedidos y que `SUPPORT` no reembolsa. La matriz de seguridad fue más útil que el flujo feliz.

### 5.6 La caché puede filtrar datos

`no-store` en rutas privadas no es un detalle de rendimiento. Si la respuesta depende de la sesión, no puede quedar en caché compartida.

### 5.7 El costo de un servicio externo es parte del diseño

KYC por sesión, SMS por mensaje y mapas por request tienen costo. Hay que poner cuotas y monitorear antes de que la factura sorprenda.

### 5.8 La app móvil no puede ser una copia de la web

Una app con dos roles necesita navegación, permisos y estados propios. Compartir la API está bien; compartir la UI sin adaptar es un error.

### 5.9 El preflight de producción evita errores caros

Validar variables al arrancar (`NEXT_PUBLIC_APP_URL` HTTPS, `TRUST_PROXY`, MFA, KYC, pagos, secretos) es más barato que descubrir la configuración incorrecta con usuarios reales.

### 5.10 Documentar no es desplegar

El proyecto tiene un diseño de despliegue sólido, pero no hay VPS ni dominio. La lección es separar “documentado” de “operativo” y no usar el checklist como si fuera evidencia.

### 5.11 La copia sanitizada necesita una nota de alcance

Una copia podada puede parecer un proyecto incompleto si no se explica. La nota de alcance evita que alguien intente compilar directorios vacíos o crea que faltan funciones.

### 5.12 El nombre y la marca cambian; el código debe ser consistente

Un cambio de marca requiere revisar README, docs, SVGs, metadatos, package.json y nombres de archivos. Los residuos textuales son fáciles de perder; conviene un grep final y una lista de verificación.

---

<a id="deuda"></a>

## 6. Deuda y próximos riesgos

| Riesgo | Por qué importa | Mitigación |
|---|---|---|
| Rate limit en memoria | No escala horizontalmente. | Redis/Upstash y pruebas de concurrencia. |
| Sin recuperación de contraseña | Bloquea usuarios y aumenta soporte. | Flujo con token de un solo uso y expiración. |
| Webhook Didit no firmado end-to-end | KYC depende de polling/callback. | Secreto, verificación y pruebas de replay. |
| Sin boleta electrónica | No apto para operar formalmente. | Integración SII y conciliación. |
| Sin monitoreo/SIEM | Incidentes invisibles. | APM, logs centralizados, alertas. |
| Sin backups de uploads | Pérdida de portadas. | Backup y restore probados. |
| CSP `unsafe-inline` | Superficie XSS. | Nonces/hashes y auditoría. |
| Sin integridad móvil | Dispositivos comprometidos. | Play Integrity, pinning, root detection. |
| Sin pentest externo | Riesgo residual desconocido. | Contratar y remediar. |
| Sin prueba de carga | Capacidad incierta. | k6 y presupuesto de latencia. |

### 6.1 Regla para el próximo ciclo

Antes de agregar una función nueva:

1. ¿Tiene regla de autorización?
2. ¿Tiene validación server-side?
3. ¿Tiene idempotencia?
4. ¿Tiene rate limit?
5. ¿Tiene evento/auditoría?
6. ¿Tiene prueba negativa?
7. ¿Está documentada?

Si alguna respuesta es “no”, la función no está lista.

---

**Volver:** [`README.md`](../README.md) · [`datasheet.md`](datasheet.md) · [`developer.md`](developer.md) · [`REFERENCES.md`](REFERENCES.md)
