<div align="center">

<img src="docs/assets/logo-mesacerca.svg" alt="MesaCerca" width="420" />

# MesaCerca

**La cocina local, a tu puerta.**

Plataforma de pedidos y reparto para Santiago de Chile: clientes, cocinas de barrio, repartidores y administración en una sola operación.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-087EA4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-F0B90B?style=for-the-badge)](LICENSE)
[![Estado](https://img.shields.io/badge/Estado-MVP%20verificado-0ECB81?style=for-the-badge)](#estado)

[Producto](#que-es) · [Arquitectura](#arquitectura) · [Funciones](#funcionalidades) · [Instalación](#instalacion) · [Pagos](#pagos) · [Seguridad](#seguridad) · [QA](#qa) · [Despliegue](#despliegue) · [Límites](#limites) · [Documentación](#documentacion)

</div>

---

<a id="que-es"></a>

## 1. Qué es MesaCerca

MesaCerca es una plataforma de marketplace y logística urbana para comida local. Conecta a quien quiere comer cerca de su casa con cocinas independientes del barrio y coordina pago, preparación, asignación de reparto y entrega con PIN.

No es un directorio ni una maqueta: es una operación completa. El pedido nace en el cliente, se valida en el servidor, se paga, se acepta en el local, se prepara, se ofrece a un repartidor, se retira y se entrega. Cada paso deja un evento y cada rol ve solo lo que necesita.

El proyecto nació como MVP funcional y verificable. La web/PWA, los paneles de local, repartidor y administración, la app Expo, PostgreSQL con migraciones, pagos demo/sandbox, KYC con Didit y los controles de seguridad están implementados y documentados. También están documentados, con honestidad, los límites que impiden usarlo con dinero real o PII de producción.

### 1.1 El problema

Santiago tiene una oferta gastronómica enorme, pero el reparto digital concentra la demanda en pocas plataformas y aplica comisiones altas a locales pequeños. Para una cocina de barrio, esos puntos pueden ser la diferencia entre margen y cierre. Para el cliente, el precio final suele ser opaco. Para el repartidor, la asignación y la ganancia pueden ser una caja negra.

| Actor | Fricción típica |
|---|---|
| Cliente | Precio final poco claro, seguimiento irregular, soporte lento. |
| Local | Comisión de 25–30% + IVA, pérdida de relación con el cliente. |
| Repartidor | Ofertas sin contexto, ganancias poco transparentes. |
| Administración | Poca trazabilidad, reembolsos manuales y fraude. |

### 1.2 La propuesta

- **Comisión publicada por plan.** Cocina, Híbrido y Full, desde 12% + IVA, sobre el subtotal de productos; no sobre envío, propina ni impuestos.
- **Precio claro.** Subtotal, envío, tarifa de servicio y propina se muestran por separado antes de pagar.
- **Reparto propio o red MesaCerca.** El local elige entre su equipo, la red o ambos.
- **Trazabilidad de punta a punta.** Estados, eventos, PIN de retiro/entrega y auditoría administrativa.
- **Mismos datos, varias superficies.** Web/PWA y app Expo consumen la misma API y reglas.

> **Marca.** MesaCerca es el nombre público. La identidad es oscura, densa y operativa, con amarillo como acento; se inspira en la claridad de interfaces financieras sin copiar marcas, assets ni código de terceros.

### 1.3 Los cuatro roles

| Rol | Superficie | Qué hace | Qué no puede hacer |
|---|---|---|---|
| **Cliente** | Web/PWA y Expo | Descubrir, pedir, pagar, seguir, confirmar PIN y calificar. | Ver direcciones ajenas ni entrar a paneles operativos. |
| **Local** | `/merchant` | Menú, stock, aceptar, preparar, marcar listo, repartir o solicitar red. | Ver pedidos ajenos ni aprobar su propio KYC. |
| **Repartidor** | `/courier` y Expo | Conectarse, aceptar ofertas, retirar/entregar con PIN, ver ganancias. | Crear pedidos, operar un local ni aprobar KYC. |
| **Admin/soporte** | `/admin` | Métricas, pedidos, verificaciones, KYC, reembolsos y auditoría. | `SUPPORT` no ejecuta acciones destructivas de `ADMIN`. |

La separación no es visual: cada server action y route handler vuelve a comprobar sesión, rol y pertenencia. Un `403` es una regla de negocio.

<a id="estado"></a>

## 2. Estado del proyecto

| Área | Estado | Evidencia |
|---|---|---|
| Web/PWA cliente | Funcional | Home, búsqueda, filtro, menú, carrito, checkout, tracking, PIN y calificación. |
| Panel del local | Funcional | Tablero en vivo, menú CRUD, portada editable y analítica de 30 días. |
| Panel del repartidor | Funcional | Conexión, ofertas, retiro/entrega con PIN y ganancias. |
| Administración | Funcional | Métricas, pedidos, verificaciones, KYC, reembolsos y auditoría. |
| API y base | Funcional | Health, pedidos, repartidor, reseñas, pagos; PostgreSQL 18 + Prisma. |
| App móvil | Funcional en Expo Go | Cliente y repartidor; una app, dos experiencias. |
| Pagos | Demo/sandbox | Mock, Mercado Pago, Transbank y efectivo. |
| KYC | Sandbox | Didit Courier Strict, liveness 3D, face match y AML. |
| Seguridad | Endurecida | Dos auditorías, headers, rate limits, idempotencia, RBAC y MFA. |
| QA | Verificado | Build, lint, TS, smoke de cuatro roles y dispositivos reales. |
| Producción | Diseñada, no desplegada | VPS + Docker + Caddy + Cloudflare documentado; sin VPS ni dominio. |

### 2.1 Alcance de esta copia

> **Nota importante.** Esta es una **edición sanitizada y podada** para documentación y publicación. Conserva los 23 documentos de `docs/`, páginas principales, server actions y route handlers de dominio, pero algunos directorios de runtime (`lib/`, `components/`, `prisma/schema.prisma`, `scripts/`, `deploy/`, `mobile/src/`) aparecen vacíos o no están incluidos. Las capacidades descritas se basan en el MVP verificado y en la documentación técnica; **no se inventaron métricas ni funcionalidades**. Para compilar y ejecutar necesitas el árbol de runtime original.

### 2.2 Lo que falta para producción

No hay VPS, dominio, Cloudflare ni despliegue Docker real. No hay pagos reales probados, KYC live con crédito ni webhook firmado de Didit end-to-end. No hay boleta electrónica, seguros, revisión legal, monitoreo externo, prueba de carga ni pentest. La app no está en tiendas y no tiene push. Todo se detalla en [Límites honestos](#limites).

<a id="arquitectura"></a>

## 3. Arquitectura

MesaCerca es un monolito modular en Next.js. La misma aplicación sirve web, paneles, API y webhooks; PostgreSQL es la única fuente de verdad. La app Expo consume la misma API por HTTPS con Bearer.

![Arquitectura de roles y sistemas](docs/assets/arquitectura-roles.svg)

*Diagrama 1 — Roles, aplicación, dominio, base de datos e integraciones. Editable en `docs/assets/arquitectura-roles.svg`.*

| Capa | Implementación | Responsabilidad |
|---|---|---|
| Presentación | App Router, RSC, layouts por rol | Renderizar y proteger rutas. |
| Acciones | `app/actions/*` | Formularios, mutaciones, `revalidatePath`. |
| API | `app/api/*` | Pedidos, repartidor, reseñas, pagos, móvil, health. |
| Dominio | `lib/*` | Auth, pedidos, pricing, dispatch, pagos, KYC, rate limit. |
| Persistencia | Prisma + PostgreSQL | Entidades, relaciones, migraciones, transacciones. |
| Integraciones | MP, Transbank, Didit, Resend, Twilio, Esri | Pagos, identidad, comunicaciones y mapas. |

Una petición sigue este camino:

1. Navegador o app llama a una página, action o route handler.
2. La sesión se resuelve desde cookie `HttpOnly` (web) o `Bearer` (móvil).
3. Rate limit por usuario/IP y validación Zod del cuerpo.
4. El dominio comprueba permisos y pertenencia del recurso.
5. Prisma ejecuta; si hay varios pasos, transacción.
6. Se escribe `OrderEvent` o `AuditLog` cuando corresponde.
7. Se invalida la caché de la página afectada.

Nunca se confía en precio, total, rol ni estado enviados por el cliente. El servidor reconstruye el carrito, valida modificadores y stock, calcula tarifas y decide si la transición es legal.

| Superficie | Ruta | Autenticación |
|---|---|---|
| Web/PWA | `/` | Cookie de sesión |
| Local | `/merchant` | Cookie + MFA si está forzado |
| Repartidor | `/courier` | Cookie + KYC |
| Admin/soporte | `/admin` | Cookie + MFA |
| API | `/api/*` | Cookie o Bearer |
| App Expo | `mobile/` | Bearer 7 días |
| Salud | `/api/health` | Público, solo DB |

## 4. Stack técnico

| Capa | Tecnología | Versión / detalle |
|---|---|---|
| Framework | Next.js App Router | 16.4.5 |
| UI | React | 19.3 |
| Lenguaje | TypeScript | 5, estricto |
| Estilos | Tailwind 4 + design system propio | Tokens CSS y clases `.card`, `.btn`, `.panel` |
| Base de datos | PostgreSQL | 18 |
| ORM | Prisma | 6.19.3, migraciones versionadas |
| Auth | `jose` + `bcryptjs` | JWT, cookies `HttpOnly`, `tokenVersion` |
| MFA | `otplib` + AES-256-GCM | Admin, soporte y local |
| Pagos | `mercadopago` + `transbank-sdk` | Checkout Pro y Webpay Plus |
| Mapas | Leaflet + Esri World Dark Gray | Sin API key |
| Validación | Zod | Esquemas de entrada |
| App móvil | Expo SDK 58 + RN 0.88 | Expo Router, SecureStore, Location |
| Tests | Playwright | Smoke y E2E |
| Contenedores | Docker multi-stage | Node 22, standalone |
| Borde | Cloudflare + Caddy (diseño) | Tunnel/Edge, WAF, Access |

Requisitos: Node.js 20+ (probado con 24), npm, PostgreSQL 18 local o compatible, navegador moderno. Para móvil: Expo Go y el servidor en la misma LAN. Docker solo si vas a desplegar.

## 5. Cómo se construyó

El proyecto avanzó en ciclos cortos, con documentación antes y después de cada bloque: investigación, diseño, MVP web/PWA, app móvil, dos auditorías de seguridad y preparación de producción. No fue lineal: hubo correcciones de operación y cambios de alcance documentados.

| Fase | Resultado | Documentos |
|---|---|---|
| 0. Investigación | Brief, competencia, mercado y propuesta de valor. | `docs/01`–`docs/04` |
| 1. Diseño | Arquitectura objetivo, identidad, roadmap y decisiones. | `docs/05`, `06`, `07`, `10` |
| 2. MVP web/PWA | Cuatro roles, pagos demo, tracking, seed y smoke tests. | `docs/11`–`13` |
| 3. App móvil | Expo para cliente y repartidor; SecureStore y ubicación. | `docs/14`–`16` |
| 4. Seguridad | Dos auditorías, correcciones y riesgos residuales. | `docs/17`, `22` |
| 5. Producción | PostgreSQL TLS, MFA, verificación, KYC y Cloudflare. | `docs/18`, `20`, `21`, `23` |

Cinco decisiones explican el resultado:

- **Monolito modular.** Un solo despliegue para cuatro roles reduce superficie, latencia y costo; los límites están en el código, no en la red.
- **PostgreSQL desde el inicio.** Se descartó SQLite para desarrollo porque producción necesitaba transacciones, concurrencia, TLS y migraciones reales.
- **Dinero en enteros CLP.** Sin floats; el servidor recalcula todo y guarda snapshots de nombre y precio en `OrderItem`.
- **Pago hospedado y KYC externo.** No se almacenan tarjetas; Didit aporta liveness, face match y AML.
- **Identidad propia.** La inspiración es una interfaz financiera oscura y densa, pero tokens, componentes y marca son de MesaCerca.

> `docs/05` es un diseño amplio con alternativas (Auth.js, MapLibre, Ably). La implementación real, más acotada, está en `docs/11` y `docs/23`; este README sigue la implementación.

<a id="funcionalidades"></a>

## 6. Funcionalidades

**Cliente.** Home con locales activos, búsqueda y filtros por comuna/cocina; página de local con portada, rating, prep time, menú y modificadores; carrito persistente con notas y propina; checkout con entrega/retiro, dirección y desglose; pago demo, Mercado Pago, Transbank o efectivo; seguimiento con timeline, mapa Leaflet, ETA, PIN y calificación; verificación de email y teléfono.

**Local.** Registro con datos legales, comuna, cocina y modalidad; verificación por administración (nunca autoaprobación); tablero en vivo con aceptar, preparar, listo, solicitar repartidor y entregar; menú CRUD con categorías, platos, precios, imágenes, disponibilidad y stock; portada JPG/PNG/WEBP/GIF de hasta 5 MB con validación real; analítica de 30 días (pedidos, ventas, comisión, top platos).

**Repartidor.** Registro y KYC; sin verificación no hay ofertas; conexión/desconexión (`AVAILABLE`, `BUSY`, `OFFLINE`); ofertas con pago, distancia y dirección aproximada; aceptación atómica; retiro y entrega con PIN; bloqueo tras 5 intentos; ganancias por base + km + espera e historial.

**Administración y soporte.** Métricas de GMV, comisión, pedidos activos y cancelación; alertas de atascos, verificaciones y KYC; pedidos con filtros, cancelación y reembolso; verificar/suspender locales y repartidores; revisar KYC con motivo; auditoría con actor, entidad y antes/después. `SUPPORT` opera soporte, pero no acciones destructivas de `ADMIN`.

**Transversales.** PWA instalable; app Expo para cliente y repartidor; email con Resend y SMS con Twilio (opcional); MFA TOTP para admin, soporte y local con códigos de recuperación; retención/anonimización de PII; healthcheck sin datos sensibles; backups de PostgreSQL y uploads (diseño operativo).

## 7. Flujo de pedido, pago y entrega

![Flujo de pedido, pago y entrega](docs/assets/flujo-pedido-pago.svg)

*Diagrama 2 — Cinco fases, desde el carrito hasta el cierre. Editable en `docs/assets/flujo-pedido-pago.svg`.*

| Estado | Quién lo provoca | Significado |
|---|---|---|
| `DRAFT` | Cliente | Borrador local; aún no es pedido. |
| `PENDING_PAYMENT` | Servidor | Pedido creado; espera pago. |
| `PAID` | Pasarela/webhook | Pago confirmado. |
| `PENDING_MERCHANT` | Servidor | Esperando aceptación del local. |
| `ACCEPTED` | Local | Aceptado y comprometido. |
| `PREPARING` | Local | Cocina en curso. |
| `READY` | Local | Listo para retiro o asignación. |
| `PENDING_COURIER` | Servidor | Buscando repartidor. |
| `COURIER_ASSIGNED` | Repartidor | Oferta aceptada. |
| `PICKED_UP` | Repartidor + PIN | Salió del local. |
| `DELIVERED` | Repartidor + PIN | Entregado al cliente. |
| `COMPLETED` | Sistema | Cerrado; habilita calificación y liquidación. |

Excepciones: `CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_MERCHANT`, `CANCELLED_BY_COURIER`, `EXPIRED`, `REFUNDED`, `DISPUTED`.

Reglas:

- Solo el actor autorizado mueve el pedido al siguiente estado.
- Cada transición escribe un `OrderEvent` append-only con actor, tipo y payload.
- Las transiciones son idempotentes: reintentar no duplica el efecto.
- El cliente no ve la dirección exacta del repartidor ni el repartidor la del cliente antes de aceptar.
- PIN de retiro (local) y PIN de entrega (cliente) son distintos.
- Un pedido con reparto propio no entra a la cola de dispatch de la red.

| Situación | Objetivo documentado | Implementación actual |
|---|---|---|
| Pago pendiente | Expirar a 15 min | Diseño; cron de pedidos cada 5 min. |
| Local sin aceptar | Auto-cancelar/reembolsar a 3 min | El cron cancela a 5 min (`docs/11`). |
| Oferta a repartidor | Expirar a 30 s | Diseño; oferta y aceptación atómicas. |
| Sin repartidor | Escalar a 5 min | Diseño; visible para admin. |
| Listo sin retiro | Alertar a 10 min | Diseño operativo. |
| Post-entrega | Cerrar disputa a 48 h | Diseño. |

Las diferencias entre `docs/05` y `docs/11` están declaradas a propósito; no se presenta como automatizado lo que aún es diseño.

## 8. Modelo de datos

![Modelo de datos](docs/assets/modelo-datos.svg)

*Diagrama 3 — Entidades principales y relaciones. Editable en `docs/assets/modelo-datos.svg`.*

El esquema completo vive en `prisma/schema.prisma` y `prisma/migrations/`. Entidades centrales: `User` (identidad, rol, MFA), `Address`, `Merchant`/`Store` (plan, local, horario, radio, prep time), `Category`/`MenuItem` (precio CLP, stock, modificadores), `Order`/`OrderItem` (estado, tarifas, PIN, snapshots), `OrderEvent` (append-only), `Payment`, `Courier`/`DeliveryOffer`, `Review`, `KycCase` y `AuditLog`.

- **Dinero en enteros.** `price`, `subtotal`, `deliveryFee`, `serviceFee`, `tip`, `total` y `commissionAmount` son enteros CLP.
- **Snapshots.** Cambiar el menú no altera pedidos históricos: `OrderItem` conserva nombre y precio de compra.
- **Idempotencia.** `Order.clientRequestId` es único por intento y evita duplicados por doble clic o reintento.
- **Eventos, no solo estado.** `OrderEvent` reconstruye qué pasó y cuándo.
- **Índices operativos.** Pedidos por estado/fecha y local, repartidores por estado/última conexión, ofertas por pedido y pagos por referencia.
- **Geolocalización.** `lat`/`lng`; PostGIS es mejora futura, no requisito del MVP.

## 9. Diseño y experiencia

Interfaz oscura, densa y operativa: un local o repartidor debe trabajar horas sin fatiga visual y el cliente debe ver el precio con claridad.

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0E11` | Fondo base. |
| `--surface` | `#151A21` | Tarjetas y paneles. |
| `--border` | `#2B3139` | Bordes de 1 px. |
| `--text` / `--muted` | `#EAECEF` / `#848E9C` | Texto principal y secundario. |
| `--primary` | `#F0B90B` | Acción principal y acento. |
| `--success` / `--danger` | `#0ECB81` / `#F6465D` | Confirmación y alerta. |
| `--info` / `--ember` | `#1E88E5` / `#FF7A1A` | Reparto y acento cálido. |

Manrope para títulos, Inter para cuerpo y JetBrains Mono para números, códigos y PIN. Radios 6/8/12/999 px, bordes 1 px, sombras sutiles y base de 4 px.

**PWA.** `app/manifest.ts` declara nombre, `short_name`, `start_url`, `standalone`, orientación vertical, `lang: es-CL` y colores; icono `any`/`maskable` y service worker en `public/sw.js`. Las páginas privadas usan `Cache-Control: private, no-store`.

**App móvil.** Una base Expo con dos navegaciones según rol: cliente (home, locales, menú, carrito, pedidos, direcciones, perfil) y repartidor (conexión, ofertas, entregas, ganancias, perfil).

<a id="instalacion"></a>

## 10. Instalación y ejecución

```bash
git clone <url-del-repositorio> mesacerca
cd mesacerca
npm install
cp .env.example .env
# Define AUTH_SECRET y DATABASE_URL; genera secretos:
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 48   # CRON_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abre <http://localhost:3000>. Para probar la app móvil, expón la web en la LAN:

```bash
npm run dev -- --hostname 0.0.0.0
```

**Scripts de plataforma.** En el árbol completo, `./scripts/platform-start.sh` levanta PostgreSQL, Next.js y Expo; `platform-stop.sh`, `platform-status.sh` y `platform-restart.sh` completan la operación. También existen como `npm run platform:start|stop|status|restart`. Para solo web/API y base: `START_MOBILE=0 ./scripts/platform-start.sh`. Logs en `.run/logs/`, PID en `.run/`, IP LAN autodetectada. Puertos habituales: `3000` (Next), `5433` (PostgreSQL), `8081` (Expo web), `8082` (Expo Go).

**Base de datos.** El proyecto usa PostgreSQL, no SQLite. En local: `npm run db:local:start`, `db:local:stop` y `db:backup`. URL de ejemplo:

```env
DATABASE_URL="postgresql://mesacerca:mesacerca@127.0.0.1:5433/mesacerca?schema=public"
```

En producción usa TLS con verificación:

```env
DATABASE_URL="postgresql://usuario:clave@host:5432/mesacerca?sslmode=verify-full&sslrootcert=/ruta/ca.pem"
```

**Seed y cuentas demo.** Crea 34 locales (30 activos, 4 pendientes), 170 platos, 10 repartidores, 16 pedidos y reseñas. Contraseña común **`mesacerca123`**:

| Rol | Email | Entrada |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `/` |
| Local | `local@mesacerca.cl` | `/merchant` |
| Repartidor | `repartidor@mesacerca.cl` | `/courier` |
| Admin | `admin@mesacerca.cl` | `/admin` |
| Repartidor QA | `courier2@mesacerca.cl` | `/courier` |
| Local QA con KYC | `tour.local@mesacerca.cl` | `/merchant` |

> Las cuentas demo son solo para desarrollo. En producción no ejecutes el seed y elimina o rota estas cuentas.

| Comando | Qué hace |
|---|---|
| `npm run build` / `start` / `lint` | Build, arranque con preflight y ESLint. |
| `npm run db:push` / `db:seed` / `db:reset` / `db:studio` | Esquema, seed, reset y Prisma Studio. |
| `npm run security:audit` / `security:env` / `security:retention` | Auditoría, validación de entorno y anonimización. |
| `npm run kyc:strict-workflow` / `kyc:harden-workflow` | Workflow estricto de Didit y endurecimiento. |
| `node scripts/smoke.mjs` / `smoke-register.mjs` | Smoke de flujos y registros. |

## 11. Variables de entorno

`.env.example` documenta todas las variables con valores seguros de ejemplo. Mínimas en development: `DATABASE_URL`, `AUTH_SECRET` y `CRON_SECRET`.

| Grupo | Variables |
|---|---|
| Aplicación | `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEMO_MODE`, `DATABASE_URL`, `TRUST_PROXY`, `CORS_ORIGINS`. |
| Sesiones | `AUTH_SECRET`, `CRON_SECRET`, `MFA_ENFORCED`, `MFA_ENCRYPTION_KEY`. |
| Verificación | `KYC_REQUIRED`, `EMAIL_VERIFICATION_REQUIRED`, `COURIER_SECURITY_ENFORCED`. |
| Pagos | `PAYMENTS_MODE`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`, `TRANSBANK_ENVIRONMENT`. |
| KYC | `KYC_PROVIDER`, `DIDIT_API_KEY`, `DIDIT_WORKFLOW_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_CALLBACK_URL`, `DIDIT_WEBHOOK_SECRET`. |
| Comunicaciones | `RESEND_API_KEY`, `EMAIL_FROM`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`. |
| Infraestructura | `POSTGRES_PASSWORD`, `DOMAIN`, `TLS_CERT`, `TLS_KEY`, `CLOUDFLARE_TUNNEL_TOKEN`. |
| Móvil | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL`. |

`AUTH_SECRET` y `CRON_SECRET` deben ser aleatorios de al menos 32 bytes. `MFA_ENCRYPTION_KEY` es una clave AES-256-GCM de 32 bytes en base64. `DIDIT_WORKFLOW_API_KEY` solo se usa para administrar workflows, nunca en runtime; `DIDIT_API_KEY` es la key de sesiones/decisiones.

`npm start` ejecuta un preflight que rechaza el arranque si faltan condiciones: `NEXT_PUBLIC_APP_URL` HTTPS, `TRUST_PROXY=1`, `MFA_ENFORCED=true`, `KYC_REQUIRED=true`, `EMAIL_VERIFICATION_REQUIRED=true`, `COURIER_SECURITY_ENFORCED=true`, secretos fuertes, proveedor KYC real, `PAYMENTS_MODE=sandbox|production` y secretos de webhook. El modo `mock` no se acepta en producción.

<a id="pagos"></a>

## 12. Pagos

| Modo | Uso | Comportamiento |
|---|---|---|
| `mock` | Demo/desarrollo | Marca pagado sin pasarela. |
| `sandbox` | Pruebas | Mercado Pago/Transbank en entorno de pruebas. |
| `production` | Dinero real | Requiere credenciales y checklist completo. |

**Mercado Pago.** Checkout Pro con `init_point`; webhook `/api/payments/webhook/mercadopago`; retorno `/api/payments/mercadopago/return`; producción rechaza tokens `TEST-`; el webhook valida firma, monto, moneda e idempotencia.

**Transbank Webpay Plus.** Retorno `/api/payments/transbank/return/[orderId]`; integración puede usar credenciales públicas, producción exige comercio y llaves reales; se valida `buy_order`, monto y estado; no se aceptan credenciales de integración en producción.

**Efectivo.** El pedido queda pendiente; el local acepta, el repartidor cobra al entregar y el pedido pasa a pagado al confirmar la entrega.

Reglas de dinero:

- No se almacenan tarjetas; checkout hospedado.
- CLP enteros, IVA incluido; propina 100% al repartidor.
- Comisión sobre subtotal de productos, no sobre envío, propina ni impuestos.
- Reembolsos desde admin llaman a la pasarela; pago posterior a cancelación queda `REFUND_PENDING`.
- Liquidación semanal: corte domingo 23:59, pago miércoles (diseño).
- Antes de cobrar: sandbox, webhook aprobado/rechazado, reembolso, chargeback y conciliación diaria.

**Ejemplo ilustrativo.** Subtotal $15.000, entrega 4 km, propina $1.000, plan Híbrido:

| Concepto | Fórmula | Monto |
|---|---|---:|
| Subtotal | — | $15.000 |
| Servicio | 6%, mín. $500, máx. $1.500 | $900 |
| Envío | $1.900 + $300/km sobre 2 km (2 extra) | $2.500 |
| Propina | 100% repartidor | $1.000 |
| **Total cliente** | suma | **$19.400** |
| Comisión local | 17% + IVA | $2.550 + IVA |
| Pago repartidor | $1.300 + $250/km (4 km) | $2.300 |

Son parámetros del MVP, no una oferta comercial ni proyección de ingresos.

<a id="seguridad"></a>

## 13. Seguridad

La seguridad se trató como parte del producto. Hay dos auditorías documentadas y un pentest externo planificado.

**Autenticación y sesiones.** JWT con `jose` (issuer, audience, propósito y `tokenVersion`); cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción; `tokenVersion` revoca sesiones al suspender, cambiar contraseña o activar MFA; login con rate limit por email/IP; bcrypt y hash dummy para no filtrar emails; redirección `next` validada.

**Autorización.** RBAC en cada action y route handler (`CUSTOMER`, `MERCHANT`, `COURIER`, `ADMIN`, `SUPPORT`); verificación de pertenencia (un local solo edita lo suyo, un repartidor solo ve sus ofertas); `SUPPORT` sin acciones destructivas; un local no pide de su propio local; repartidor no verificado no opera; local suspendido no opera aunque su sesión siga viva.

**Validación y dinero.** Zod en entradas; validación server-side de ítems, modificadores, stock, mínimo, comuna y distancia; precio recalculado en servidor; snapshot en `OrderItem`; aceptación atómica; PIN bloqueado tras 5 intentos; límite de 15 km; idempotencia por `clientRequestId`.

**Webhooks y pagos.** Firma con comparación timing-safe; monto y moneda contra el pedido; idempotencia; `buy_order` y monto en Transbank; reembolsos contra la pasarela; producción rechaza credenciales de integración.

**Superficie web.** CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y HSTS en producción; `private, no-store` en paneles, checkout, pedidos, login y verificación; CORS con allowlist; uploads con tipo real, tamaño y dimensiones; rate limits; auditoría de acciones administrativas.

| Auditoría | Fecha | Correcciones destacadas |
|---|---|---|
| Primera (`docs/17`) | 08/11/2026 | Doble aceptación, PIN sin límite, fuga de dirección antes de aceptar, retorno Transbank sin monto, webhook MP sin firma obligatoria, CORS abierto, admin cambiaba cualquier estado, reembolsos solo en base. |
| Segunda (`docs/22`) | 09/11/2026 | IDOR en `/kyc/return`, `SUPPORT` con permisos de admin, bypass de MFA móvil, MFA no verificada en actions, replay de webhook KYC, spoofing de IP, login móvil sin límite global, credenciales de integración en producción, fuga de referencias de pago, carrera de reviews, abuso de costo KYC, caché de páginas sensibles, repartidor no verificado, tiendas de local suspendido, health con datos, JWT sin `ver`, MFA sin revocar sesiones. |

Riesgos residuales:

- Rate limiting en memoria; falta Redis/Upstash para múltiples instancias.
- Límites de body dependen de `Content-Length`; el túnel no pasa por Caddy.
- Sin recuperación/cambio de contraseña self-service.
- Soporte puede ver PII; falta minimización por rol.
- Sin UI/SIEM de auditoría; solo tabla y consultas.
- PostgreSQL interno de Compose sin TLS (la conexión externa sí usa TLS).
- Sin backup automático de uploads en el flujo actual.
- `prisma/dev.db` y `backups/*.dump` locales pueden contener PII; no publicar.
- CSP con `unsafe-inline`; nonces/hashes pendientes.
- App sin Play Integrity, pinning, detección de root ni build EAS.
- Preview web móvil usa `localStorage`, no almacenamiento de producción.
- Sin monitoreo externo, load test ni pentest.
- `DIDIT_WEBHOOK_SECRET` puede estar vacío; hoy se usa callback/polling.
- Pagos reales pendientes de pruebas y conciliación.

Reporta vulnerabilidades según [SECURITY.md](SECURITY.md). No uses datos reales ni dinero real hasta completar el checklist.

## 14. KYC, MFA y verificación

**KYC con Didit.** Workflow **Courier Strict**, ID `a08dab96-d9f6-4618-9f9e-a31babd0f1db`, publicado en sandbox; costo de referencia USD 0.58/sesión; OCR, liveness, face match, AML e IP analysis; liveness `ACTIVE_3D` con flash estricto; umbrales liveness 40/65, face match 45/65, AML 50/80/80. Inyección, cámara virtual, screenshot, emulador, root, app manipulada o hooking: `DECLINE`; VPN, dispositivo/IP duplicado o automatización: `REVIEW`; NFC desactivado; duplicados de email/teléfono: `NO_ACTION`. Keys separadas: sesiones/decisiones y workflows (esta última nunca en runtime). Hoy usa callback/polling; webhook firmado end-to-end y KYC live están pendientes.

**MFA.** TOTP para `ADMIN`, `SUPPORT` y `MERCHANT`; secreto cifrado AES-256-GCM con `MFA_ENCRYPTION_KEY`; códigos de recuperación hasheados; activar MFA incrementa `tokenVersion` y revoca sesiones. La app móvil no soporta MFA: rechaza cuentas con MFA para no debilitar el flujo.

**Email y teléfono.** Resend para email con token y expiración; Twilio para SMS de 6 dígitos. En development el código SMS puede aparecer en el log. La verificación es requisito para operar cuando las variables de producción están activas.

**Retención de PII.** `npm run security:retention` anonimiza según la política. Antes de usarlo en producción: revisa alcance, haz backup y confirma obligaciones legales/contables.

<a id="qa"></a>

## 15. QA y pruebas

| Prueba | Resultado |
|---|---|
| `npm run build` / `lint` | Pasa. |
| TypeScript web y móvil | Sin errores. |
| Smoke de cuatro roles y registros | Pasa: registro, login, pedido, pago demo, tracking. |
| Export web de Expo | Pasa. |
| Dispositivos | Huawei Y9 y Samsung A10, rondas completas. |
| Matriz de seguridad | PASS en auth, autorización, IDOR, rate limit, PIN e idempotencia. |

| Pedido | Escenario | Resultado |
|---|---|---|
| `MES-4LHZBK` | Cliente móvil web, repartidor Huawei Y9, Pizza Brava, Cerro Navia. | PASS, 0 errores. |
| `MES-2HPUSQ` | Cliente nativo Huawei, repartidor móvil web, PIN 4457. | PASS. |
| `MES-MZGQV7` | Ronda extra, PIN 7942, $1.900 por una entrega. | PASS. |
| `MES-X4982B` | Samsung A10 repartidor, Huawei cliente, PIN 3955, 3 entregas, $5.700. | PASS. |

Datos al cierre: 20 pedidos (16 seed + 4 QA), 35 locales (34 seed + Cocina Tour), 33 merchants, 10 repartidores y 45 usuarios.

Matriz verificada: health sin datos sensibles; headers presentes; CORS `204` para origen permitido; sin token `401`; cliente→API courier `401/403`; courier creando pedido `403`; IDOR `403`; token inválido `401`; logout revoca; rate limit móvil `429`; aceptación >15 km `409`; PIN incorrecto `400`; doble aceptación rechazada; mismo `clientRequestId` idempotente; contraseña <8 rechazada; teléfono duplicado rechazado.

No se probó: carga, estrés, caos, pentest externo, E2E nativos, iPhone, APK/IPA, tiendas, pagos reales. Está en [Límites](#limites).

## 16. Rendimiento y operación

No se publican cifras de throughput, latencia o bundle porque no se ejecutaron pruebas de carga. Sí está implementado: `output: "standalone"`, `serverExternalPackages` para Transbank/Mercado Pago, índices en pedidos/tiendas/repartidores/ofertas/pagos/reseñas, paginación y límites en listados, `no-store` en rutas privadas, caché inmutable solo para uploads, rate limits, healthcheck cada 30 s y etapa `migrate` separada.

| Límite | Valor / regla |
|---|---|
| Radio de entrega | 15 km en aceptación. |
| Tarifa de envío | Base 2 km; $300/km; máximo $4.900. |
| Ítems por pedido | Validado por esquema; cantidades enteras. |
| Upload de portada | 5 MB; JPG/PNG/WEBP/GIF. |
| Oferta de reparto | 30 s (diseño). |
| Intentos de PIN | 5 y bloqueo. |
| Pedidos / reseñas | 12/min y 6/min por usuario. |
| Login web / registro | 8 por email/min + 20 por IP/min; 5/min + 20/h por IP. |

<a id="despliegue"></a>

## 17. Despliegue

![Diseño de despliegue](docs/assets/despliegue.svg)

*Diagrama 4 — Diseño objetivo. No hay VPS, dominio ni Cloudflare contratados; el diagrama no afirma que esté live.*

| Modo | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **Cloudflare Tunnel** (recomendado) | `cloudflared` abre conexión saliente; sin puertos entrantes; solo SSH con allowlist. | MVP, VPS pequeño, menor superficie. |
| **Edge con Caddy** | Caddy en 80/443 solo para rangos Cloudflare, certificado Origin CA y Full (strict). | Más control y logs locales. |

En ambos, PostgreSQL y la app no se publican: `3000` queda en la red Docker y `5432` solo es accesible por la app. La imagen es multi-stage Node 22, usuario no root, healthcheck y etapa `migrate` para `prisma migrate deploy`; PostgreSQL 18 con volumen; uploads en `/app/public/uploads/stores`; Cloudflare con DNS proxied, SSL Full (strict), Always HTTPS, TLS 1.2+, HSTS, WAF OWASP, Bot Fight, Access en `/admin*` y rate limits de borde.

Checklist de lanzamiento: dominio con Full (strict)/HSTS; origen solo Cloudflare/Tunnel; `TRUST_PROXY=1`; MFA/KYC/EMAIL/COURIER enforced; demo false; Didit live con webhook firmado; Resend con SPF/DKIM/DMARC; pagos sandbox aprobados/rechazados/reembolsados; PostgreSQL con backup/restore probados; WAF/Access/rate limits; monitoreo; pentest; revisión legal; boleta electrónica; seguros y protocolo de incidentes. Ningún ítem se da por cumplido por estar documentado.

## 18. App móvil (Expo)

La app vive en `mobile/`: Expo SDK 58, React Native 0.88, React 19, Expo Router, Context, SecureStore nativo / `localStorage` web, AsyncStorage para carrito y `expo-location` para el repartidor.

```bash
# Terminal 1: servidor en LAN
npm run dev -- --hostname 0.0.0.0
# Terminal 2: app
cd mobile && npm install && npx expo start
```

Escanea el QR con Expo Go. Si no detecta la IP desde Metro, crea `mobile/.env` con `EXPO_PUBLIC_API_URL=http://IP:3000` y `EXPO_PUBLIC_WEB_URL=http://IP:3000`. Preview: `npx expo start --web` (8081). Build: `npx expo export --platform web` o `npx eas-cli@latest build`.

Seguridad móvil: HTTPS obligatorio en producción, token en SecureStore `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, Android `allowBackup=false` y `usesCleartextTraffic=false`, ATS estricto en iOS, sin secretos en el bundle, deep link `mesacerca://` limitado a rutas, timeout 20 s y rechazo de login para cuentas con MFA.

Límites: sin push nativo (polling 5 s), sin mapa embebido (abre Google Maps), pago online en navegador, sin registro in-app, sin chat, sin offline, sin build en tiendas, sin E2E nativos y sin Play Integrity/pinning/root detection.

<a id="limites"></a>

## 19. Límites honestos

MesaCerca es un MVP funcional y verificado, no un producto listo para operar con dinero real. Antes de un lanzamiento:

| Área | Estado | Qué falta |
|---|---|---|
| Infraestructura | Diseñada | VPS, dominio, Cloudflare y Docker real. |
| Pagos | Demo/sandbox | Credenciales productivas, webhook live, conciliación, chargebacks, boleta. |
| KYC | Sandbox | Crédito live, webhook firmado end-to-end, revisión operativa. |
| Legal | Documentada | Leyes 21.431, 21.719 y 19.496, contratos y seguros. |
| Boleta electrónica | Pendiente | Integración SII. |
| Monitoreo | Pendiente | APM, logs centralizados, alertas y SIEM. |
| Rate limiting | En memoria | Redis/Upstash para múltiples instancias. |
| Contraseñas | Parcial | Recuperación y cambio self-service. |
| Privacidad | Parcial | Soporte ve PII; falta minimización y auditoría de acceso. |
| Backups | Diseñados | Uploads automáticos y restore programado. |
| CSP | Parcial | `unsafe-inline`; nonces/hash. |
| App móvil | Expo Go | EAS, tiendas, push, integridad y E2E. |
| Chat / offline / mapa | No | Sin mensajería, sin modo offline, mapa abre app externa. |
| Pruebas | Buenas, no exhaustivas | Carga, caos, pentest, iPhone y accesibilidad. |

> **Advertencia.** No es asesoría legal, tributaria ni financiera. Las leyes chilenas citadas deben validarse con profesionales antes de operar. No uses PII real ni dinero real hasta cerrar el checklist.

## 20. Roadmap

**Corto plazo:** cerrar checklist y desplegar en VPS con Cloudflare Tunnel; probar pagos sandbox (aprobado, rechazo, reembolso, chargeback); webhook Didit y KYC live; recuperación/cambio de contraseña; rate limiting en Redis; backup automático de DB/uploads con restore; monitoreo y logs centralizados.

**Mediano plazo:** boleta electrónica y conciliación; push y EAS; mapa embebido y tracking en vivo; chat moderado; soporte con minimización de PII; carga, caos y pentest; accesibilidad y copy.

**Largo plazo:** dispatch por zona y batching; PostGIS para geocercas; promociones; integraciones contables/inventario; expansión a otras ciudades; incentivos y seguro de repartidores.

El roadmap no promete fechas; es una lista priorizada.

<a id="documentacion"></a>

## 21. Documentación

`docs/` contiene 23 documentos. Los principales:

| Documento | Contenido |
|---|---|
| [`00-resumen-ejecutivo.md`](docs/00-resumen-ejecutivo.md) | Resumen para decisores. |
| [`01-brief-maestro.md`](docs/01-brief-maestro.md) | Brief y alcance. |
| [`02-investigacion-rappi.md`](docs/02-investigacion-rappi.md) | Competencia. |
| [`03-analisis-competitivo.md`](docs/03-analisis-competitivo.md) | Modelos comparados. |
| [`04-propuesta-de-valor-y-modelo.md`](docs/04-propuesta-de-valor-y-modelo.md) | Propuesta y economics. |
| [`05-arquitectura-tecnica.md`](docs/05-arquitectura-tecnica.md) | Arquitectura objetivo. |
| [`06-diseno-binance.md`](docs/06-diseno-binance.md) | Sistema de diseño. |
| [`07-roadmap-3-dias.md`](docs/07-roadmap-3-dias.md) | Plan de ejecución. |
| [`08-cumplimiento-chile.md`](docs/08-cumplimiento-chile.md) | Leyes y obligaciones. |
| [`09-manifiesto.md`](docs/09-manifiesto.md) | Principios. |
| [`10-decisiones-de-arranque.md`](docs/10-decisiones-de-arranque.md) | Decisiones iniciales. |
| [`11-mvp-tecnico.md`](docs/11-mvp-tecnico.md) | Stack y runbook. |
| [`12-qa-e2e.md`](docs/12-qa-e2e.md) | Plan de QA. |
| [`13-guia-de-pruebas.md`](docs/13-guia-de-pruebas.md) | Guía paso a paso. |
| [`14-app-movil.md`](docs/14-app-movil.md) | App Expo y API móvil. |
| [`15-qa-dispositivos.md`](docs/15-qa-dispositivos.md) | Pruebas en teléfonos. |
| [`16-resumen-nocturno.md`](docs/16-resumen-nocturno.md) | Cierre de QA. |
| [`17-auditoria-seguridad.md`](docs/17-auditoria-seguridad.md) | Primera auditoría. |
| [`18-produccion-cloudflare-postgres.md`](docs/18-produccion-cloudflare-postgres.md) | Producción y PostgreSQL. |
| [`19-pentest-externo.md`](docs/19-pentest-externo.md) | Plan de pentest. |
| [`20-kyc-didit.md`](docs/20-kyc-didit.md) | KYC con Didit. |
| [`21-despliegue-vps-cloudflare.md`](docs/21-despliegue-vps-cloudflare.md) | Despliegue VPS + Cloudflare. |
| [`22-auditoria-seguridad-2.md`](docs/22-auditoria-seguridad-2.md) | Segunda auditoría. |
| [`23-estado-y-operacion.md`](docs/23-estado-y-operacion.md) | Estado y operación. |

Referencia adicional: [`datasheet.md`](docs/datasheet.md), [`developer.md`](docs/developer.md), [`REFERENCES.md`](docs/REFERENCES.md), [`BITACORA.md`](docs/BITACORA.md), [`SECURITY.md`](SECURITY.md) y [`research/`](research/).

<a id="referencias"></a>

## 22. Referencias

La lista completa, con enlaces oficiales y comunitarios, está en [`docs/REFERENCES.md`](docs/REFERENCES.md). Incluye Next.js, React, TypeScript, Tailwind, Prisma, PostgreSQL, Expo, React Native, Leaflet, Mercado Pago, Transbank, Docker, Caddy, Cloudflare, Didit, Resend, Twilio, OWASP y la normativa chilena.

---

<a id="licencia"></a>

## 23. Licencia

MIT. Consulta [`LICENSE`](LICENSE).

```
Copyright (c) 2026 wanderc137
```

<div align="center">

MesaCerca

</div>
