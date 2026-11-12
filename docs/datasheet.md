# MesaCerca — Manual de usuario y operador

**Versión documentada:** MVP web/PWA + app Expo · 2026
**Audiencia:** clientes, locales, repartidores, administración y soporte.
**Alcance:** operación en Santiago de Chile, con pagos demo/sandbox y datos de ejemplo.

> Este manual describe el comportamiento del MVP verificado. No es un contrato comercial ni una promesa de disponibilidad. Antes de operar con dinero real o datos personales de producción, revisa el checklist de [Límites y preparación](#limites) y la política [SECURITY.md](../SECURITY.md).

---

## Índice

1. [Qué es MesaCerca](#que-es)
2. [Requisitos](#requisitos)
3. [Acceso y cuentas](#acceso)
4. [Manual del cliente](#cliente)
5. [Manual del local](#local)
6. [Manual del repartidor](#repartidor)
7. [Manual de administración y soporte](#admin)
8. [Pagos y dinero](#pagos)
9. [Estados de un pedido](#estados)
10. [Precios y comisiones](#precios)
11. [Verificación, MFA y KYC](#verificacion)
12. [Privacidad y seguridad](#privacidad)
13. [Solución de problemas](#problemas)
14. [Preguntas frecuentes](#faq)
15. [Límites y preparación para producción](#limites)

---

<a id="que-es"></a>

## 1. Qué es MesaCerca

MesaCerca es una plataforma de pedidos y reparto local. Un cliente pide comida de una cocina de su comuna; el local acepta, prepara y entrega o solicita un repartidor; el repartidor retira y entrega con PIN; la administración supervisa la operación, verifica cuentas y resuelve incidentes.

La plataforma tiene cuatro experiencias:

| Experiencia | Quién la usa | Dónde |
|---|---|---|
| Cliente | Persona que pide comida | Web/PWA en `/` y app Expo. |
| Local | Cocina, restaurante o dark kitchen | Panel `/merchant`. |
| Repartidor | Repartidor propio o freelance | Panel `/courier` y app Expo. |
| Administración | Administrador y soporte | Panel `/admin`. |

La web/PWA y la app comparten la misma API y las mismas reglas. Un pedido creado en la app se ve en el panel del local y viceversa.

---

<a id="requisitos"></a>

## 2. Requisitos

### 2.1 Cliente

- Navegador moderno con JavaScript (Chrome, Edge, Firefox o Safari recientes).
- Conexión a internet.
- Dirección dentro de la zona de cobertura (Santiago; 34 comunas cargadas en el seed).
- Email y teléfono para verificar la cuenta cuando la operación lo exija.
- Para la app: Expo Go o el build instalado en Android/iOS.

### 2.2 Local

- Computador o tablet con navegador moderno; se recomienda pantalla de al menos 1280 px para el tablero.
- Conexión estable.
- Datos legales del negocio: nombre, razón social, RUT, dirección y comuna.
- Menú con precios en CLP.
- Una persona responsable de aceptar pedidos y actualizar estados.
- KYC aprobado y email verificado cuando la producción lo exija.

### 2.3 Repartidor

- Teléfono con Expo Go o build instalado; también puede usar el panel web.
- Conexión móvil con datos.
- Documento de identidad para el KYC.
- Vehículo declarado: bicicleta, moto, auto o a pie.
- KYC aprobado; sin verificación no recibe ofertas.

### 2.4 Administración

- Navegador moderno.
- Cuenta `ADMIN` o `SUPPORT`.
- MFA activo cuando `MFA_ENFORCED=true`.
- Acceso a la red o VPN definida por la operación.

---

<a id="acceso"></a>

## 3. Acceso y cuentas

### 3.1 Registro

- **Cliente:** registro con nombre, email, teléfono y contraseña. La cuenta se crea como `CUSTOMER`.
- **Local:** registro con datos del negocio y del local. Queda pendiente de verificación; no puede operar hasta que administración lo apruebe.
- **Repartidor:** registro con datos personales y vehículo. Queda pendiente de KYC y verificación.
- **Administración:** las cuentas se crean por operación; no hay auto-registro de admin.

La contraseña debe tener al menos 8 caracteres. No se permite un email o teléfono ya registrado.

### 3.2 Inicio de sesión

1. Entra a `/login`.
2. Ingresa email y contraseña.
3. Si la cuenta tiene MFA, se pide el código TOTP.
4. Si la cuenta debe configurar MFA por política, se redirige a `/mfa/setup`.
5. Si todo está correcto, se redirige al inicio del rol: `/` (cliente), `/merchant`, `/courier` o `/admin`.

La sesión web usa una cookie `HttpOnly`. La app usa un token Bearer de 7 días. Al cerrar sesión, el token se revoca.

### 3.3 Cuentas demo

Solo para desarrollo. Contraseña común: **`mesacerca123`**.

| Rol | Email | Entrada |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `/` |
| Local | `local@mesacerca.cl` | `/merchant` |
| Repartidor | `repartidor@mesacerca.cl` | `/courier` |
| Admin | `admin@mesacerca.cl` | `/admin` |
| Repartidor QA | `courier2@mesacerca.cl` | `/courier` |
| Local QA con KYC | `tour.local@mesacerca.cl` | `/merchant` |

> No uses estas cuentas en producción. El seed crea datos ficticios y no debe ejecutarse en un entorno real.

### 3.4 Recuperación de contraseña

El MVP **no incluye** recuperación ni cambio de contraseña self-service. Si pierdes el acceso, contacta a soporte. Esta es una limitación conocida, no un flujo oculto.

---

<a id="cliente"></a>

## 4. Manual del cliente

### 4.1 Descubrir cocinas

En la home puedes:

- Buscar por nombre de local, cocina o plato.
- Filtrar por comuna.
- Filtrar por tipo de cocina.
- Ver rating, tiempo de preparación y estado del local.

Solo aparecen locales `ACTIVE` cuyo merchant esté `VERIFIED`. Un local pausado o suspendido no se muestra.

### 4.2 Armar el pedido

1. Abre un local.
2. Elige platos y modificadores.
3. Ajusta cantidades.
4. Agrega notas por ítem si necesitas aclarar algo.
5. Revisa el carrito.

El carrito se conserva en el dispositivo. Si un plato se agota o cambia de precio, el servidor lo valida al crear el pedido y puede rechazar la compra; el precio final nunca lo decide el navegador.

### 4.3 Checkout

En el checkout eliges:

- **Entrega a domicilio** o **retiro en el local**.
- Dirección, comuna e instrucciones.
- Propina.
- Método de pago.

El desglose muestra subtotal, envío, tarifa de servicio, propina y total. Revisa la comuna: la distancia y el envío se calculan con ella.

### 4.4 Seguimiento

Después de pagar, el pedido aparece en `/orders`. El seguimiento muestra:

- Estado actual y timeline.
- Mapa con la ubicación aproximada.
- ETA.
- PIN de entrega cuando corresponde.
- Botón de calificación al completarse.

El PIN de entrega es personal. No lo compartas con el repartidor antes de recibir el pedido.

### 4.5 Calificación

Solo puedes calificar pedidos `DELIVERED` o `COMPLETED`, una vez por pedido. La calificación actualiza el rating del local y, si hubo repartidor, el del repartidor.

### 4.6 Cancelaciones

El cliente puede cancelar mientras el pedido está en una etapa temprana. Si el pedido ya fue pagado, el reembolso se procesa según el proveedor y puede quedar pendiente. Si el local ya empezó a preparar, la cancelación puede requerir soporte.

---

<a id="local"></a>

## 5. Manual del local

### 5.1 Primeros pasos

1. Regístrate en `/registro/local`.
2. Completa datos del negocio y del local.
3. Espera la verificación de administración.
4. Completa KYC cuando se te solicite.
5. Verifica tu email.
6. Configura MFA si la operación lo exige.
7. Carga categorías y platos.
8. Publica el local cuando esté listo.

Un local pendiente puede preparar su menú, pero no recibir pedidos.

### 5.2 Tablero de pedidos

El tablero muestra pedidos en vivo. Las acciones disponibles dependen del estado:

| Estado | Acción del local |
|---|---|
| `PENDING_MERCHANT` | Aceptar o rechazar. |
| `ACCEPTED` | Pasar a `PREPARING`. |
| `PREPARING` | Marcar `READY`. |
| `READY` | Entregar al repartidor o cerrar si es retiro. |

Si el local tiene reparto propio, coordina la entrega con su equipo. Si usa la red MesaCerca, el pedido entra a la cola de reparto cuando está listo.

### 5.3 Menú

Puedes crear, editar, activar y desactivar:

- Categorías.
- Platos.
- Precios.
- Descripciones.
- Emoji o imagen.
- Disponibilidad y stock.

Reglas de validación:

- Nombre de categoría: 2–60 caracteres.
- Nombre de plato: 2–80 caracteres.
- Descripción: hasta 300 caracteres.
- Precio: entre $100 y $1.000.000 CLP.
- Imagen: URL HTTP/HTTPS válida o archivo permitido.

Los cambios se reflejan en la web y la app. Un plato agotado no se puede pedir.

### 5.4 Portada

La portada acepta JPG, PNG, WEBP o GIF de hasta 5 MB. Se valida el tipo real, el tamaño y las dimensiones. Si la imagen no cumple, se rechaza; no se guarda un archivo corrupto.

### 5.5 Analítica

El panel muestra pedidos, ventas, comisión y platos más vendidos de los últimos 30 días. Son datos operativos, no una liquidación contable. La liquidación se concilia por separado.

### 5.6 Planes y comisión

| Plan | Comisión | Reparto |
|---|---|---|
| Cocina | 12% + IVA | Propio. |
| Híbrido | 17% + IVA | Propio o red MesaCerca. |
| Full | 22% + IVA | Red MesaCerca. |

La comisión se calcula sobre el subtotal de productos, no sobre envío, propina ni impuestos. El plan se acuerda con administración y se refleja en la operación.

### 5.7 Suspensión

Administración puede suspender un local por seguridad, calidad, impagos o incumplimiento. Un local suspendido no recibe pedidos y su sesión se revoca. La reactivación requiere revisión.

---

<a id="repartidor"></a>

## 6. Manual del repartidor

### 6.1 Primeros pasos

1. Regístrate como repartidor.
2. Completa el KYC con Didit.
3. Espera la aprobación.
4. Verifica tu email.
5. Configura tu vehículo.
6. Conéctate cuando estés disponible.

Sin KYC aprobado, el panel y la API rechazan la operación. No hay forma de saltarse la verificación desde el cliente.

### 6.2 Conectarse

En `/courier` o en la app:

1. Pasa a `AVAILABLE`.
2. Recibe ofertas.
3. Acepta una oferta.
4. Pasa a `BUSY` mientras tienes un pedido.
5. Vuelve a `AVAILABLE` al terminar.

La ubicación se actualiza mientras estás conectado. Si te desconectas, dejas de recibir ofertas.

### 6.3 Ofertas

Cada oferta muestra:

- Local y zona aproximada.
- Pago estimado.
- Distancia.
- Tiempo estimado.
- Expiración.

La aceptación es atómica: si otro repartidor acepta primero, la oferta se cierra y recibes un mensaje. No hay doble asignación.

### 6.4 Retiro y entrega

1. Llega al local.
2. Muestra o ingresa el PIN de retiro.
3. Confirma el retiro.
4. Llega al cliente.
5. Pide el PIN de entrega.
6. Confirma la entrega.

El PIN de entrega lo tiene el cliente. Si falla 5 veces, se bloquea y requiere soporte. No pidas el PIN por teléfono antes de estar en la puerta.

### 6.5 Ganancias

La ganancia se compone de:

- Base por entrega.
- Pago por kilómetro.
- Espera sobre el tiempo definido.

El historial muestra entregas y montos. Es una estimación operativa; la liquidación final se concilia con la operación.

### 6.6 Seguridad

- No compartas datos del cliente.
- No aceptes pedidos fuera de la zona.
- No manipules el PIN.
- Reporta direcciones incorrectas o incidentes a soporte.
- Si te sientes en riesgo, cancela y contacta a soporte.

---

<a id="admin"></a>

## 7. Manual de administración y soporte

### 7.1 Acceso

`ADMIN` tiene acceso completo. `SUPPORT` puede consultar y operar soporte, pero no ejecutar acciones destructivas reservadas a `ADMIN`. Si `MFA_ENFORCED=true`, ambos deben tener MFA.

### 7.2 Métricas

El panel muestra GMV, comisión, pedidos activos, cancelaciones y alertas de:

- Pedidos atascados.
- Verificaciones pendientes.
- KYC por revisar.
- Pedidos sin repartidor.

### 7.3 Pedidos

Puedes filtrar por estado, local, cliente y fecha. Acciones:

- Ver detalle y timeline.
- Cancelar.
- Reembolsar.
- Reasignar soporte.

Un pedido `DELIVERED` o `COMPLETED` no se cancela; se reembolsa. Un pedido ya reembolsado no se vuelve a reembolsar.

### 7.4 Locales

- Verificar: exige KYC aprobado y email verificado cuando la política está activa.
- Suspender: revoca la sesión del usuario y oculta el local.
- Volver a pendiente: para revisión.

### 7.5 Repartidores

- Verificar: exige KYC aprobado.
- Suspender: revoca la sesión y lo deja `OFFLINE`.
- Volver a pendiente: para revisión.

### 7.6 KYC

Puedes ver casos, aprobar, rechazar o volver a pendiente con un motivo. Cada cambio queda en `AuditLog` con actor, estado anterior y estado nuevo. No apruebes un caso sin revisar las evidencias.

### 7.7 Reembolsos

1. Abre el pedido.
2. Verifica el estado del pago.
3. Ejecuta el reembolso.
4. Confirma que la pasarela respondió.
5. Registra el caso.

Un pago que llega después de una cancelación queda `REFUND_PENDING`; no se marca como reembolsado automáticamente.

### 7.8 Auditoría

Cada acción administrativa relevante escribe un `AuditLog` con actor, acción, entidad, antes/después e IP. La tabla es la fuente de verdad; no hay una UI completa de auditoría en el MVP.

---

<a id="pagos"></a>

## 8. Pagos y dinero

### 8.1 Métodos

| Método | Cuándo | Comportamiento |
|---|---|---|
| Demo (`mock`) | Desarrollo | Marca pagado sin pasarela. |
| Mercado Pago | Sandbox/producción | Checkout Pro; retorno por webhook. |
| Transbank Webpay Plus | Sandbox/producción | Checkout hospedado; retorno con validación. |
| Efectivo | Operación | Pago pendiente hasta la entrega. |

### 8.2 Reglas

- No se almacenan tarjetas.
- Los montos son CLP enteros, IVA incluido.
- La propina es 100% del repartidor.
- La comisión se calcula sobre el subtotal de productos.
- Un pedido no se marca pagado solo porque el cliente dice que pagó.
- Los webhooks validan firma, monto, moneda e idempotencia.
- Los reembolsos se ejecutan contra la pasarela cuando corresponde.

### 8.3 Antes de cobrar dinero real

- Probar sandbox de punta a punta.
- Probar webhook aprobado y rechazado.
- Probar reembolso y chargeback.
- Conciliar diariamente.
- Configurar boleta electrónica.
- Revisar obligaciones tributarias y legales.

---

<a id="estados"></a>

## 9. Estados de un pedido

| Estado | Significado | Responsable |
|---|---|---|
| `PENDING_PAYMENT` | Creado, esperando pago. | Cliente/pasarela. |
| `PAID` | Pago confirmado. | Sistema. |
| `PENDING_MERCHANT` | Esperando aceptación. | Local. |
| `ACCEPTED` | Aceptado. | Local. |
| `PREPARING` | En preparación. | Local. |
| `READY` | Listo. | Local. |
| `PENDING_COURIER` | Buscando repartidor. | Sistema. |
| `COURIER_ASSIGNED` | Repartidor asignado. | Repartidor. |
| `PICKED_UP` | Retirado. | Repartidor. |
| `DELIVERED` | Entregado. | Repartidor. |
| `COMPLETED` | Cerrado. | Sistema. |

Excepciones: cancelado por cliente, local o repartidor; expirado; reembolsado; en disputa.

Cada transición deja un evento. Si un pedido parece atascado, revisa el timeline antes de cambiarlo a mano. No existe una acción de “forzar estado” para soporte; las acciones destructivas son de `ADMIN`.

---

<a id="precios"></a>

## 10. Precios y comisiones

### 10.1 Cliente

| Concepto | Regla |
|---|---|
| Tarifa de servicio | 6% del subtotal; mínimo $500; máximo $1.500. |
| Envío | $1.900 base + $300/km sobre 2 km; máximo $4.900. |
| Propina | Libre; 100% al repartidor. |
| Impuestos | Incluidos en los precios mostrados. |

### 10.2 Local

| Plan | Comisión |
|---|---|
| Cocina | 12% + IVA. |
| Híbrido | 17% + IVA. |
| Full | 22% + IVA. |

### 10.3 Repartidor

| Concepto | Regla |
|---|---|
| Base | $1.300 por entrega. |
| Kilómetro | $250/km. |
| Espera | $80/min sobre 10 min. |

### 10.4 Ejemplo

Subtotal $15.000, 4 km, propina $1.000, plan Híbrido:

- Servicio: $900.
- Envío: $2.500.
- Total cliente: $19.400.
- Comisión local: $2.550 + IVA.
- Pago repartidor: $2.300.

Los valores son parámetros del MVP. No son una oferta comercial ni una proyección.

---

<a id="verificacion"></a>

## 11. Verificación, MFA y KYC

### 11.1 Email

La verificación envía un token con expiración. Si no llega, revisa spam y solicita reenvío. Hay rate limit para evitar abuso.

### 11.2 Teléfono

Se envía un código de 6 dígitos por SMS. En development puede aparecer en el log del servidor. El teléfono debe ser chileno: `+56 9 XXXX XXXX`.

### 11.3 MFA

Disponible para admin, soporte y local. Se configura con una app TOTP. Guarda los códigos de recuperación en un lugar seguro. Si pierdes el dispositivo y los códigos, contacta a soporte; no hay bypass automático.

### 11.4 KYC

El KYC se hace con Didit. Necesitas documento de identidad y una selfie con liveness. El proveedor puede pedir revisiones adicionales. Un caso `APPROVED` habilita la operación; `REJECTED` requiere corregir y reintentar; `PENDING` espera revisión.

El KYC tiene costo por sesión. No inicies sesiones repetidas sin necesidad; hay rate limit.

---

<a id="privacidad"></a>

## 12. Privacidad y seguridad

- La dirección exacta no se muestra al repartidor antes de aceptar.
- El cliente no ve la ubicación exacta del repartidor.
- Las sesiones se revocan al suspender una cuenta o activar MFA.
- Los paneles privados no se cachean.
- Los uploads se validan por tipo real, tamaño y dimensiones.
- Las acciones administrativas quedan auditadas.
- La retención de PII se ejecuta con un script; revisa el alcance antes de usarlo.
- No compartas tu contraseña, códigos MFA ni PIN.

Para incidentes de seguridad, sigue [SECURITY.md](../SECURITY.md). No publiques datos de clientes en reportes o capturas.

---

<a id="problemas"></a>

## 13. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| “Debes iniciar sesión” | Cookie/token ausente o expirado. | Vuelve a entrar; en la app, cierra sesión y vuelve a iniciar. |
| “Esta cuenta no puede hacer pedidos” | Rol distinto de cliente/admin. | Usa una cuenta de cliente. |
| “El local no está disponible” | Local pausado, cerrado o merchant no verificado. | Elige otro local o contacta al local. |
| “Plato agotado” | Stock o disponibilidad cambiaron. | Quita el plato y vuelve a intentar. |
| “Dirección fuera de cobertura” | Comuna/distancia fuera de zona. | Cambia la dirección o elige retiro. |
| “Demasiados intentos” | Rate limit. | Espera el tiempo indicado. |
| “Tu cuenta de repartidor aún no está verificada” | KYC pendiente o rechazado. | Completa o corrige el KYC. |
| “PIN incorrecto” | PIN equivocado o bloqueado. | Verifica con el cliente/local; tras 5 intentos, contacta soporte. |
| “Pago rechazado” | Pasarela rechazó la transacción. | Prueba otro método o revisa con el emisor. |
| “No se pudo iniciar KYC” | Proveedor, configuración o rate limit. | Reintenta más tarde; si persiste, soporte. |
| La app no conecta | IP/servidor incorrecto. | Revisa `EXPO_PUBLIC_API_URL` y que el servidor escuche en `0.0.0.0`. |
| MFA no acepta el código | Reloj desincronizado. | Sincroniza la hora del teléfono y reintenta. |

### 13.1 Si un pedido queda atascado

1. Revisa el timeline y el último `OrderEvent`.
2. Confirma el estado del pago.
3. Confirma si el local o el repartidor tienen una acción pendiente.
4. Si hay un error de operación, escala a administración.
5. No cambies el estado en la base de datos sin registrar el incidente.

### 13.2 Si un pago se cobró dos veces

1. No reintentes el cobro.
2. Revisa `Payment.providerRef` y el estado.
3. Compara con la pasarela.
4. Si hay duplicado, reembolsa el excedente y documenta.
5. Escala a administración.

---

<a id="faq"></a>

## 14. Preguntas frecuentes

**¿MesaCerca opera en toda Chile?**
No. El MVP está enfocado en Santiago y carga 34 comunas. La expansión es parte del roadmap.

**¿Puedo pedir si soy dueño de un local?**
No desde tu propio local. La regla evita autopedidos y fraude.

**¿El repartidor ve mi dirección exacta antes de aceptar?**
No. Ve una referencia aproximada. La dirección exacta se usa para la entrega después de aceptar.

**¿Puedo pagar con tarjeta?**
Sí, mediante Mercado Pago o Transbank en sandbox/producción. En demo, el pago se simula.

**¿Hay app para iOS?**
La app Expo puede ejecutarse en iOS con Expo Go, pero no hay build publicado en App Store.

**¿Hay notificaciones push?**
No en el MVP. La app usa polling cada 5 segundos.

**¿Puedo cancelar después de pagar?**
Depende del estado. Si el local ya empezó, puede requerir soporte y el reembolso puede quedar pendiente.

**¿Dónde veo mi boleta?**
El MVP no emite boleta electrónica. Es un pendiente antes de producción.

**¿Cómo reporto un problema de seguridad?**
Sigue [SECURITY.md](../SECURITY.md) y escribe al canal indicado. No publiques el detalle en un issue abierto.

---

<a id="limites"></a>

## 15. Límites y preparación para producción

Este manual describe un MVP. Antes de operar con clientes reales:

- [ ] Desplegar en infraestructura propia con HTTPS y backups.
- [ ] Probar pagos reales en sandbox y conciliación.
- [ ] Configurar KYC live y webhook firmado.
- [ ] Emitir boleta electrónica.
- [ ] Revisar Ley 21.431, Ley 21.719 y Ley 19.496 con abogados.
- [ ] Contratar seguros y definir protocolo de incidentes.
- [ ] Implementar recuperación de contraseña.
- [ ] Mover rate limiting a Redis/Upstash.
- [ ] Configurar monitoreo, alertas y logs centralizados.
- [ ] Hacer pentest externo y prueba de carga.
- [ ] Publicar la app en tiendas con build EAS.
- [ ] Definir soporte, SLA y proceso de reembolsos.

Mientras esos puntos no estén cerrados, no uses datos personales reales ni dinero real. La lista completa de límites técnicos está en el [README](../README.md#limites) y en [`23-estado-y-operacion.md`](23-estado-y-operacion.md).

---

**Soporte documental:** [`README.md`](../README.md) · [`developer.md`](developer.md) · [`REFERENCES.md`](REFERENCES.md) · [`BITACORA.md`](BITACORA.md)
