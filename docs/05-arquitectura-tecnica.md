# Arquitectura técnica

> **Objetivo:** construir un MVP demostrable en 3 días y una base que escale a producción sin reescribir todo.
> **Principio:** monolito modular primero, microservicios solo cuando duela.

---

## 1. Decisiones de arquitectura

| Decisión | MVP | Escala | Razón |
|---|---|---|---|
| **Framework web** | Next.js 15 (App Router) + TypeScript | Mantener | Velocidad, SEO, server actions, ecosistema |
| **UI** | Tailwind CSS + shadcn/ui + tokens propios | Mantener | Consistencia y velocidad |
| **Base de datos** | PostgreSQL + PostGIS | Mantener | Relacional, geoespacial, transaccional |
| **ORM** | Prisma | Mantener | Productividad y tipado |
| **Auth** | Auth.js + OTP email/teléfono | Mantener/añadir proveedor | Simple y extensible |
| **Realtime** | Ably o Pusher | Mantener/Redis | Evita operar WebSockets en serverless |
| **Pagos** | Mercado Pago Checkout Pro (sandbox) | Transbank/Webpay + Mercado Pago | Integración rápida |
| **Mapas** | MapLibre + OSM + OSRM | Google Maps/Mapbox | Costo cero en MVP |
| **Storage** | Cloudflare R2 / Supabase Storage | S3 | Fotos de platos y entregas |
| **Notificaciones** | Web Push + Resend + in-app | FCM + WhatsApp Business | Cobertura progresiva |
| **Jobs** | Inngest o cron de Vercel | Temporal/Redis | Auto-cancelaciones y liquidaciones |
| **Hosting** | Vercel + Neon/Supabase | AWS/GCP/Fly.io | Deploy rápido |
| **Observabilidad** | Sentry + Axiom | OpenTelemetry + Grafana | Diagnóstico |
| **Monorepo** | Single app Next.js | pnpm + Turborepo | Menos fricción al inicio |

### 1.1 Por qué no microservicios

El dominio tiene 4 actores y un flujo transaccional. Un monolito modular con límites claros (`orders`, `catalog`, `dispatch`, `payments`, `identity`) permite:

- Transacciones simples.
- Menos latencia.
- Menos infraestructura.
- Refactor fácil.

Los límites se mantienen a nivel de carpetas y contratos, no de red.

---

## 2. Estructura del repositorio

### 2.1 MVP (single app)

```
mesacerca/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # home cliente
│   │   ├── r/[slug]/page.tsx        # local
│   │   ├── checkout/page.tsx
│   │   └── pedido/[id]/page.tsx     # tracking
│   ├── (merchant)/
│   │   ├── panel/page.tsx           # dashboard local
│   │   ├── panel/pedidos/page.tsx
│   │   ├── panel/menu/page.tsx
│   │   └── panel/finanzas/page.tsx
│   ├── (courier)/
│   │   ├── repartidor/page.tsx
│   │   ├── repartidor/ofertas/page.tsx
│   │   └── repartidor/ganancias/page.tsx
│   ├── (admin)/
│   │   ├── admin/page.tsx
│   │   ├── admin/pedidos/page.tsx
│   │   ├── admin/locales/page.tsx
│   │   └── admin/repartidores/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── orders/route.ts
│       ├── orders/[id]/route.ts
│       ├── dispatch/route.ts
│       ├── payments/webhook/route.ts
│       └── notifications/route.ts
├── components/
│   ├── ui/                          # shadcn
│   ├── customer/
│   ├── merchant/
│   ├── courier/
│   └── admin/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── realtime.ts
│   ├── payments.ts
│   ├── maps.ts
│   ├── dispatch.ts
│   ├── notifications.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── tests/
└── docs/
```

### 2.2 Escala (monorepo)

```
mesacerca/
├── apps/
│   ├── web/          # Next.js cliente/local/admin
│   ├── api/          # Fastify/NestJS (si se extrae)
│   ├── courier/      # Expo
│   └── customer/     # Expo
├── packages/
│   ├── db/           # Prisma + migraciones
│   ├── ui/           # design system
│   ├── shared/       # tipos, zod, utilidades
│   └── config/       # eslint, tsconfig
├── infra/
└── turbo.json
```

