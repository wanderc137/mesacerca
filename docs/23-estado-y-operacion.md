# MesaCerca — estado, operación y pendientes

> Guía única para entender qué está construido, cómo se inicia/detiene la
> plataforma, cómo probar los flujos y qué falta antes de producción.
>
> Fecha de esta foto: **09/11/2026**.
> Documentos detallados: `docs/17-auditoria-seguridad.md`,
> `docs/18-produccion-cloudflare-postgres.md`,
> `docs/20-kyc-didit.md`,
> `docs/21-despliegue-vps-cloudflare.md` y
> `docs/22-auditoria-seguridad-2.md`.

---

## 1. Qué es MesaCerca

MesaCerca es una plataforma de pedidos y reparto local para Santiago:

- **Cliente:** descubre locales, pide, paga, sigue el pedido y califica.
- **Local:** carga menú, acepta pedidos, prepara y entrega o solicita repartidor.
- **Repartidor:** se conecta, recibe pedidos, acepta, retira y entrega con PIN.
- **Admin/soporte:** métricas, pedidos, KYC, verificación, reembolsos y auditoría.

Superficies:

- Web/PWA: Next.js.
- API: route handlers y server actions.
- App móvil: Expo/React Native para cliente y repartidor.
- Base de datos: PostgreSQL 18.
- KYC: Didit con liveness activa.
- Pagos: Mercado Pago, Transbank y efectivo (hoy en modo mock/sandbox).

Estética: oscura, amarilla, densa y operativa, inspirada en Binance sin copiar
su marca.

---

## 2. Estado actual

### Funcionando en desarrollo

- Web/PWA completa.
- Paneles de local, repartidor y admin.
- App Expo de cliente y repartidor.
- PostgreSQL local con TLS, migraciones y backups.
- KYC real con Didit sandbox.
- MFA TOTP para admin/soporte/local.
- Verificación de email y teléfono (SMS opcional).
- Pedidos, PIN, cancelaciones, reembolsos, reviews y auditoría.
- Uploads de portadas con volumen persistente en Docker.
- Rate limits, CORS, CSP, headers y preflight de producción.
- Segunda auditoría de seguridad cerrada (`docs/22`).

### Estado de los servicios al crear este documento

La plataforma quedó **detenida** para apagar el computador:

- Next/API: detenido.
- Expo móvil/web: detenidos.
- PostgreSQL local: detenido.
- Puertos `3000`, `5433`, `8081`, `8082` y `8083`: cerrados.

Para volver a levantarla: `./scripts/platform-start.sh`.

### Lo que no está hecho

- No hay VPS, dominio ni Cloudflare configurados.
- No hay pagos reales probados.
- No hay build Android en Play Store/EAS.
- No hay webhook Didit configurado (`DIDIT_WEBHOOK_SECRET` vacío).
- No hay pentest externo ni prueba de carga.
- No hay monitoreo/SIEM.
- No hay despliegue Docker ejecutado en un VPS.

---

## 3. Arquitectura local

```
Navegador / Expo Go
        │
        ├── http://IP:3000        Next.js web + API
        └── exp://IP:8082         Expo Go (cliente/repartidor)
                │
                ▼
        PostgreSQL 127.0.0.1:5433
```

- Next escucha en `0.0.0.0:3000`.
- PostgreSQL local escucha en `127.0.0.1:5433` con TLS.
- Expo móvil usa `8082`.
- Expo web usa `8081`.
- La IP LAN se detecta automáticamente; hoy es `192.0.2.92`.

### Servicios y puertos

| Servicio | Puerto | Uso |
|---|---:|---|
| Next.js / API | 3000 | Web, paneles y API |
| PostgreSQL | 5433 | Base de datos local |
| Expo web | 8081 | Preview web móvil |
| Expo Go | 8082 | App nativa en el teléfono |
| Expo Android antiguo | 8083 | Solo si se inicia aparte |

---

## 4. Iniciar, detener y consultar

### Comandos principales

```bash
cd /home/jma/Documents/Proyect/mesacerca

./scripts/platform-start.sh     # PostgreSQL + Next + Expo móvil/web
./scripts/platform-stop.sh      # detiene todo
./scripts/platform-status.sh    # muestra puertos, health y URLs
./scripts/platform-restart.sh   # stop + start
```

