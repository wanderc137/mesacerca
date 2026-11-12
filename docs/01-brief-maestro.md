# Brief maestro del proyecto

## 1. Origen

El proyecto nace de una solicitud explícita: construir una competencia **real y efectiva** para Rappi (mencionada en el brief como “Rapid”) en el mercado de pedidos de comida, con desarrollo propio, sello propio y una estética inspirada en Binance.

El sistema debe permitir que:

- Un dueño de cocinería se inscriba y reciba pedidos.
- Cargue sus platos, preparaciones, precios y disponibilidad.
- Un cliente seleccione local, preparaciones, pague y reciba su pedido.
- La cocinería decida si reparte con medios propios o recurre a repartidores freelance disponibles en su entorno.
- Existan aplicaciones para clientes y repartidores.
- La operación sea profesional, detallada y estéticamente seria.

## 2. Visión

> **La infraestructura digital de la cocina local.**
>
> Que cualquier cocinería de barrio pueda vender, operar y repartir con la misma calidad que una gran cadena, sin entregar 30% de su margen ni perder la relación con sus clientes.

## 3. Problema y oportunidad

### Para el local

- Comisiones altas y poco transparentes (25–30% + IVA en las grandes apps).
- Falta de control sobre el cliente y los datos.
- Herramientas pensadas para cadenas, no para cocinas pequeñas.
- Dependencia de apps que fijan precios, visibilidad y reglas.

### Para el cliente

- Tarifas que aparecen al final del checkout.
- Poca información sobre el local, la preparación y los tiempos reales.
- Experiencias inconsistentes entre apps.
- Oferta local poco descubrible frente a las grandes marcas.

### Para el repartidor

- Ingresos variables y poco explicables.
- Competencia desleal por pedidos.
- Falta de seguro, equipamiento y soporte.
- Reglas de asignación opacas.

### La oportunidad

- Mercado chileno de delivery ~US$2.000 millones, con crecimiento de dos dígitos.
- Segmento 45–66 años creciendo 62% en uso (2025), con ticket promedio de CLP 14.000–23.000.
- Restaurantes buscando canales propios y alternativas de menor comisión.
- FNE fiscalizando cláusulas de exclusividad y precios; espacio regulatorio para un entrante transparente.

## 4. Propuesta de valor

| Actor | Promesa |
|---|---|
| **Local** | “Vende más y quédate con más. Tú decides cómo repartir.” |
| **Cliente** | “Comida local, precio claro, entrega confiable.” |
| **Repartidor** | “Trabaja cuando quieras, cobra lo que ves.” |
| **Ciudad** | “Una plataforma que fortalece la cocina de barrio, no la reemplaza.” |

## 5. Actores y roles

### 5.1 Cliente

- Se registra con teléfono/email.
- Guarda direcciones y métodos de pago.
- Descubre locales por ubicación, categoría, rating, tiempo y promociones.
- Arma pedido con modificadores y notas.
- Paga con tarjeta, saldo o efectivo (según configuración).
- Sigue el pedido en mapa y línea de tiempo.
- Califica local y repartidor; abre disputas.

### 5.2 Dueño de local / cocinería

- Se registra y completa verificación (RUT, identidad, banco, Resolución Sanitaria cuando aplique).
- Configura local, horarios, zonas de reparto, tiempo de preparación y modo logístico.
- Carga categorías, platos, modificadores, fotos, precios y stock.
- Recibe pedidos en tiempo real; acepta, rechaza o pausa.
- Marca “en preparación” y “listo”.
- Decide: **reparto propio** o **solicitar repartidor MesaCerca**.
- Ve analítica, liquidaciones y reputación.
- Puede pausar el local o agotar productos.

### 5.3 Repartidor

- Se registra con identidad, vehículo, licencia (si aplica), cuenta bancaria y zona.
- Se conecta/desconecta cuando quiere.
- Recibe ofertas con pago, distancia, tiempo estimado y vencimiento.
- Acepta, navega, retira y entrega.
- Confirma con PIN, foto y geofence.
- Ve ganancias, historial, propinas y liquidaciones.
- Califica al local/cliente y reporta incidentes.

### 5.4 Administrador / soporte

- Verifica locales y repartidores.
- Supervisa pedidos en vivo y alertas.
- Resuelve cancelaciones, reembolsos y disputas.
- Configura zonas, tarifas, comisiones, promociones y horarios.
- Audita acciones sensibles.
- Exporta reportes financieros y operativos.