**Regla:** no crear el monorepo hasta que exista una segunda app real. La migración es incremental.

---

## 3. Módulos del dominio

| Módulo | Responsabilidad | Entidades |
|---|---|---|
| **Identity** | Usuarios, roles, sesiones, OTP | User, Session, Role |
| **Catalog** | Locales, menú, categorías, modificadores, stock | Merchant, Store, Category, Item, Modifier |
| **Orders** | Carrito, checkout, pedido, estados, eventos | Order, OrderItem, OrderEvent |
| **Dispatch** | Ofertas, asignación, reasignación, ETA | DeliveryOffer, Assignment |
| **Payments** | Cobros, webhooks, reembolsos, conciliación | Payment, Refund, Payout |
| **Logistics** | Repartidores, ubicación, entregas | Courier, CourierLocation, Delivery |
| **Reviews** | Ratings y comentarios | Review |
| **Promotions** | Cupones, descuentos, destacados | Promotion, Coupon |
| **Notifications** | Push, email, in-app, WhatsApp | Notification, Template |
| **Admin** | Verificación, disputas, configuración | Dispute, AuditLog, Zone |
| **Analytics** | Métricas y reportes | Materialized views |

---

## 4. Modelo de datos

### 4.1 Entidades principales

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  name          String
  role          Role     @default(CUSTOMER)
  status        UserStatus @default(ACTIVE)
  passwordHash  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  addresses     Address[]
  orders        Order[]  @relation("CustomerOrders")
  merchant      Merchant?
  courier       Courier?
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  label      String
  line1      String
  comuna     String
  city       String
  lat        Float
  lng        Float
  instructions String?
  isDefault  Boolean @default(false)
  user       User    @relation(fields: [userId], references: [id])
}

model Merchant {
  id            String  @id @default(cuid())
  ownerId       String  @unique
  name          String
  legalName     String?
  rut           String?
  status        MerchantStatus @default(PENDING)
  logoUrl       String?
  coverUrl      String?
  rating        Float   @default(0)
  commissionPlan CommissionPlan @default(HYBRID)
  deliveryMode  DeliveryMode @default(HYBRID)
  owner         User    @relation(fields: [ownerId], references: [id])
  stores        Store[]
}

model Store {
  id          String  @id @default(cuid())
  merchantId  String
  name        String
  slug        String  @unique
  address     String
  comuna      String
  lat         Float
  lng         Float
  phone       String?
  status      StoreStatus @default(DRAFT)
  prepTimeMin Int     @default(20)
  radiusKm    Float   @default(3)
  opensAt     String?
  closesAt    String?
  merchant    Merchant @relation(fields: [merchantId], references: [id])
  categories  Category[]
  orders      Order[]
}

model Category {
  id       String @id @default(cuid())
  storeId  String
  name     String
  position Int    @default(0)
  store    Store  @relation(fields: [storeId], references: [id])
  items    Item[]
}

model Item {
  id          String  @id @default(cuid())
  categoryId  String
  name        String
  description String?
  price       Int
  imageUrl    String?
  available   Boolean @default(true)
  stock       Int?
  position    Int     @default(0)
  category    Category @relation(fields: [categoryId], references: [id])
  modifiers   Modifier[]
}

model Modifier {
  id        String @id @default(cuid())
  itemId    String
  name      String
  type      ModifierType
  required  Boolean @default(false)
  min       Int     @default(0)
  max       Int     @default(1)
  item      Item    @relation(fields: [itemId], references: [id])
  options   ModifierOption[]
}

model ModifierOption {
  id         String @id @default(cuid())
  modifierId String
  name       String
  priceDelta Int    @default(0)
  modifier   Modifier @relation(fields: [modifierId], references: [id])
}