También como npm:

```bash
npm run platform:start
npm run platform:stop
npm run platform:status
npm run platform:restart
```

### Solo web/API + base de datos

```bash
START_MOBILE=0 START_WEB=0 ./scripts/platform-start.sh
```

### Qué hace `platform-start.sh`

1. Crea `.run/` y `.run/logs/`.
2. Inicia PostgreSQL local (`npm run db:local:start`).
3. Inicia Next en `0.0.0.0:3000`.
4. Espera `/api/health` con `200`.
5. Inicia Expo móvil en `8082` y Expo web en `8081`.
6. Muestra las URLs LAN.

Los logs quedan en:

```text
.run/logs/next.log
.run/logs/expo-mobile.log
.run/logs/expo-web.log
```

### Qué hace `platform-stop.sh`

- Detiene Expo móvil/web y Next.
- Si no hay PID, busca el proceso por puerto y verifica que su directorio de
  trabajo sea del proyecto.
- Detiene PostgreSQL con `pg_ctl`.
- No toca procesos ajenos al proyecto.

### Si algo no arranca

```bash
./scripts/platform-status.sh
tail -100 .run/logs/next.log
tail -100 .run/logs/expo-mobile.log
```

- **PostgreSQL no responde:** `npm run db:local:start` (el script crea el
  directorio de sockets `/tmp/opencode/pg-sockets`).
- **Puerto 3000 ocupado:** `./scripts/platform-stop.sh` y volver a iniciar.
- **Expo no carga:** mismo WiFi, usar `exp://IP:8082`; si persiste,
  `cd mobile && npx expo start --go --lan --port 8082 --clear`.

---

## 5. URLs y cuentas demo

### URLs

- Web: `http://192.0.2.92:3000`
- Expo Go: `exp://192.0.2.92:8082`
- Expo web: `http://192.0.2.92:8081`
- Admin: `http://192.0.2.92:3000/admin`

La IP puede cambiar si el notebook se conecta a otra red. Los scripts la
detectan y la imprimen al iniciar.

### Cuentas demo

Contraseña: **`mesacerca123`**

| Rol | Email | Entrada |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | Web/app cliente |
| Local | `local@mesacerca.cl` | Web `/merchant` |
| Repartidor demo (KYC aprobado) | `repartidor@mesacerca.cl` | Web/app repartidor |
| Repartidor QA | `courier2@mesacerca.cl` | Pruebas de pedidos |
| Admin | `admin@mesacerca.cl` | Web `/admin` |

> `repartidor@mesacerca.cl` es Diego, con KYC aprobado. El botón “Repartidor demo”
> de la app usa esa cuenta. `courier2@mesacerca.cl` es Matías, cuenta QA sin caso
> KYC; sirve para probar el flujo KYC desde cero.

### KYC actual

- `tour.local@mesacerca.cl` (Tour MesaCerca): **APPROVED**, Didit, liveness 99.
- `repartidor@mesacerca.cl` (Diego): **APPROVED**, Didit, liveness 99.
- `courier2@mesacerca.cl` (Matías): **sin caso KYC**, `VERIFIED` manualmente.
- Si Matías inicia KYC, pasa a `PENDING` hasta que Didit lo apruebe.

### Flujo para probar KYC desde cero

1. Abrir la web y entrar manualmente con `courier2@mesacerca.cl` / `mesacerca123`.
2. Ir a `/kyc`.
3. Tocar **Iniciar verificación**.
4. Completar Didit sandbox con datos de prueba.
5. Volver a `/kyc/return`; revisar `/admin/kyc`.

El KYC de la web y la app son sesiones distintas: si la app abre `/kyc` en el
navegador, hay que iniciar sesión también en el navegador.

---

## 6. KYC con Didit

### Configuración actual

- Proveedor: `KYC_PROVIDER=didit`.
- Workflow endurecido: `MesaCerca Courier Strict`.
- ID: `a08dab96-d9f6-4618-9f9e-a31babd0f1db`.
- Estado: **published** en sandbox.
- Precio: **USD 0.58** por sesión.
- Features: `OCR + LIVENESS + FACE_MATCH + AML + IP_ANALYSIS`.
- Liveness: `ACTIVE_3D`.
- Strict flash: `1`.
- Umbrales liveness: decline 40 / review 65.
- Face match: 45 / 65.
- AML: approve 50 / review 80 / match 80.
- Inyección, cámara virtual y captura de pantalla: `DECLINE`.
- Emulador, root, app manipulada y hooking: `DECLINE`.
- VPN, duplicados de dispositivo/IP y automatización: `REVIEW`.
- NFC: desactivado.
- Duplicados de email/teléfono: pendientes (`NO_ACTION`).