### 5.5 Sistema

- Calcula tarifas y ETA.
- Asigna repartidores.
- Envía notificaciones.
- Cobra y liquida.
- Detecta fraude y anomalías.
- Registra eventos y métricas.

## 6. Flujos clave

### 6.1 Cliente: pedido completo

1. Abre la web/app; detecta ubicación o la pide.
2. Ve locales disponibles en su zona.
3. Entra al local, revisa menú, fotos, rating, tiempo y costo de envío.
4. Agrega platos; elige modificadores y cantidades.
5. Revisa carrito con desglose: productos, envío, servicio, propina, total.
6. Elige entrega o retiro; programa si quiere.
7. Paga.
8. Recibe confirmación y tracking.
9. El local acepta; el pedido avanza.
10. El repartidor se asigna; el cliente ve posición y ETA.
11. Entrega con PIN/foto.
12. Cliente califica y, si algo falla, abre disputa.

### 6.2 Local: operación diaria

1. Abre dashboard; ve pedidos nuevos, en preparación, listos y en reparto.
2. Acepta o rechaza en < 3 minutos.
3. Imprime/comanda o ve detalle en pantalla.
4. Marca “en preparación” y “listo”.
5. Elige reparto propio o solicita repartidor.
6. Entrega al repartidor con código.
7. Ve liquidación y métricas del día.
8. Pausa el local si se satura.

### 6.3 Repartidor: entrega

1. Se conecta en zona.
2. Recibe oferta: local, distancia, pago, ETA, vencimiento.
3. Acepta.
4. Navega al local; confirma llegada.
5. Retira con código de pedido.
6. Navega al cliente; confirma entrega con PIN/foto.
7. Ve pago acumulado.
8. Si hay problema, reporta y soporte interviene.

### 6.4 Admin: incidente

1. Alerta por pedido demorado o cancelación.
2. Abre timeline del pedido y comunicaciones.
3. Decide reembolso, compensación o reasignación.
4. Registra resolución y notifica a las partes.
5. Auditoría deja traza.

## 7. Alcance funcional

### 7.1 MVP (3 días)

| Módulo | Incluye |
|---|---|
| **Autenticación** | Registro/login por email o teléfono; roles; sesión |
| **Cliente** | Home, búsqueda, local, menú, carrito, checkout, tracking, historial |
| **Local** | Onboarding básico, menú CRUD, pedidos en vivo, aceptar/rechazar, listo, reparto propio/solicitar |
| **Repartidor** | PWA, conexión, ofertas, aceptar, estados, PIN/foto, ganancias |
| **Dispatch** | Asignación por cercanía, rating y carga; reasignación |
| **Pagos** | Sandbox Mercado Pago; efectivo simulado; webhook |
| **Notificaciones** | In-app + push web + email; plantillas |
| **Admin** | Pedidos, locales, repartidores, disputas básicas, métricas |
| **Diseño** | Design system Binance-like; responsive; PWA |
| **Datos** | Seed de 1 ciudad, 3 comunas, 8 locales, 40 platos, 12 repartidores |

### 7.2 Fase 2 (30–60 días)

- Apps nativas iOS/Android (Expo).
- Pagos productivos (Transbank/Webpay + Mercado Pago).
- Verificación KYC de locales y repartidores.
- Boleta electrónica y conciliación SII.
- Cupones, promociones y suscripción MesaCerca+.
- Chat cliente-repartidor con números enmascarados.
- Panel de soporte con SLA.
- Analítica avanzada para locales.
- Multi-zona y tarifas dinámicas.
- Programa de referidos.

### 7.3 Fase 3 (90+ días)

- Segunda ciudad.
- Publicidad self-service para locales.
- Fintech: adelanto de liquidaciones, tarjeta, seguros.
- Integraciones POS (Bsale, Nubox, Toteat).
- API para locales y partners.
- Logística de flota propia en zonas densas.
- Modelo de suscripción para clientes.

