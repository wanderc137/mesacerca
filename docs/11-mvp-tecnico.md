# MVP técnico — runbook

> Estado: **MVP funcional web/PWA**, con cliente, local, repartidor y administración.
> Build y lint pasan. Smoke tests de registro, login, pedido, pago demo y tracking pasan.

---

## 1. Stack implementado

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.4.5 (App Router) + React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 + design system propio |
| Base de datos | PostgreSQL 18 + Prisma 6.19.3, TLS verify-full |
| Autenticación | JWT firmado con `jose` + bcrypt |
| Pagos | Mercado Pago + Transbank Webpay Plus + efectivo + modo demo |
| Mapas | Leaflet + Esri World Dark Gray |
| Iconos | Lucide |
| Tests | Playwright (smoke) |

> PostgreSQL es la base de desarrollo y producción. Usa TLS `sslmode=verify-full` y migraciones versionadas.

---

## 2. Requisitos

- Node.js 20+ (probado con 24).
- npm.
- Navegador moderno.

---

## 3. Instalación

```bash
cd /home/jma/Documents/Proyect/mesacerca
npm install
cp .env.example .env
# Editar .env con un AUTH_SECRET propio
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abrir:

- Cliente: <http://localhost:3000>
- Local: <http://localhost:3000/merchant>
- Repartidor: <http://localhost:3000/courier>
- Admin: <http://localhost:3000/admin>

Para exponer en la red local:

```bash
npm run dev -- --hostname 0.0.0.0
```

---

## 4. Cuentas demo

Contraseña para todas: **`mesacerca123`**

| Rol | Email | URL |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `/` |
| Local | `local@mesacerca.cl` | `/merchant` |
| Repartidor | `repartidor@mesacerca.cl` | `/courier` |
| Administrador | `admin@mesacerca.cl` | `/admin` |

> Las cuentas demo solo se muestran en `NODE_ENV=development`. En producción, eliminar o cambiar estas cuentas y no ejecutar el seed demo.

---

## 5. Datos seed

- **34 comunas** de Santiago en el selector y la portada.
- **34 locales** (30 activos, 4 pendientes de verificación), uno por comuna.
- **170 platos** con categorías, precios, modificadores y fotos.
- **10 repartidores** (9 verificados, 1 pendiente), con ubicaciones.
- **16 pedidos** en distintos estados para demo.
- Reseñas de ejemplo.

Reset completo:

```bash
npm run db:reset
```

---

## 6. Flujo funcional

### Cliente

1. Home con búsqueda, filtro por comuna y cocina.
2. Página de local con menú, categorías, modificadores y carrito.
3. Checkout con dirección, entrega/retiro, propina, pago y desglose.
4. Pago demo, Mercado Pago, Webpay o efectivo.
5. Tracking con timeline, mapa, PIN y calificación.

### Local

1. Registro y verificación pendiente.
2. Dashboard con KPIs y tablero de pedidos en vivo.
3. Aceptar → preparar → listo → solicitar repartidor o salir a entregar.
4. Menú CRUD: categorías, platos, precios, stock, agotados.
5. Analítica de 30 días y comisión.

### Repartidor

1. Registro y verificación pendiente.
2. Conexión/desconexión.
3. Ofertas con pago, distancia y dirección.
4. Aceptar → retirar → entregar con PIN.
5. Ganancias y detalle de entregas.

### Admin

1. Métricas de GMV, comisión, pedidos activos y cancelación.
2. Alertas de pedidos atascados y verificaciones pendientes.
3. Pedidos con filtros, cancelación y reembolso.
4. Locales y repartidores: verificar/suspender.
5. Auditoría de acciones administrativas.

---

## 7. Pagos

### Modo demo (por defecto)

```env
PAYMENTS_MODE="mock"
```

El checkout marca el pedido como pagado sin pasarela. Ideal para demo y desarrollo.

### Mercado Pago

```env
PAYMENTS_MODE="sandbox"   # o production
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_WEBHOOK_SECRET="..."
```

- Checkout Pro con `init_point`.
- Webhook: `/api/payments/webhook/mercadopago`.
- Retorno: `/api/payments/mercadopago/return`.
- Configurar la URL pública en el panel de Mercado Pago.

### Transbank Webpay Plus

```env
PAYMENTS_MODE="sandbox"   # o production
TRANSBANK_COMMERCE_CODE="..."
TRANSBANK_API_KEY="..."
TRANSBANK_ENVIRONMENT="integration"   # o production
```

- En integración, si no hay credenciales, usa las credenciales públicas de Transbank.
- Retorno: `/api/payments/transbank/return/[orderId]`.
- Producción requiere comercio y llaves reales.

### Efectivo

- Se registra como pago pendiente.
- El local acepta el pedido y el repartidor cobra al entregar.

---

## 8. Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Sincroniza Prisma |
| `npm run db:seed` | Carga datos demo |
| `npm run db:reset` | Borra y recarga la base |
| `npm run db:studio` | Prisma Studio |
| `node scripts/smoke.mjs` | Smoke test de los 4 roles |
| `node scripts/smoke-register.mjs` | Smoke test de registros |
| `node scripts/demo-cookie.mjs email` | Genera cookie de sesión para pruebas |
| `GET /api/health` | Health check de app y base de datos |

> Los smoke tests requieren el servidor en `localhost:3000` y Playwright con Chromium.

---

## 9. Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | PostgreSQL con `sslmode=verify-full` y `sslrootcert` |
| `AUTH_SECRET` | Sí | Secreto para firmar JWT |
| `NEXT_PUBLIC_APP_URL` | Sí | URL pública (ej. `http://localhost:3000`) |
| `NEXT_PUBLIC_DEMO_MODE` | No | Muestra cuentas demo en login |
| `PAYMENTS_MODE` | Sí | `mock`, `sandbox` o `production` |
| `MERCADOPAGO_ACCESS_TOKEN` | Según modo | Token de Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | Recomendado | Firma del webhook |
| `TRANSBANK_COMMERCE_CODE` | Producción | Código de comercio |
| `TRANSBANK_API_KEY` | Producción | Llave de Transbank |
| `TRANSBANK_ENVIRONMENT` | No | `integration` o `production` |
| `CRON_SECRET` | Obligatorio en producción | Protege `/api/cron/orders` con `Authorization: Bearer` |