### Keys

Hay dos keys separadas:

| Variable | Permiso | Uso |
|---|---|---|
| `DIDIT_API_KEY` | Sessions / Decisions | Crear sesiones KYC desde la app |
| `DIDIT_WORKFLOW_API_KEY` | Workflows: Write | Scripts de administración del workflow |

La app **no** debe recibir `DIDIT_WORKFLOW_API_KEY`; `deploy/docker-compose.yml`
la fuerza vacía en el runtime.

### Scripts de workflow

```bash
npm run kyc:strict-workflow    # crea un workflow estricto
npm run kyc:harden-workflow    # endurece un draft existente
```

- Requieren una key con `Workflows: Write`.
- `kyc:harden-workflow` busca el draft `MesaCerca Courier Strict`.
- No toca workflows publicados salvo `DIDIT_FORCE_PATCH=true`.

### Prueba realizada

Se creó una sesión sandbox real desde MesaCerca:

- `KycCase` quedó `PENDING`.
- `providerRef` y `providerUrl` se guardaron.
- El courier pasó a `PENDING`.
- El caso de prueba se eliminó y el courier se restauró a `VERIFIED`.

### Pendiente de KYC

- **`DIDIT_WEBHOOK_SECRET` está vacío.** Hoy el resultado se obtiene por
  callback/polling. En producción hay que crear el destino `status.updated`,
  copiar su signing secret y configurar `DIDIT_CALLBACK_URL` HTTPS.
- Probar un webhook firmado end-to-end.
- Configurar KYC live y crédito Didit.
- NFC y SDK nativo con device integrity quedan para una fase posterior.

---

## 7. Seguridad

La segunda auditoría está en `docs/22-auditoria-seguridad-2.md`. Resumen:

### Corregido

- IDOR en el retorno KYC.
- `SUPPORT` con permisos de admin.
- Bypass de MFA desde la app móvil.
- MFA no verificada en server actions.
- Webhooks KYC fuera de orden/replay.
- Spoofing de IP para saltarse rate limits.
- Credenciales de pago de prueba en producción.
- Fuga de `paymentRef`/payloads internos en pedidos.
- Carrera de reseñas.
- Abuso de costo en KYC.
- Caché de páginas con MFA/KYC.
- Panel de repartidor no verificado.
- Tiendas de merchants suspendidos.
- Backups locales sin cifrar.
- Separación de la key de administración Didit.

### Controles actuales

- JWT con `issuer`, `audience`, `purpose` y `tokenVersion`.
- Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- MFA TOTP con AES-256-GCM y códigos de recuperación.
- Rate limits en login, registro, MFA, pedidos, pagos, reviews, KYC y GPS.
- CORS con allowlist y bloqueo de mutaciones no confiables.
- CSP, HSTS, `X-Frame-Options`, `nosniff`, `Permissions-Policy`.
- Validación de precios, ítems, modificadores y estado en el servidor.
- PIN de entrega con bloqueo tras 5 intentos.
- Aceptación atómica de pedidos.
- Minimización de datos de cliente para repartidores antes de aceptar.
- Uploads con magic bytes, tamaño y dimensiones.
- Webhooks de pago con firma y validación de monto/moneda.
- KYC con liveness activa, face match, AML y device/IP analysis.
- Backups cifrados opcionales y preflight de producción.

### Riesgos residuales

- Rate limits en memoria por instancia; falta Redis/Upstash.
- Body limits dependen de `Content-Length`; el perfil Tunnel no pasa por Caddy.
- No hay recuperación/cambio de contraseña.
- Soporte todavía puede ver PII; falta mínimo privilegio fino y auditoría visual.
- No hay UI/SIEM de auditoría.
- PostgreSQL interno del Compose no usa TLS (red interna); producción debería
  usar PostgreSQL administrado con TLS.