model Order {
  id             String   @id @default(cuid())
  code           String   @unique
  customerId     String
  storeId        String
  courierId      String?
  status         OrderStatus @default(DRAFT)
  deliveryMode   DeliveryMode
  subtotal       Int
  deliveryFee    Int
  serviceFee     Int
  tip            Int      @default(0)
  discount       Int      @default(0)
  total          Int
  paymentStatus  PaymentStatus @default(PENDING)
  scheduledAt    DateTime?
  acceptedAt     DateTime?
  readyAt        DateTime?
  pickedUpAt     DateTime?
  deliveredAt    DateTime?
  cancellationReason String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  customer User    @relation("CustomerOrders", fields: [customerId], references: [id])
  store    Store   @relation(fields: [storeId], references: [id])
  courier  Courier? @relation(fields: [courierId], references: [id])
  items    OrderItem[]
  events   OrderEvent[]
  payment  Payment?
}

model OrderItem {
  id           String @id @default(cuid())
  orderId      String
  itemId       String?
  nameSnapshot String
  unitPrice    Int
  quantity     Int
  modifiers    Json?
  notes        String?
  order        Order @relation(fields: [orderId], references: [id])
}

model OrderEvent {
  id        String   @id @default(cuid())
  orderId   String
  type      String
  actorId   String?
  payload   Json?
  createdAt DateTime @default(now())
  order     Order    @relation(fields: [orderId], references: [id])
}

model Courier {
  id           String  @id @default(cuid())
  userId       String  @unique
  vehicle      Vehicle
  status       CourierStatus @default(OFFLINE)
  rating       Float   @default(5)
  currentLat   Float?
  currentLng   Float?
  lastSeenAt   DateTime?
  user         User    @relation(fields: [userId], references: [id])
  orders       Order[]
}