---

## 10. Limitaciones actuales

- PostgreSQL con TLS; backups/PITR y cifrado en reposo del proveedor.
- Pagos en modo demo por defecto.
- Sin verificación KYC automática: admin aprueba manualmente.
- Sin boleta electrónica ni conciliación SII.
- Sin notificaciones push nativas ni WhatsApp; solo in-app y polling cada 5 s.
- Sin WebSockets; el tiempo real se resuelve con polling (Ably/Pusher en fase 2).
- Sin chat cliente-repartidor.
- Sin app nativa: PWA/web.
- Sin rate limiting ni WAF.
- Sin tests de carga.
- Sin seguro de repartidores.
- Sin multi-ciudad real (la cobertura es Santiago).
- Sin recuperación de contraseña.
- Sin verificación de email.

---

## 11. Checklist antes de clientes reales

- [ ] Cambiar `AUTH_SECRET` y borrar cuentas demo.
- [ ] `NEXT_PUBLIC_DEMO_MODE="false"`.
- [ ] Migrar a PostgreSQL gestionado.
- [ ] Configurar `NEXT_PUBLIC_APP_URL` pública.
- [ ] Configurar pasarela de pago productiva.
- [ ] Configurar dominio y HTTPS.
- [ ] Revisar términos, privacidad y reembolsos con abogado.
- [ ] Verificar locales (resolución sanitaria, RUT, banco).
- [ ] Verificar repartidores (identidad, licencia, antecedentes).
- [ ] Contratar seguro de accidentes y responsabilidad civil.
- [ ] Configurar boleta/factura electrónica.
- [ ] Configurar soporte y SLA.
- [ ] Configurar backups y monitoreo.
- [ ] Definir política de reembolsos y disputas.
- [ ] Capacitar a los primeros locales y repartidores.
- [ ] Hacer un piloto cerrado de 50 pedidos antes de abrir.

---

## 12. Deploy sugerido

### Opción rápida

- Vercel para la app.
- Neon/Supabase para PostgreSQL.
- Cloudflare R2 para imágenes.
- Resend para emails.
- Sentry para errores.

### Pasos

1. Cambiar `datasource db` a `postgresql`.
2. Crear base y `DATABASE_URL`.
3. `npx prisma migrate deploy`.
4. Configurar variables de entorno.
5. Deploy.
6. Configurar webhooks de pago con la URL pública.
7. Configurar `CRON_SECRET` y el cron de `vercel.json` (cada 5 minutos).
8. Ejecutar seed de producción mínimo (admin + comunas + zonas).

El cron `/api/cron/orders`:
- Requiere `Authorization: Bearer $CRON_SECRET` (no acepta el secreto por query).
- Expira pedidos con pago pendiente después de 15 minutos.
- Cancela pedidos que el local no respondió en 5 minutos, con actualización condicional para no pisar una aceptación concurrente.
- Los pagos demo se marcan reembolsados; los pagos reales quedan en `REFUND_PENDING` para revisión/reembolso administrativo.

---

## 13. Estructura del código

```
app/
├── (public)/          # cliente, checkout, tracking, marketing, legal
├── (auth)/            # login y registros
├── (dashboard)/       # merchant, courier, admin
├── api/               # orders, payments, courier, merchant, reviews
├── actions/           # server actions (auth, menu, admin)
components/
├── cart/              # carrito y drawer
├── checkout/          # checkout cliente
├── courier/           # dashboard repartidor
├── merchant/          # tablero de pedidos
├── order/             # tracking
├── store/             # menú y tarjetas
├── layout/            # header, footer, dashboard shell
├── ui/                # badges, stats, timeline, empty states
└── brand/             # logo
lib/
├── auth.ts            # sesión y roles
├── db.ts              # Prisma
├── pricing.ts         # tarifas
├── order-status.ts    # máquina de estados
├── payments/          # Mercado Pago, Transbank, sync
├── orders/            # serialización
├── merchant/          # datos del local
└── courier/           # datos del repartidor
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
scripts/
├── smoke.mjs
├── smoke-register.mjs
└── demo-cookie.mjs
```

---

## 14. Siguiente iteración recomendada

1. PostgreSQL + migraciones.
2. Pasarela productiva y conciliación.
3. Verificación KYC y documentos.
4. Notificaciones por WhatsApp/email.
5. App Expo para repartidor y cliente.
6. Boleta electrónica.
7. Seguro y protocolo de incidentes.
8. Piloto cerrado en 3 comunas.