- No hay backup del volumen de uploads.
- `prisma/dev.db` y `backups/*.dump` locales contienen PII; borrar/cifrar.
- CSP todavía usa `unsafe-inline`.
- App móvil sin Play Integrity, pinning, root detection ni build EAS.
- Preview web móvil usa `localStorage`; no publicar como producción.
- Sin monitoreo, alertas, load test ni pentest externo.
- `DIDIT_WEBHOOK_SECRET` vacío.
- Pagos reales, conciliación y chargebacks pendientes.

---

## 8. Pagos

Estado actual: **modo mock** en desarrollo.

- `PAYMENTS_MODE="mock"` en `.env`.
- En producción `npm start` rechaza `mock`; exige `sandbox` o `production`.
- Transbank no puede usar integración si `PAYMENTS_MODE=production`.
- Mercado Pago rechaza tokens `TEST-` en producción.
- Webhook de Mercado Pago verifica firma, pedido, monto y moneda.
- Retorno de Transbank verifica token, `buy_order` y monto.
- Reembolsos se ejecutan desde admin y llaman a la pasarela.
- Si un pago llega después de una cancelación, queda `REFUND_PENDING`; no hay
  reembolso automático.

Antes de cobrar de verdad:

1. Probar sandbox de Mercado Pago y Transbank.
2. Probar webhook, pago aprobado, rechazado, reembolso y chargeback.
3. Conciliación diaria y alertas de discrepancia.
4. No activar `production` hasta cerrar esos puntos.

---

## 9. Despliegue

El paquete está en `deploy/` y el runbook en `docs/21`.

Incluye:

- `Dockerfile` standalone.
- `deploy/docker-compose.yml` con app, PostgreSQL, migraciones y perfiles
  `tunnel` (recomendado) y `edge` con Caddy.
- `deploy/Caddyfile`.
- `deploy/provision-vps.sh`.
- `deploy/backup-db.sh` / `restore-db.sh`.
- `deploy/.env.production.example`.
- `deploy/refresh-cloudflare-firewall.sh`.

Cloudflare recomendado:

- DNS proxied.
- SSL/TLS **Full (strict)**.
- WAF + rate limits + Bot Fight.
- Access en `/admin`.
- Caché bypass para APIs y páginas privadas.
- Origen cerrado; Tunnel preferido sobre abrir 80/443.

### Estado del despliegue

- No hay VPS ni dominio.
- No hay Cloudflare configurado.
- No se ejecutó Docker real en este equipo.
- Caddy y Compose fueron validados localmente.

Cuando exista VPS/dominio:

```bash
ssh root@IP 'EDGE_MODE=tunnel bash /root/provision-vps.sh'
# copiar proyecto y deploy/.env
cd /opt/mesacerca/deploy
docker compose build
docker compose --profile tunnel up -d
```

---

## 10. Backups

### Local

```bash
BACKUP_PASSPHRASE='...' npm run db:backup
```

- Genera `backups/mesacerca-*.dump`.
- Si hay passphrase, cifra con AES-256-CBC + PBKDF2.
- Sin passphrase avisa que queda sin cifrar.
- No sourcea `.env` (evita errores con valores especiales).

### Docker/VPS

```bash
cd deploy
BACKUP_PASSPHRASE='...' ./backup-db.sh
CONFIRM_RESTORE=YES ./restore-db.sh ../backups/mesacerca-....dump
```

- Probar restauración, no solo crear el backup.
- Guardar copia fuera del VPS.
- Incluir el volumen `uploads` o mover portadas a R2/S3.

---

## 11. App móvil

### Iniciar

```bash
./scripts/platform-start.sh
```

En el teléfono, mismo WiFi:

```text
exp://192.0.2.92:8082
```

Si Expo Go pide URL, usar esa; no “Recent history”.

### Cuentas

- **Cliente demo:** `cliente@mesacerca.cl`.
- **Repartidor demo:** `repartidor@mesacerca.cl` (Diego, KYC aprobado).
- **Repartidor QA:** `courier2@mesacerca.cl` (Matías, sin caso KYC).

### Limitaciones actuales

- Es Expo Go, no un APK independiente.
- No hay build EAS/Play Store.
- No hay MFA móvil; las cuentas con MFA deben usar la web.
- No hay Play Integrity, pinning ni root detection.
- El preview web móvil guarda token en `localStorage`; no usar como producción.