## 8. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| **Rendimiento** | Home < 2,5 s en 4G; API p95 < 400 ms; tracking < 5 s de latencia |
| **Disponibilidad** | 99,5% en MVP; 99,9% en producción |
| **Escalabilidad** | 1.000 pedidos/día sin cambios de arquitectura; 10.000 con escalado horizontal |
| **Seguridad** | RBAC, aislamiento por local, cifrado en tránsito/reposo, auditoría |
| **Privacidad** | Minimización de datos, consentimiento, derechos ARCO, retención definida |
| **Accesibilidad** | WCAG 2.1 AA en flujos críticos |
| **Observabilidad** | Logs estructurados, métricas, trazas, alertas |
| **Recuperación** | Backup diario; RPO 24 h; RTO 4 h |
| **Compatibilidad** | Chrome/Safari/Firefox/Edge modernos; iOS/Android PWA |
| **Localización** | Español Chile; CLP; zona horaria America/Santiago |

## 9. Reglas de negocio

1. **Precio transparente:** el cliente ve el total antes de pagar; no hay cargos sorpresa.
2. **Sin cláusulas de precio mínimo:** el local puede ofrecer precios más bajos en su canal propio.
3. **Comisión sobre productos,** no sobre propina ni impuestos.
4. **Propina 100% al repartidor.**
5. **Cancelación:** cliente puede cancelar sin costo antes de que el local acepte; después, según estado.
6. **Auto-aceptación:** si el local no responde en 3 minutos, el pedido se cancela y se reembolsa.
7. **Reasignación:** si el repartidor no acepta o no llega, se reasigna automáticamente.
8. **Entrega:** PIN de 4 dígitos + foto; geofence de 150 m.
9. **Reparto propio:** el local asume SLA y responsabilidad; la plataforma cobra solo comisión de producto.
10. **Disputas:** ventana de 48 h; evidencia fotográfica; resolución en 72 h.
11. **Rating:** cliente califica local y repartidor; local califica repartidor; repartidor califica local.
12. **Suspensión:** locales y repartidores con métricas bajo umbral entran en revisión.
13. **Datos:** el local puede exportar sus clientes con consentimiento; la plataforma no vende datos.
14. **Publicidad:** siempre etiquetada; no altera el orden orgánico sin aviso.

## 10. Métricas de éxito

### North Star

**Pedidos entregados por semana con margen de contribución positivo.**

### Cliente

- Activación: % que completa primer pedido.
- Frecuencia: pedidos/mes.
- Retención M1/M3.
- Ticket promedio (AOV).
- NPS.
- Tiempo de entrega p50/p90.
- Tasa de cancelación y reembolso.

### Local

- Locales activos y GMV por local.
- Comisión efectiva.
- Tiempo de aceptación.
- Tasa de rechazo.
- Retención de locales a 90 días.
- NPS del local.

### Repartidor

- Repartidores activos por zona/hora.
- Tasa de aceptación.
- Entregas por hora.
- Ganancias por hora.
- Rotación.
- Incidentes por 1.000 entregas.

### Plataforma

- GMV.
- Take rate.
- Contribución por pedido.
- CAC y payback.
- Margen logístico.
- Uptime y latencia.

## 11. Fuera de alcance (MVP)

- Apps nativas publicadas en App Store/Google Play.
- Pagos productivos y boleta electrónica.
- Verificación KYC automática.
- Seguros y cobertura legal completa.
- Operación 24/7 y múltiples ciudades.
- Chat en vivo, pedidos grupales, reservas.
- Fidelización compleja, subastas de reparto, rutas multi-pedido.
- Integraciones POS y ERP.

## 12. Restricciones y supuestos

- Equipo pequeño; desarrollo asistido por IA.
- Presupuesto de infraestructura bajo (< US$100/mes en MVP).
- Sin oficina ni operación física inicial.
- Dependencia de proveedores externos: pagos, mapas, notificaciones, hosting.
- La operación piloto requiere socios locales y repartidores reales.
- La regulación chilena exige revisión legal antes de producción.

## 13. Decisiones abiertas

| # | Decisión | Impacto | Responsable |
|---|---|---|---|
| 1 | Nombre y marca | Alto | Dueño |
| 2 | Comunas piloto | Alto | Dueño |
| 3 | Alcance 3 días (demo vs piloto) | Alto | Dueño |
| 4 | Proveedor de pagos | Medio | Dueño + técnico |
| 5 | PWA vs app nativa | Medio | Técnico |
| 6 | Planes y comisiones definitivas | Alto | Dueño + finanzas |
| 7 | Política de reparto propio vs freelance | Alto | Operaciones |
| 8 | Presupuesto de marketing | Medio | Dueño |
| 9 | Revisión legal | Alto | Legal |
| 10 | Socios piloto | Alto | Dueño |
