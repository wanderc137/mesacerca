# MesaCerca — Documentación para desarrolladores

**Stack:** Next.js 16.4.5 · React 19.3 · TypeScript · PostgreSQL 18 · Prisma 6.19.3 · Tailwind CSS 4 · Expo SDK 58
**Audiencia:** desarrolladores que mantienen, extienden o auditan el código.
**Estado:** MVP funcional y verificado; esta copia está podada para documentación.

---

## Índice

1. [Visión general](#vision)
2. [Estructura del repositorio](#estructura)
3. [Ciclo de una petición](#peticion)
4. [Autenticación y autorización](#auth)
5. [Modelo de datos](#datos)
6. [Máquina de estados](#estados)
7. [Creación de un pedido](#pedido)
8. [Precios y comisiones](#precios)
9. [Pagos](#pagos)
10. [Dispatch de repartidores](#dispatch)
11. [KYC, MFA y verificación](#kyc)
12. [API](#api)
13. [Server actions](#actions)
14. [Frontend web y PWA](#frontend)
15. [App móvil](#movil)
16. [Seguridad](#seguridad)
17. [Pruebas y QA](#qa)
18. [Cómo extender](#extender)
19. [Depuración](#debug)
20. [Límites y deuda técnica](#deuda)

---

<a id="vision"></a>

## 1. Visión general

MesaCerca es un **monolito modular** en Next.js App Router. Una sola aplicación sirve:

- La web pública y el área de cliente.
- Los paneles de local, repartidor y administración.
- La API REST que consume la app Expo.
- Los webhooks de pago y KYC.
- El healthcheck.

PostgreSQL es la única fuente de verdad. No hay microservicios, cola externa ni caché distribuida en el MVP. La app móvil no tiene lógica de negocio propia: consume la misma API y las mismas reglas.

### 1.1 Principios de diseño

| Principio | Implicación práctica |
|---|---|
| El servidor manda | Precios, totales, roles y transiciones se recalculan/validan en servidor. |
| Dinero en enteros | CLP sin decimales; no floats en la ruta de dinero. |
| Snapshots históricos | `OrderItem` conserva nombre y precio del momento de compra. |
| Eventos append-only | `OrderEvent` y `AuditLog` explican qué pasó. |
| Idempotencia | `clientRequestId`, webhooks y transiciones evitan duplicados. |
| Mínima exposición | Cada rol ve solo lo necesario; la dirección exacta se revela después de aceptar. |
| Fallar cerrado | Sin sesión/rol/verificación, la operación se rechaza. |

### 1.2 Qué NO es

- No es un sistema de microservicios.
- No es una app nativa publicada en tiendas.
- No es un procesador de pagos: delega en Mercado Pago y Transbank.
- No es un proveedor de identidad: delega el KYC en Didit.
- No es un sistema contable ni tributario.

---

<a id="estructura"></a>

## 2. Estructura del repositorio

### 2.1 Árbol de esta copia

```
mesacerca/
├── app/
│   ├── (auth)/                 # login, registro, MFA, verificación
│   ├── (dashboard)/
│   │   ├── admin/              # panel administración
│   │   ├── courier/            # panel repartidor
│   │   ├── kyc/                # estado KYC
│   │   └── merchant/           # panel local
│   ├── (public)/               # home, checkout, pedidos, legal, soporte
│   ├── actions/                # server actions
│   ├── api/                    # route handlers
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.ts
│   └── not-found.tsx
├── docs/                       # 23 documentos + manuales + assets SVG
├── public/                     # icono, service worker, uploads
├── mobile/                     # app Expo (podada en esta copia)
├── prisma/                     # schema/migrations (podado en esta copia)
├── assets/                     # README de assets
├── Dockerfile
├── next.config.ts
├── proxy.ts
├── instrumentation.ts
├── vercel.json
├── package.json
├── SECURITY.md
└── README.md
```

> **Copia podada.** En esta edición faltan `lib/` (excepto directorios vacíos), `components/`, `prisma/schema.prisma`, `prisma/seed.ts`, `scripts/`, `deploy/` y `mobile/src/`. Los imports existen, pero el árbol de runtime completo no está incluido. No intentes compilar esta copia sin restaurar esos directorios.

### 2.2 Estructura esperada del árbol completo

| Ruta | Contenido |
|---|---|
| `lib/auth.ts` | Sesión, JWT, cookies, `homeForRole`. |
| `lib/db.ts` | Cliente Prisma singleton. |
| `lib/orders/` | Creación, transiciones, dispatch, PIN. |
| `lib/payments/` | Proveedores, sync, webhooks, reembolsos. |
| `lib/courier/` | Datos del panel y ganancias. |
| `lib/merchant/` | Consultas del panel y analítica. |
| `lib/kyc.ts` | Didit, workflow, callback. |
| `lib/mfa.ts` | TOTP, cifrado, recovery codes. |
| `lib/verification.ts` | Email y SMS. |
| `lib/rate-limit.ts` | Rate limit en memoria e IP real. |
| `lib/validation.ts` | Esquemas Zod. |
| `lib/pricing.ts` | Tarifas y comisión. |
| `lib/constants.ts` | Comunas, cocinas, planes, estados. |
| `lib/audit.ts` | `AuditLog`. |
| `components/` | UI compartida, carrito, mapas, PWA. |
| `scripts/` | Plataforma local, smoke, backups, KYC, seguridad. |
| `deploy/` | Compose, Caddy, entrypoint, migraciones, backups. |
| `mobile/src/` | Rutas, contextos, API client, componentes. |

### 2.3 Convenciones

- TypeScript estricto; evitar `any` en dominio.
- Server Components por defecto; `"use client"` solo cuando hay estado/eventos.
- Server Actions para formularios y mutaciones autenticadas.
- Route Handlers para API, webhooks y móvil.
- Zod en el borde; tipos derivados cuando sea posible.
- Errores de usuario en español, claros y sin filtrar detalles internos.
- No registrar secretos, tokens, PII ni payloads completos de pago.
- Comentarios solo cuando explican una decisión no obvia.

---

<a id="peticion"></a>

## 3. Ciclo de una petición

### 3.1 Página (Server Component)

1. Next.js resuelve el layout y la página.
2. La página llama a `getSession()` si necesita usuario.
3. El layout de rol redirige si el rol no corresponde.
4. Prisma consulta los datos.
5. Se renderiza HTML/RSC.
6. Si la página es privada, `next.config.ts` aplica `Cache-Control: private, no-store`.

### 3.2 Server Action

1. El formulario envía `FormData`.
2. La action obtiene sesión y valida rol.
3. Valida campos con Zod o comprobaciones explícitas.
4. Verifica pertenencia del recurso (por ejemplo, que el plato sea del merchant).
5. Ejecuta Prisma, preferentemente en transacción.
6. Escribe auditoría si es una acción administrativa.
7. `revalidatePath` invalida la vista.
8. Redirige o devuelve estado.

### 3.3 Route Handler

1. `getRequestSession(request)` resuelve cookie o Bearer.
2. Rate limit por usuario/IP.
3. Límite de body (`Content-Length`).
4. Parseo JSON y validación Zod.
5. Reglas de dominio.
6. Prisma/transacción.
7. Respuesta JSON con códigos HTTP correctos.

### 3.4 Webhook

1. Recibe el payload crudo.
2. Verifica firma con comparación timing-safe.
3. Valida monto/moneda/referencia.
4. Comprueba idempotencia.
5. Actualiza `Payment` y `Order` en transacción.
6. Escribe evento.
7. Responde `200` rápido; si falla, no marca pagado.

---

<a id="auth"></a>

## 4. Autenticación y autorización

### 4.1 Sesión web

- JWT firmado con `jose`.
- Claims: usuario, rol, `tokenVersion`, propósito, issuer/audience.
- Cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- `getSession()` valida firma, expiración y `tokenVersion` contra la base.
- `createSession()` emite la cookie.
- `clearSession()` la elimina.
- `homeForRole()` centraliza la redirección por rol.

### 4.2 Sesión móvil

- `POST /api/mobile/auth/login` devuelve un Bearer de 7 días.
- La app lo guarda en SecureStore.
- `getRequestSession(request)` acepta cookie o `Authorization: Bearer`.
- El token móvil también lleva `tokenVersion`; al revocar, deja de servir.
- Si la cuenta tiene MFA, el login móvil responde `403`; no se implementa un bypass.

### 4.3 Contraseñas

- `bcryptjs` con costo adecuado.
- Comparación contra `DUMMY_PASSWORD_HASH` cuando el email no existe, para reducir diferencias de tiempo.
- Mínimo 8 caracteres.
- No hay recuperación/cambio self-service en el MVP.

### 4.4 Roles

```ts
type Role = "CUSTOMER" | "MERCHANT" | "COURIER" | "ADMIN" | "SUPPORT";
```

Reglas:

- `CUSTOMER`: pedidos propios, direcciones propias, reseñas propias.
- `MERCHANT`: su merchant, sus stores, sus categorías/platos, sus pedidos.
- `COURIER`: su perfil, sus ofertas, sus entregas, sus ganancias.
- `ADMIN`: todo, incluidas acciones destructivas.
- `SUPPORT`: lectura y soporte; sin acciones destructivas.

### 4.5 `tokenVersion`

Se incrementa al:

- Suspender un usuario.
- Activar MFA.
- Cambiar contraseña (cuando exista el flujo).
- Revocar sesiones por incidente.

Un JWT con `tokenVersion` anterior se rechaza aunque no haya expirado.

### 4.6 Redirección segura

`safeNext()` solo acepta rutas internas:

- Rechaza `//`, `\`, caracteres de control y orígenes distintos.
- Si el destino no es válido, usa `homeForRole()`.

---

<a id="datos"></a>

## 5. Modelo de datos

El esquema real está en `prisma/schema.prisma` (no incluido en esta copia). Las entidades y relaciones documentadas son:

### 5.1 Identidad

| Modelo | Campos clave |
|---|---|
| `User` | `id`, `email` único, `phone` único, `name`, `role`, `status`, `passwordHash`, `emailVerifiedAt`, `phoneVerifiedAt`, `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes`, `tokenVersion`, timestamps. |
| `Address` | `userId`, `label`, `line1`, `comuna`, `city`, `lat`, `lng`, `instructions`, `isDefault`. |

### 5.2 Oferta

| Modelo | Campos clave |
|---|---|
| `Merchant` | `ownerId` único, `name`, `legalName`, `rut`, `status`, `logoUrl`, `coverUrl`, `rating`, `commissionPlan`, `deliveryMode`. |
| `Store` | `merchantId`, `name`, `slug` único, `address`, `comuna`, `lat/lng`, `phone`, `status`, `prepTimeMin`, `radiusKm`, `opensAt/closesAt`. |
| `Category` | `storeId`, `name`, `position`. |
| `MenuItem` | `categoryId`, `name`, `description`, `price` Int, `imageUrl`, `available`, `stock`, `position`. |
| `Modifier` | `itemId`, `type` `SINGLE`/`MULTIPLE`, `required`, `min`, `max`. |
| `ModifierOption` | `modifierId`, `name`, `priceDelta`. |

### 5.3 Pedido

| Modelo | Campos clave |
|---|---|
| `Order` | `code` único, `clientRequestId` único, `customerId`, `storeId`, `courierId?`, `status`, `deliveryMode`, `fulfillment`, `subtotal`, `deliveryFee`, `serviceFee`, `tip`, `discount`, `total`, `commissionAmount`, `paymentStatus`, `paymentProvider`, `pickupPin`, `deliveryPin`, timestamps. |
| `OrderItem` | `orderId`, `itemId?`, `nameSnapshot`, `unitPrice`, `quantity`, `modifiersJson`, `notes`. |
| `OrderEvent` | `orderId`, `type`, `actorId?`, `payload` JSON, `createdAt`. |
| `Payment` | `orderId` único, `provider`, `providerRef`, `status`, `amount`, `fee`, `raw` JSON. |
| `Review` | `orderId`, `authorId`, `targetType`, `targetId`, `rating`, `comment`. |
| `Courier` | `userId` único, `vehicle`, `status`, `rating`, `currentLat/Lng`, `lastSeenAt`, `verificationStatus`. |
| `DeliveryOffer` | `orderId`, `courierId`, `status`, `score`, `expiresAt`. |
| `KycCase` | `userId`, `role`, `provider`, `providerRef`, `status`, `reason`, `reviewedAt`. |
| `AuditLog` | `actorId`, `action`, `entity`, `entityId`, `before`, `after`, `ip`, `createdAt`. |

### 5.4 Índices

Los índices críticos son:

- `Order(status, createdAt)`.
- `Order(storeId, status, createdAt)`.
- `Order(customerId, createdAt)`.
- `Store(comuna, status)`.
- `Courier(status, lastSeenAt)`.
- `DeliveryOffer(orderId, status)`.
- `Payment(providerRef)`.
- `Review(targetType, targetId)`.
- Coordenadas `Store(lat,lng)` y `Courier(currentLat,currentLng)`; PostGIS es futuro.

### 5.5 Reglas de integridad

- Un pedido siempre tiene cliente y local.
- Un pedido con reparto de red puede tener `courierId` nulo hasta la asignación.
- Un `Payment` pertenece a un solo pedido.
- Una `Review` no se duplica por autor/pedido.
- `OrderItem` conserva snapshot aunque el plato se elimine.
- Los eventos no se actualizan ni se borran; se agregan.

---

<a id="estados"></a>

## 6. Máquina de estados

### 6.1 Flujo feliz

```
PENDING_PAYMENT
  → PAID
  → PENDING_MERCHANT
  → ACCEPTED
  → PREPARING
  → READY
  → PENDING_COURIER
  → COURIER_ASSIGNED
  → PICKED_UP
  → DELIVERED
  → COMPLETED
```

### 6.2 Excepciones

`CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_MERCHANT`, `CANCELLED_BY_COURIER`, `EXPIRED`, `REFUNDED`, `DISPUTED`.

### 6.3 Reglas de implementación

- Cada transición comprueba actor y estado de origen.
- La transición es idempotente: `orderId:from:to` evita aplicar dos veces.
- Se escribe un `OrderEvent` por transición.
- Los timers se cancelan al cambiar de estado.
- Un pedido con reparto propio (`OWN`) no entra a dispatch de red.
- Un pedido `DELIVERED`/`COMPLETED` no se cancela; se reembolsa.
- Un pago posterior a cancelación queda `REFUND_PENDING`.

### 6.4 Tiempos

| Timer | Objetivo | Estado actual |
|---|---|---|
| Expiración de pago | 15 min | Diseño; cron cada 5 min. |
| Auto-cancelación de local | 3 min | Implementación cancela a 5 min (`docs/11`). |
| Expiración de oferta | 30 s | Diseño; aceptación atómica. |
| Escalado sin repartidor | 5 min | Diseño. |
| Alerta listo sin retiro | 10 min | Diseño. |
| Cierre de disputa | 48 h | Diseño. |

No agregues un timer sin definir qué evento escribe, qué pasa si el proceso se reinicia y cómo se evita la doble ejecución.

---

<a id="pedido"></a>

## 7. Creación de un pedido

El endpoint principal es `POST /api/orders` (`app/api/orders/route.ts`). Es el mejor ejemplo de las reglas del dominio.

### 7.1 Orden de comprobaciones

1. **Sesión.** Sin sesión → `401`.
2. **Rol.** Solo `CUSTOMER` o `ADMIN` → `403`.
3. **Rate limit.** 12 pedidos/minuto por usuario → `429` + `Retry-After`.
4. **Body.** Límite de tamaño → `413`; JSON inválido → `400`.
5. **Zod.** `createOrderSchema` → `400`.
6. **Idempotencia.** `clientRequestId` existente:
   - de otro usuario → `409`;
   - del mismo → respuesta idempotente.
7. **Local.** `ACTIVE`, merchant `VERIFIED` → `404`.
8. **Autopedido.** Merchant dueño → `403`.
9. **Dirección.** Si `DELIVERY`, debe venir → `400`.
10. **Ítems.** Pertenecen al local, disponibles, modificadores válidos, requeridos, min/max.
11. **Mínimo.** `store.minOrder`.
12. **Distancia.** `distanceForComuna`; 0 si `PICKUP`.
13. **Tarifas.** `calculateFees`.
14. **Creación.** Order + items + evento + payment en transacción.
15. **Pago.** Efectivo → `PENDING_MERCHANT`; pasarela → URL/redirect.

### 7.2 Snapshots

Por cada línea se guarda:

```ts
{
  itemId,
  nameSnapshot: item.name,
  unitPrice: item.price + modifierDelta,
  quantity,
  modifiersJson,
  notes
}
```

El precio unitario se calcula en servidor. El cliente no puede enviar `unitPrice`.

### 7.3 Idempotencia

`clientRequestId` se genera en el cliente por intento de compra. Si la red falla y el usuario reintenta, el servidor devuelve el pedido existente en lugar de crear otro.

Si dos requests simultáneos usan el mismo `clientRequestId`, la restricción única produce `P2002`; el handler recupera el pedido existente y responde idempotente.

### 7.4 Pago en efectivo

El pedido pasa a `PENDING_MERCHANT` con `paymentStatus: PENDING` y evento `PAYMENT_CASH_PENDING`. No se marca pagado hasta que el repartidor confirma la entrega y se registra el cobro.

### 7.5 Pago online

Se crea `Payment` en estado `PENDING`, se llama al proveedor y se devuelve la URL de checkout. El pedido queda `PENDING_PAYMENT` hasta el webhook/retorno. Si el proveedor falla, se marca `FAILED` y el pedido no avanza.

---

<a id="precios"></a>

## 8. Precios y comisiones

### 8.1 Funciones esperadas

| Función | Responsabilidad |
|---|---|
| `calculateFees({ subtotal, distanceKm, deliveryMode, tip, commissionRate })` | Calcula servicio, envío, comisión y total. |
| `distanceForComuna(comuna)` | Distancia estimada para tarifa. |
| `COMMISSION_RATES` | 12/17/22 según plan. |
| `COMUNA_BY_NAME` | Coordenadas/comuna. |

### 8.2 Fórmulas

```
serviceFee = clamp(subtotal * 0.06, 500, 1500)
deliveryFee = min(1900 + max(0, distanceKm - 2) * 300, 4900)
commission = round(subtotal * commissionRate / 100)
total = subtotal + serviceFee + deliveryFee + tip - discount
```

En `PICKUP`, `deliveryFee = 0` y `distanceKm = 0`. La comisión se calcula sobre `subtotal`, no sobre `serviceFee`, `deliveryFee` ni `tip`.

### 8.3 Redondeo

- Todos los montos son enteros CLP.
- `Math.round` solo en el punto de cálculo permitido.
- No sumar floats ni usar `toFixed` para dinero.
- El total se reconstruye en servidor; nunca se acepta del cliente.

### 8.4 Comisión y liquidación

La comisión del local se registra en el pedido. La liquidación semanal (corte domingo 23:59, pago miércoles) es un proceso operativo; el MVP no implementa un motor de payout.

---

<a id="pagos"></a>

## 9. Pagos

### 9.1 Interfaz de proveedor

La capa `lib/payments` define un tipo común:

```ts
type PaymentProvider = "MOCK" | "MERCADOPAGO" | "TRANSBANK" | "CASH";

type CreatePaymentResult = {
  provider: PaymentProvider;
  providerRef: string;
  redirectUrl?: string;
  status: "PENDING" | "PAID" | "FAILED";
};
```

Cada proveedor implementa creación, consulta, webhook y reembolso según corresponda.

### 9.2 Mercado Pago

- Checkout Pro.
- `init_point` como URL de redirección.
- Webhook `/api/payments/webhook/mercadopago`.
- Retorno `/api/payments/mercadopago/return`.
- Firma con `MERCADOPAGO_WEBHOOK_SECRET`.
- Producción rechaza tokens `TEST-`.

### 9.3 Transbank

- Webpay Plus.
- Retorno `/api/payments/transbank/return/[orderId]`.
- `TRANSBANK_ENVIRONMENT=integration|production`.
- En integración, credenciales públicas si no hay configuración.
- En producción, comercio/llaves reales; se rechaza integración.
- Se valida `buy_order`, monto y estado.

### 9.4 Webhooks

Checklist para un webhook correcto:

1. Leer el cuerpo crudo, no el JSON reserializado.
2. Verificar firma antes de parsear.
3. Comparar en tiempo constante.
4. Validar monto y moneda contra el pedido.
5. Usar `providerRef` como clave de idempotencia.
6. Actualizar `Payment` y `Order` en transacción.
7. Escribir `OrderEvent`.
8. Responder `2xx`; en error, `4xx/5xx` para reintento.

### 9.5 Reembolsos

- Solo `ADMIN`.
- Se ejecutan contra la pasarela cuando el pago está `PAID` o `REFUND_PENDING`.
- Si el pago no se completó, se cancela el pedido.
- Nunca se marca `REFUNDED` solo en base de datos sin confirmación del proveedor.
- Un pago que llega después de una cancelación queda `REFUND_PENDING` para revisión.

### 9.6 Efectivo

No hay pasarela. El pago se confirma al entregar. El estado del pedido y el estado del pago son independientes hasta ese momento.

---

<a id="dispatch"></a>

## 10. Dispatch de repartidores

### 10.1 Diseño documentado

Score:

```
0.40 * distancia
+ 0.20 * rating
+ 0.20 * acceptance
+ 0.10 * idle
- 0.10 * loadPenalty
```

- Radio de 5 km.
- Oferta al top 1/3.
- Timeout de 30 s.
- Hasta 3 rondas.
- Luego incentivo/notificación.

### 10.2 Implementación

- `DeliveryOffer` guarda `orderId`, `courierId`, `status`, `score`, `expiresAt`.
- La aceptación es atómica; si dos repartidores aceptan, solo uno gana.
- Un pedido con reparto propio no entra.
- El repartidor debe estar `AVAILABLE` y verificado.
- La ubicación se actualiza desde la app/panel.
- El panel muestra ofertas y entregas activas.

### 10.3 Extensiones

Para mejorar el dispatch:

- Calcular distancia real por ruta, no solo comuna.
- Agregar `loadPenalty` por pedidos activos.
- Implementar batching con ventana temporal.
- Medir acceptance rate por repartidor.
- Añadir reintentos y fallback a admin.

---

<a id="kyc"></a>

## 11. KYC, MFA y verificación

### 11.1 KYC

- `lib/kyc.ts` encapsula Didit.
- `startKyc(user, role)` crea una sesión y devuelve `redirectUrl`.
- El workflow `MesaCerca Courier Strict` tiene ID `a08dab96-d9f6-4618-9f9e-a31babd0f1db`.
- `setKycStatusAction` permite a admin aprobar/rechazar/pending con motivo.
- Cada cambio escribe `AuditLog`.
- Rate limit de 3 inicios por hora por usuario para controlar costo.
- `KYC_PROVIDER=didit` activa el proveedor; sin él, el flujo queda deshabilitado o en modo pendiente.

### 11.2 MFA

- `lib/mfa.ts`: `createTotpSecret`, `verifyTotp`, `encryptMfaSecret`, `decryptMfaSecret`, `generateRecoveryCodes`, `hashRecoveryCodes`, `consumeRecoveryCode`.
- Secreto cifrado con AES-256-GCM y `MFA_ENCRYPTION_KEY`.
- Cookie temporal de setup: `MFA_SETUP_SECRET_COOKIE`, HttpOnly, SameSite=Lax, Secure en prod, 10 min.
- Activación: `mfaEnabled=true`, `mfaSecret`, `mfaRecoveryCodes`, `mfaEnabledAt`, `tokenVersion++`.
- Roles: `ADMIN`, `SUPPORT`, `MERCHANT`.
- La app móvil no soporta MFA; el login móvil rechaza cuentas con MFA.

### 11.3 Email

- `lib/verification.ts`: `startEmailVerification`, `verifyEmailToken`.
- Resend como proveedor.
- Token con expiración.
- Rate limit de reenvío.

### 11.4 Teléfono

- `startPhoneVerification`, `verifyPhoneCode`.
- Twilio.
- Código de 6 dígitos con expiración.
- `normalizePhone` acepta `+56 9...`, `56 9...`, `9...`, `09...`.
- En development, el código se registra en el log.

---

<a id="api"></a>

## 12. API

### 12.1 Convenciones

- JSON.
- Cookie web o `Authorization: Bearer`.
- Errores `{ error: string }`.
- Códigos: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`, `503`.
- Rate limit con `Retry-After` cuando aplica.
- No se devuelven secretos, tokens ni payloads de pago completos.

### 12.2 Endpoints web

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Estado de la base; sin datos sensibles. |
| `POST` | `/api/orders` | Cliente/Admin | Crear pedido. |
| `GET` | `/api/courier` | Repartidor | Dashboard del repartidor. |
| `POST` | `/api/reviews` | Cliente | Calificar pedido entregado. |
| `GET` | `/api/payments/webhook/mercadopago` | Público firmado | Webhook MP. |
| `GET` | `/api/payments/mercadopago/return` | Cliente | Retorno MP. |
| `GET` | `/api/payments/transbank/return/[orderId]` | Cliente | Retorno Transbank. |
| `GET` | `/api/uploads/[...path]` | Público | Servir portadas de locales. |
| `GET` | `/api/cron/orders` | Cron firmado | Cancelar pedidos atascados. |

### 12.3 Endpoints móviles

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/mobile/auth/login` | Login con Bearer. |
| `GET` | `/api/mobile/me` | Perfil. |
| `GET` | `/api/mobile/home` | Home. |
| `GET` | `/api/mobile/stores/[slug]` | Local. |
| `GET` | `/api/mobile/addresses` | Direcciones. |
| `GET` | `/api/mobile/orders` | Pedidos. |
| `GET/PATCH` | `/api/orders/[id]` | Detalle/transición. |
| `POST` | `/api/courier/status` | Conectarse/desconectarse. |
| `POST` | `/api/courier/location` | Actualizar ubicación. |
| `GET` | `/api/mobile/courier/earnings` | Ganancias. |

> En esta copia podada solo están `app/api/courier`, `health`, `orders`, `reviews` y `uploads`. El resto de rutas está documentado, pero no incluido.

### 12.4 Ejemplo de creación de pedido

```ts
const response = await fetch("/api/orders", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    storeId: "store_123",
    items: [
      { itemId: "item_456", quantity: 2, notes: "Sin cebolla" }
    ],
    deliveryMode: "DELIVERY",
    address: {
      line1: "Av. Ejemplo 123",
      comuna: "Ñuñoa",
      instructions: "Dejar en conserjería"
    },
    tip: 1000,
    paymentProvider: "MERCADOPAGO",
    clientRequestId: crypto.randomUUID()
  })
});

const data = await response.json();
// { orderId, code, status, redirectUrl? }
```

El payload exacto se valida con `createOrderSchema`; si cambias el esquema, actualiza este ejemplo y la app.

---

<a id="actions"></a>

## 13. Server actions

| Archivo | Actions principales |
|---|---|
| `app/actions/auth.ts` | `loginAction`, `registerCustomerAction`, `registerMerchantAction`, logout. |
| `app/actions/admin.ts` | `setMerchantStatusAction`, `setCourierVerificationAction`, `adminCancelOrderAction`. |
| `app/actions/menu.ts` | `createCategoryAction`, `createMenuItemAction`, `updateMenuItemAction`, `toggleMenuItemAction`. |
| `app/actions/mfa.ts` | `startMfaSetupAction`, `verifyMfaSetupAction`, verificación de login. |
| `app/actions/kyc.ts` | `startKycAction`, `setKycStatusAction`. |
| `app/actions/verification.ts` | Email, teléfono y reenvíos. |

### 13.1 Patrón de una action segura

```ts
"use server";

export async function exampleAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "MERCHANT") redirect("/login");

  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("value") ?? "").trim();

  // 1. Validar forma.
  if (!id || value.length < 2) return;

  // 2. Validar pertenencia, no solo rol.
  const record = await db.record.findFirst({
    where: { id, ownerId: session.id }
  });
  if (!record) throw new Error("No encontrado");

  // 3. Mutar.
  await db.record.update({ where: { id }, data: { value } });

  // 4. Invalidar.
  revalidatePath("/merchant");
}
```

Reglas:

- No confiar en IDs ocultos del formulario.
- Validar pertenencia además del rol.
- No devolver detalles internos en errores.
- Auditar acciones administrativas.
- Revalidar todas las rutas afectadas.

---

<a id="frontend"></a>

## 14. Frontend web y PWA

### 14.1 App Router

- `app/layout.tsx`: metadata global, fuentes, tema, service worker.
- `app/(public)/`: home, checkout, pedidos, legal, soporte.
- `app/(auth)/`: login, registro, MFA, verificación.
- `app/(dashboard)/`: layouts por rol y guards.
- `app/manifest.ts`: PWA.
- `app/not-found.tsx`: 404.

### 14.2 Diseño

- Tokens en `app/globals.css`.
- Clases utilitarias: `.card`, `.card-soft`, `.panel`, `.divider`, `.btn`, `.font-display`, `.font-mono-nums`.
- Tema oscuro; `color-scheme: dark`.
- Inter, Manrope y JetBrains Mono.
- Iconos Lucide.

### 14.3 Estado

- Server Components para datos.
- Client Components para carrito, mapa, drawers y formularios con estado.
- `CartProvider` y `CartDrawer` en el layout público.
- Persistencia del carrito en el dispositivo.
- No duplicar reglas de precio en el cliente: el servidor recalcula.

### 14.4 PWA

- `public/sw.js`.
- `app/manifest.ts`.
- Icono `any`/`maskable`.
- `Cache-Control` privado en rutas sensibles.
- No cachear respuestas autenticadas.

### 14.5 Mapas

- Leaflet con tiles Esri World Dark Gray.
- La CSP permite `server.arcgisonline.com` y `*.arcgisonline.com`.
- No requiere API key.
- Atribución de Esri visible.

---

<a id="movil"></a>

## 15. App móvil

### 15.1 Stack

- Expo SDK 58.
- React Native 0.88.
- React 19.
- Expo Router.
- React Context.
- SecureStore nativo / `localStorage` web.
- AsyncStorage para carrito.
- `expo-location`.
- Ionicons.
- TypeScript estricto.

### 15.2 Estructura esperada

```
mobile/
├── src/
│   ├── app/            # rutas Expo Router
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── theme/
├── app.json
├── eas.json
└── package.json
```

### 15.3 Cliente API

- Base URL desde `EXPO_PUBLIC_API_URL` o detección de Metro.
- Bearer en cada request autenticada.
- Timeout de 20 s.
- Manejo de `401` → logout.
- Manejo de `403` → mensaje de verificación/MFA.
- Polling de pedidos cada 5 s.

### 15.4 Seguridad

- HTTPS obligatorio en producción.
- SecureStore `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Android `allowBackup=false`, `usesCleartextTraffic=false`.
- iOS ATS estricto.
- Deep link `mesacerca://` solo rutas.
- Sin secretos en el bundle.
- Sin MFA en móvil.

### 15.5 Build

```bash
npx expo export --platform web
npx eas-cli@latest build
```

No hay build publicado ni E2E nativos.

---

<a id="seguridad"></a>

## 16. Seguridad

### 16.1 Controles implementados

- JWT con issuer/audience/propósito/`tokenVersion`.
- Cookies HttpOnly/SameSite/Secure.
- RBAC y pertenencia.
- Zod y validación server-side.
- Rate limiting.
- CORS allowlist.
- Headers/CSP.
- Uploads validados.
- Webhooks firmados.
- Idempotencia.
- PIN con bloqueo.
- Auditoría.
- Preflight de producción.
- `npm audit` sin vulnerabilidades al cierre.

### 16.2 Dónde mirar

| Tema | Archivo |
|---|---|
| Headers/CSP | `next.config.ts` |
| CORS | `proxy.ts` |
| Preflight | `scripts/check-env.mjs` + `instrumentation.ts` |
| Auth | `lib/auth.ts`, `app/actions/auth.ts` |
| MFA | `lib/mfa.ts`, `app/actions/mfa.ts` |
| KYC | `lib/kyc.ts`, `app/actions/kyc.ts` |
| Rate limit | `lib/rate-limit.ts` |
| Validación | `lib/validation.ts` |
| Pagos | `lib/payments/*` |
| Uploads | `app/uploads/[...path]/route.ts` |
| Auditoría | `lib/audit.ts`, `AuditLog` |

### 16.3 Reglas para nuevos endpoints

1. Resolver sesión.
2. Comprobar rol.
3. Comprobar pertenencia.
4. Rate limit.
5. Límite de body.
6. Zod.
7. Regla de dominio.
8. Transacción si hay varios pasos.
9. Evento/auditoría.
10. Respuesta sin datos sensibles.

### 16.4 Riesgos residuales

Consulta la lista completa en el [README](../README.md#seguridad). Los más relevantes para desarrollo:

- Rate limit en memoria (no multi-instancia).
- CSP con `unsafe-inline`.
- Sin recuperación de contraseña.
- Sin monitoreo/SIEM.
- Sin backup de uploads.
- App sin integridad de dispositivo.

---

<a id="qa"></a>

## 17. Pruebas y QA

### 17.1 Comandos

```bash
npm run build
npm run lint
npm run security:audit
npm run security:env
node scripts/smoke.mjs
node scripts/smoke-register.mjs
```

### 17.2 Qué cubre el smoke

- Registro de cliente/local/repartidor.
- Login.
- Home.
- Creación de pedido.
- Pago demo.
- Tracking.
- Panel de local.
- Panel de repartidor.
- Panel de admin.

### 17.3 Matriz de seguridad

Verificada en `docs/15`:

- Health sin datos sensibles.
- Headers.
- CORS.
- `401`/`403` por rol.
- IDOR.
- Token inválido.
- Logout revoca.
- Rate limit.
- Límite de 15 km.
- PIN incorrecto.
- Doble aceptación.
- Idempotencia.
- Contraseña mínima.
- Teléfono duplicado.

### 17.4 Qué falta

- Tests unitarios de pricing y estados.
- Tests de integración de webhooks.
- E2E nativos.
- Carga y caos.
- Pentest externo.
- Accesibilidad.
- iPhone.

---

<a id="extender"></a>

## 18. Cómo extender

### 18.1 Agregar un campo al pedido

1. Modifica `prisma/schema.prisma`.
2. Crea una migración (`npx prisma migrate dev --name add_campo`).
3. Actualiza `createOrderSchema`.
4. Calcula/valida el campo en `POST /api/orders`.
5. Guarda el campo en `Order`.
6. Actualiza la UI de checkout, tracking y paneles.
7. Actualiza la API móvil.
8. Agrega el campo a los tests.
9. Documenta en `docs/developer.md` y `docs/datasheet.md`.

No agregues campos calculados que puedan derivarse de otros; evita divergencias.

### 18.2 Agregar un proveedor de pago

1. Implementa la interfaz de `lib/payments/types.ts`.
2. Agrega el valor al enum de proveedor.
3. Implementa creación, consulta, webhook y reembolso.
4. Agrega la ruta de retorno/webhook.
5. Valida firma, monto y moneda.
6. Agrega el modo a `PAYMENTS_MODE`.
7. Actualiza el checkout y la UI de admin.
8. Prueba sandbox y conciliación.
9. Documenta.

### 18.3 Agregar un rol

1. Agrega el valor al enum `Role`.
2. Actualiza `homeForRole`.
3. Crea layout/guard.
4. Agrega permisos en actions y API.
5. Actualiza la navegación.
6. Revisa MFA/KYC.
7. Agrega pruebas de autorización.
8. Documenta.

No agregues un rol solo en la UI: el servidor debe conocerlo.

### 18.4 Agregar una ruta móvil

1. Crea el archivo en `app/api/mobile/...`.
2. Usa `getRequestSession`.
3. Valida rol y pertenencia.
4. Aplica rate limit y body limit.
5. Devuelve JSON estable.
6. Actualiza `mobile/src/lib/api`.
7. Prueba en Expo Go.
8. Documenta en `docs/14` y `docs/developer.md`.

### 18.5 Agregar un estado

1. Agrega el estado al enum.
2. Define transiciones válidas.
3. Actualiza la máquina de estados.
4. Actualiza timers y eventos.
5. Actualiza filtros y UI.
6. Migra datos existentes si hace falta.
7. Prueba idempotencia y concurrencia.

---

<a id="debug"></a>

## 19. Depuración

### 19.1 Comandos

```bash
npm run dev
npm run build
npm run start
npm run db:studio
npm run security:env
curl -s http://localhost:3000/api/health | jq
```

### 19.2 Health

Respuesta esperada:

```json
{
  "ok": true,
  "service": "mesacerca",
  "db": "ok",
  "timestamp": "2026-11-12T00:00:00.000Z"
}
```

Si falla, revisa `DATABASE_URL`, que PostgreSQL esté arriba y que las migraciones se hayan aplicado.

### 19.3 Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `PrismaClientInitializationError` | DB no disponible o URL mal formada. | Revisa `DATABASE_URL`, puerto y TLS. |
| `Environment variable not found` | Falta `.env` o variable. | Copia `.env.example`, completa y reinicia. |
| `Invalid prisma...` | Esquema/migración desincronizados. | `npx prisma migrate deploy` o `db:push` en local. |
| `401` en app | Token expirado/revocado. | Logout/login; revisa `tokenVersion`. |
| `403` en repartidor | KYC no verificado. | Completa KYC y verifica. |
| `429` | Rate limit. | Espera; no bajes el límite en producción. |
| Imagen no carga | Ruta/permiso/tipo. | Revisa uploads y CSP. |
| Webhook no actualiza | Firma/monto/idempotencia. | Revisa logs y payload de la pasarela. |
| Build falla por `server-only` | Import en cliente. | Mueve el import a servidor. |

### 19.4 Logs

- `.run/logs/` en local.
- `docker compose logs -f web` en producción.
- No registres PII, tokens ni payloads completos.
- Para incidentes, correlaciona `OrderEvent`, `AuditLog` y `Payment.providerRef`.

---

<a id="deuda"></a>

## 20. Límites y deuda técnica

| Deuda | Impacto | Prioridad |
|---|---|---|
| Rate limit en memoria | No escala horizontalmente. | Alta. |
| Sin recuperación de contraseña | Soporte manual. | Alta. |
| Sin webhook Didit firmado | KYC depende de callback/polling. | Alta. |
| Sin boleta electrónica | No apto para producción tributaria. | Alta. |
| Sin monitoreo/SIEM | Incidentes invisibles. | Alta. |
| Sin backups de uploads | Pérdida de portadas. | Media. |
| CSP `unsafe-inline` | Superficie XSS. | Media. |
| Sin PostGIS | Distancias por comuna, no por ruta. | Media. |
| Sin push móvil | Polling y batería. | Media. |
| Sin tests unitarios de pricing | Riesgo de regresión. | Media. |
| Sin E2E nativos | Cobertura móvil limitada. | Media. |
| App sin integridad de dispositivo | Riesgo en dispositivos comprometidos. | Media. |
| `docs/05` vs implementación | Documento objetivo, no realidad. | Baja. |

### 20.1 Regla de oro

No agregues una funcionalidad “de producción” sin cerrar antes:

1. Validación server-side.
2. Autorización por rol y pertenencia.
3. Rate limit.
4. Idempotencia.
5. Auditoría/evento.
6. Prueba.
7. Documentación.

---

**Referencias:** [`README.md`](../README.md) · [`datasheet.md`](datasheet.md) · [`REFERENCES.md`](REFERENCES.md) · [`BITACORA.md`](BITACORA.md) · [`SECURITY.md`](../SECURITY.md)