---

## 12. Flujos de prueba recomendados

### Cliente

1. Entrar como `cliente@mesacerca.cl`.
2. Elegir local, agregar plato y modificadores.
3. Pagar en efectivo o mock.
4. Seguir el pedido.
5. Calificar al recibir.

### Local

1. Entrar como `local@mesacerca.cl`.
2. Aceptar pedido, preparar, marcar listo.
3. Si es delivery, solicitar repartidor.
4. Ver el PIN de retiro.

### Repartidor

1. Entrar como `repartidor@mesacerca.cl` o `courier2@mesacerca.cl`.
2. Conectarse, aceptar pedido.
3. Confirmar retiro dentro del geofence.
4. Pedir PIN al cliente y confirmar entrega.
5. Revisar ganancias.

### KYC

1. Entrar manualmente como `courier2@mesacerca.cl` en la web.
2. `/kyc` → Iniciar verificación.
3. Completar Didit sandbox.
4. Revisar `/admin/kyc`.
5. Recordar que iniciar KYC pone al courier en `PENDING`.

---

## 13. Comandos de mantenimiento

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run security:audit
npm run security:env
npx prisma migrate deploy
npx prisma migrate status
npx prisma validate
npm run db:backup
```

### Producción

```bash
NODE_ENV=production npm start
```

Falla si faltan:

- `NEXT_PUBLIC_APP_URL` HTTPS.
- `TRUST_PROXY=1`.
- `MFA_ENFORCED=true`.
- `KYC_REQUIRED=true`.
- `EMAIL_VERIFICATION_REQUIRED=true`.
- `COURIER_SECURITY_ENFORCED=true`.
- Secretos fuertes.
- Proveedor KYC real.
- `PAYMENTS_MODE=sandbox|production`.
- Webhook secrets.

---

## 14. Pendientes priorizados

### Bloqueantes antes de VPS/producción

1. VPS Linux + dominio + Cloudflare.
2. `DIDIT_WEBHOOK_SECRET` y destino webhook.
3. KYC live y prueba completa.
4. PostgreSQL administrado con TLS o TLS interno.
5. Backups cifrados + restauración probada.
6. WAF, rate limits de borde y Access en `/admin`.
7. Pagos sandbox probados.
8. Pentest externo.

### Después del lanzamiento

- Redis/Upstash para rate limits.
- Monitoreo/Sentry/SIEM.
- Password reset y cambio de contraseña.
- UI de auditoría admin.
- MFA móvil.
- Play Integrity/certificate pinning/EAS.
- Backup de uploads a R2/S3.
- Prueba de carga.
- Revisión legal y DPA Didit.

---

## 15. Mapa de archivos clave

| Archivo | Qué contiene |
|---|---|
| `app/` | Páginas, paneles, API y server actions |
| `components/` | UI web |
| `lib/` | Auth, MFA, pagos, KYC, pedidos, courier, pricing |
| `prisma/schema.prisma` | Modelo de datos y migraciones |
| `mobile/` | App Expo cliente/repartidor |
| `scripts/platform-*.sh` | Inicio/parada/estado local |
| `scripts/security-audit.mjs` | Pruebas de abuso de la API |
| `scripts/create-didit-strict-workflow.mjs` | Crear workflow Didit |
| `scripts/harden-didit-workflow.mjs` | Endurecer draft Didit |
| `deploy/` | Docker, Compose, Caddy, VPS y backups |
| `docs/17` | Auditoría 1 |
| `docs/20` | KYC Didit |
| `docs/21` | Despliegue VPS/Cloudflare |
| `docs/22` | Auditoría 2 y riesgos residuales |

---

## 16. Regla de oro

Antes de abrir al público:

- No usar cuentas demo ni `mesacerca123`.
- No usar `PAYMENTS_MODE=mock`.
- No usar `KYC_REQUIRED=false`.
- No exponer `next dev` a Internet.
- No abrir PostgreSQL a Internet.
- No publicar sin webhook KYC firmado.
- No cobrar sin sandbox, conciliación y reembolsos probados.
- No confiar solo en KYC: combinarlo con device integrity, límites, revisión
  humana y monitoreo.