model DeliveryOffer {
  id        String   @id @default(cuid())
  orderId   String
  courierId String
  status    OfferStatus @default(PENDING)
  score     Float?
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Payment {
  id          String  @id @default(cuid())
  orderId     String  @unique
  provider    String
  providerRef String?
  status      PaymentStatus @default(PENDING)
  amount      Int
  fee         Int?
  raw         Json?
  order       Order   @relation(fields: [orderId], references: [id])
}

model Review {
  id         String  @id @default(cuid())
  orderId    String
  authorId   String
  targetType ReviewTarget
  targetId   String
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
}

model Zone {
  id        String @id @default(cuid())
  name      String
  polygon   Json
  baseFee   Int
  perKm     Int
  minOrder  Int
  active    Boolean @default(true)
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String
  entity    String
  entityId  String
  before    Json?
  after     Json?
  ip        String?
  createdAt DateTime @default(now())
}
```

### 4.2 Índices críticos

- `Order(status, createdAt)`
- `Order(storeId, status, createdAt)`
- `Order(customerId, createdAt)`
- `Store(comuna, status)`
- `Courier(status, lastSeenAt)`
- `DeliveryOffer(orderId, status)`
- `Payment(providerRef)`
- `Review(targetType, targetId)`
- Índice geoespacial en `Store(lat, lng)` y `Courier(currentLat, currentLng)` (PostGIS).

### 4.3 Enums

```prisma
enum Role { CUSTOMER MERCHANT COURIER ADMIN SUPPORT }
enum MerchantStatus { PENDING VERIFIED SUSPENDED }
enum StoreStatus { DRAFT ACTIVE PAUSED CLOSED }
enum CommissionPlan { KITCHEN HYBRID FULL }
enum DeliveryMode { OWN FREELANCE PLATFORM }
enum OrderStatus {
  DRAFT PENDING_PAYMENT PAID PENDING_MERCHANT ACCEPTED PREPARING READY
  PENDING_COURIER COURIER_ASSIGNED PICKED_UP DELIVERED COMPLETED
  CANCELLED_BY_CUSTOMER CANCELLED_BY_MERCHANT CANCELLED_BY_COURIER
  EXPIRED REFUNDED DISPUTED
}
enum PaymentStatus { PENDING AUTHORIZED PAID FAILED REFUNDED PARTIALLY_REFUNDED }
enum CourierStatus { OFFLINE AVAILABLE BUSY }
enum Vehicle { BIKE MOTORCYCLE CAR WALKING }
enum OfferStatus { PENDING ACCEPTED DECLINED EXPIRED CANCELLED }
enum ModifierType { SINGLE MULTIPLE }
enum ReviewTarget { MERCHANT COURIER CUSTOMER }
```

---

## 5. Máquina de estados del pedido

### 5.1 Flujo feliz

```
DRAFT
  → PENDING_PAYMENT
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

### 5.2 Excepciones

| Estado | Cuándo | Acción |
|---|---|---|
| `CANCELLED_BY_CUSTOMER` | Antes de aceptar, o con costo después | Reembolso total/parcial |
| `CANCELLED_BY_MERCHANT` | Local rechaza o no responde en 3 min | Reembolso total + compensación |
| `CANCELLED_BY_COURIER` | Repartidor abandona | Reasignar o cancelar |
| `EXPIRED` | Pago no completado en 15 min | Liberar stock |
| `REFUNDED` | Disputa resuelta | Reembolso |
| `DISPUTED` | Cliente/local/repartidor abre caso | Congelar liquidación |

### 5.3 Reglas de transición

- Solo el actor autorizado puede ejecutar cada transición.
- Cada transición escribe un `OrderEvent` (append-only).
- Las transiciones son idempotentes (clave `orderId:from:to`).
- Los timers se cancelan al cambiar de estado.
- Las notificaciones se disparan por evento, no por polling.

### 5.4 Timers

| Timer | Desde | Acción |
|---|---|---|
| 15 min | `PENDING_PAYMENT` | Expirar pedido |
| 3 min | `PENDING_MERCHANT` | Auto-cancelar y reembolsar |
| 30 s | Oferta a repartidor | Expirar y ofrecer a otro |
| 5 min | `PENDING_COURIER` | Escalar a incentivo/soporte |
| 10 min | `READY` sin retiro | Alertar a local y repartidor |
| 48 h | `DELIVERED` | Cerrar ventana de disputa |

---

## 6. Dispatch

### 6.1 Algoritmo MVP

```ts
function scoreCourier(courier, order, now) {
  const distanceToStore = haversine(courier.location, order.store.location)
  const distanceScore = clamp(1 - distanceToStore / 5, 0, 1)
  const ratingScore = courier.rating / 5
  const acceptanceScore = courier.acceptanceRate
  const idleScore = clamp((now - courier.lastOrderAt) / 15, 0, 1)
  const loadPenalty = courier.activeOrders >= 2 ? 1 : 0

  return (
    0.40 * distanceScore +
    0.20 * ratingScore +
    0.20 * acceptanceScore +
    0.10 * idleScore -
    0.10 * loadPenalty
  )
}
```

### 6.2 Proceso

1. Pedido pasa a `PENDING_COURIER`.
2. Se buscan repartidores `AVAILABLE` en radio de 5 km.
3. Se calcula score y se ordenan.
4. Se envía oferta al top 1 (o top 3 en broadcast).
5. Timeout 30 s.
6. Si rechaza/expira, siguiente.
7. Si nadie acepta en 3 rondas, se activa incentivo o se notifica al local.
8. Si el local tenía reparto propio, no entra al dispatch.

### 6.3 ETA

```
ETA = prepTime + travelTime(store → customer) + buffer
```

- `travelTime` con OSRM/Google Directions.
- `buffer` dinámico por hora peak y clima.
- Actualización cada 60 s.
- Comunicar rango, no un número exacto.

### 6.4 Batching (fase 2)

- Solo pedidos del mismo local o locales a <500 m.
- Máximo 2 pedidos por repartidor.
- Desvío máximo: 10 min.
- Priorizar pedidos con SLA más ajustado.

---

## 7. Pagos

### 7.1 MVP

- **Mercado Pago Checkout Pro** (sandbox).
- Flujo: crear preferencia → redirigir → webhook → confirmar → actualizar pedido.
- Métodos: tarjeta, saldo Mercado Pago.
- Efectivo: simulado (marcar pagado al entregar).
- Reembolsos: manuales desde admin en MVP; API después.

### 7.2 Producción

| Proveedor | Uso | Notas |
|---|---|---|
| **Transbank Webpay Plus** | Tarjetas chilenas | Requiere convenio; alta conversión local |
| **Mercado Pago** | Tarjetas, saldo, cuotas | Fácil integración |
| **Flow** | Tarjetas, transferencia | Alternativa |
| **Khipu** | Transferencia bancaria | Bajo costo |
| **Fintoc** | Pago directo desde banco | Open banking |

### 7.3 Reglas

- No almacenar datos de tarjeta; usar checkout hospedado.
- Webhooks con firma y idempotencia.
- Conciliación diaria: pedido ↔ pago ↔ liquidación.
- Reembolsos con motivo y auditoría.
- Precios en CLP enteros; evitar decimales.
- IVA incluido en el precio al consumidor; desglosar en la factura.

### 7.4 Liquidaciones

- Semanal por defecto.
- Corte domingo 23:59; pago miércoles.
- Detalle: pedidos, comisión, IVA, envío, propina, ajustes.
- Estado: `PENDING` → `APPROVED` → `PAID` → `FAILED`.
- Conciliación con pasarela.

---

## 8. Notificaciones

| Evento | Cliente | Local | Repartidor |
|---|---|---|---|
| Pedido creado | Push/email | Push/sonido | — |
| Pago confirmado | Push | Push/sonido | — |
| Pedido aceptado | Push | — | — |
| Pedido listo | Push | — | Push |
| Repartidor asignado | Push | Push | Push |
| Repartidor cerca | Push | — | — |
| Entregado | Push/email | Push | Push |
| Cancelado | Push/email | Push | Push |
| Disputa | Email | Email | Email |

### Canales

- **In-app:** centro de notificaciones.
- **Web Push:** VAPID; funciona en PWA.
- **Email:** Resend/Postmark.
- **SMS/WhatsApp:** Twilio/Meta; fase 2.
- **Push nativo:** FCM/APNs; fase 2.

### Reglas

- No más de 1 push por evento.
- Agrupar notificaciones no críticas.
- Respetar horario nocturno (excepto pedidos activos).
- Permitir opt-out por canal.
- Plantillas versionadas.

---

## 9. Mapas y geolocalización

| Función | MVP | Producción |
|---|---|---|
| Geocodificación | Nominatim/OSM | Google Geocoding/Mapbox |
| Render | MapLibre + tiles OSM | Mapbox/Google Maps |
| Ruteo | OSRM público | Google Directions/OSRM propio |
| Distancia | Haversine + OSRM | OSRM/Google |
| Zonas | Polígonos GeoJSON | PostGIS + editor |
| Tracking | Geolocation API + Ably | FCM + backend |

**Cuidado:** Nominatim y OSRM públicos tienen límites de uso. Para producción, contratar o self-host.

---

## 10. Tiempo real

### Opción MVP: Ably/Pusher

- Canales: `order:{id}`, `courier:{id}`, `store:{id}`, `admin:ops`.
- Eventos: `order.status`, `courier.location`, `offer.created`, `offer.expired`.
- Autenticación de canales por token.
- Reconexión automática.
- Fallback: polling cada 10 s.

### Opción escala: WebSockets propios

- Socket.IO + Redis adapter.
- Rooms por pedido/local/repartidor.
- Heartbeat y presencia.
- Escalado horizontal.

---

## 11. Seguridad

### 11.1 Autenticación y autorización

- Auth.js con OTP email/teléfono.
- Roles: `CUSTOMER`, `MERCHANT`, `COURIER`, `ADMIN`, `SUPPORT`.
- Middleware por ruta y por API.
- Verificación de pertenencia: `merchant.ownerId === user.id`, `order.store.merchantId === merchant.id`.
- Admin con 2FA obligatorio en producción.

### 11.2 Aislamiento multi-tenant

- Toda consulta de local filtra por `merchantId`.
- Toda consulta de repartidor filtra por `courierId`.
- Nunca confiar en IDs del cliente sin verificar propiedad.
- Tests de autorización por rol.

### 11.3 Pagos

- Checkout hospedado.
- Webhook con firma.
- Idempotency-Key en creación de pedido y pago.
- Límites por usuario/IP.
- Revisión manual de pedidos > CLP 100.000.

### 11.4 Datos

- HTTPS obligatorio.
- Cifrado en reposo (proveedor).
- PII mínima: nombre, teléfono, dirección.
- Retención: pedidos 5 años (tributario), ubicaciones 90 días.
- Borrado/anonimización a solicitud.
- Logs sin PII.
- Backups diarios.

### 11.5 Aplicación

- Validación con Zod en cliente y servidor.
- Rate limiting (Upstash/Redis).
- CSRF en formularios.
- CSP, HSTS, X-Frame-Options.
- Sanitización de inputs.
- Uploads con tipo/tamaño; escaneo antivirus en producción.
- Auditoría de acciones admin.

### 11.6 Fraude

- Verificación de teléfono/email.
- Límite de pedidos nuevos.
- Detección de direcciones duplicadas.
- Revisión de reembolsos recurrentes.
- Bloqueo temporal por intentos fallidos.
- KYC de locales y repartidores.

---

## 12. Observabilidad

| Señal | Herramienta | Alerta |
|---|---|---|
| Errores | Sentry | >5 en 5 min |
| Latencia API | Axiom/Vercel | p95 > 800 ms |
| Pedidos atascados | Job propio | >10 min en estado |
| Pagos fallidos | Dashboard | >5% en 1 h |
| Repartidores online | Dashboard | <10 en peak |
| Webhooks | Logs | Fallo de firma |
| DB | Neon/Supabase | CPU >80%, conexiones |

### Logs estructurados

```json
{
  "level": "info",
  "service": "orders",
  "orderId": "ord_123",
  "event": "order.accepted",
  "actorId": "usr_456",
  "durationMs": 120,
  "ts": "2026-11-07T20:00:00-03:00"
}
```

---

## 13. Testing

| Tipo | Herramienta | Cobertura MVP |
|---|---|---|
| Unitario | Vitest | Lógica de precios, estados, dispatch |
| Integración | Vitest + Testcontainers | API + DB |
| E2E | Playwright | Flujo cliente → local → repartidor |
| Autorización | Tests por rol | Crítico |
| Carga | k6 | 100 pedidos/hora |
| Seguridad | OWASP ZAP | Básico |

**Definition of done:** el flujo E2E pasa en CI y en producción demo.

---

## 14. Deploy

### MVP

```
GitHub → Vercel (web) → Neon/Postgres
                     → Ably
                     → Mercado Pago
                     → R2
                     → Resend
```

- Preview por PR.
- Producción en `main`.
- Migraciones con Prisma.
- Seed idempotente.
- Variables de entorno documentadas.
- Dominio `mesacerca.cl` (o el que se elija).

### Producción

- Vercel/AWS.
- DB gestionada con réplica de lectura.
- Redis para caché/rate limit.
- CDN para imágenes.
- WAF/Cloudflare.
- Backups y restore probado.
- Runbook de incidentes.

---

## 15. Modo demo

Para la demo de 3 días:

- `DEMO_MODE=true`.
- Pagos simulados con botón “Pagar”.
- Notificaciones en consola + in-app.
- Mapas con ubicaciones seed.
- Reloj acelerado para mostrar timers.
- Datos seed reproducibles.
- Reset de demo en 1 comando.

**Regla:** el modo demo no debe contaminar producción. Variables de entorno separadas.

---

## 16. Roadmap técnico

| Fase | Entregable |
|---|---|
| **Día 1** | Scaffold, DB, auth, catálogo, carrito, checkout |
| **Día 2** | Pedidos, realtime, panel local, PWA repartidor, dispatch |
| **Día 3** | Admin, tracking, pagos sandbox, tests, deploy |
| **Semana 2** | Pagos reales, verificación, emails, analytics |
| **Mes 2** | Apps Expo, push nativo, chat, cupones |
| **Mes 3** | Multi-zona, batching, conciliación, observabilidad |
| **Mes 6** | Segunda ciudad, white-label, API |

---

## 17. Deuda técnica aceptable en el MVP

- Sin tests de carga.
- Sin KYC automático.
- Sin boleta electrónica.
- Sin chat.
- Sin batching.
- Sin multi-idioma.
- Sin app nativa.
- Sin alta disponibilidad.
- Sin seguro.
- Sin integración POS.

**Regla:** documentar cada deuda y su fecha de pago. No ocultarla.
