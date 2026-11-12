# Auditoría de seguridad 2 — 09/11/2026

> Segunda pasada nocturna sobre la plataforma web, API, server actions,
> base de datos, scripts de operación, despliegue y app móvil. Complementa
> `docs/17-auditoria-seguridad.md` y `docs/21-despliegue-vps-cloudflare.md`.

## 1. Alcance y método

Revisión estática y pruebas dirigidas sobre:

- Autenticación web/móvil, sesiones, MFA, recuperación y verificación.
- Autorización por rol: cliente, local, repartidor, admin y soporte.
- Pedidos, pagos, reembolsos, PIN de entrega y máquina de estados.
- KYC Didit: sesión, callback, webhook, estados y datos almacenados.
- Uploads, imágenes servidas en runtime y almacenamiento en disco.
- Rate limiting, IP real detrás de proxy, CORS y cabeceras.
- Prisma, migraciones, índices y carreras de escritura.
- App Expo: almacenamiento de token, URLs, deep links y configuración Android.
- Scripts de backup, secretos, Docker, Caddy y Cloudflare.
- Dependencias (`npm audit` raíz y móvil).

No se ejecutó un pentest externo, no se probaron pagos live, no se levantó
Docker real en este equipo y Cloudflare/VPS aún no existen. Esas partes quedan
como riesgos residuales explícitos.

---

## 2. Resumen

| Severidad | Hallazgo | Estado |
|---|---|---|
| Alta | `/kyc/return` sin autenticación ni ownership: permitía refrescar el KYC de otra cuenta si se conocía el session ID | Corregido |
| Alta | Rol `SUPPORT` podía aprobar KYC, verificar/suspender locales y repartidores, y reembolsar pedidos | Corregido |
| Alta | Login móvil emitía token sin MFA para cuentas con MFA activo | Corregido |
| Alta | Server actions de admin/local no verificaban MFA; el layout no era suficiente | Corregido |
| Alta | Webhook KYC aceptaba eventos fuera de orden/replay y podía pisar una decisión más nueva | Corregido |
| Alta | Rate limit vulnerable a `X-Real-IP`/`X-Forwarded-For` falsos; móvil sin límite global por IP | Corregido |
| Alta | Transbank podía usar credenciales públicas de integración con `PAYMENTS_MODE=production` | Corregido |
| Alta | `getOrderForViewer` exponía `payment.raw/providerRef` y payloads de eventos con tokens de pago | Corregido |
| Media | Dos reviews concurrentes podían inflar ratings; `providerRef` KYC no era único | Corregido con migración |
| Media | `startKyc` permitía crear sesiones Didit ilimitadas (costo/abuso) | Corregido |
| Media | Páginas con MFA/KYC/sesión podían quedar en caché compartida | Corregido |
| Media | Repartidor no verificado podía ver el panel web y pedidos disponibles | Corregido |
| Media | Tiendas de merchants suspendidos podían seguir visibles si el estado quedaba inconsistente | Corregido |
| Media | `scripts/backup-postgres.sh` sourceaba `.env` (rompía con `<`) y no cifraba backups | Corregido |
| Baja | Health endpoint contaba usuarios en cada request público | Corregido |
| Baja | JWT antiguos sin `ver` podían seguir válidos | Corregido |
| Baja | Activar MFA no revocaba sesiones anteriores | Corregido |
| Baja | Clave de gestión Didit podía llegar al runtime de la app | Mitigado |

---

## 3. Hallazgos corregidos

### H-01. KYC return sin autenticación ni ownership

**Antes:** `app/(dashboard)/kyc/return/page.tsx` leía
`verificationSessionId` de la query y llamaba a `refreshKycFromProvider` sin
sesión ni comprobar que el caso perteneciera al usuario. Un usuario autenticado
podía forzar la consulta/actualización de otro caso si conocía el session ID.

**Corrección:**

- La página exige `requireUser`.
- `refreshKycFromProvider(sessionId, userId)` busca el caso por `providerRef` y
  `userId`; si no pertenece al usuario, no llama a Didit.
- `applyDiditDecision` acepta `caseId` y verifica que `provider` y
  `providerRef` coincidan.
- Se probó con cookie de `courier2@mesacerca.cl` contra el session ID de otro
  usuario: responde “No encontramos una verificación asociada a tu cuenta” y
  no actualiza el caso.

### H-02. `SUPPORT` con permisos de administrador

**Antes:** `requireAdmin` aceptaba `ADMIN` y `SUPPORT` en
`app/actions/admin.ts` y `app/actions/kyc.ts`. Soporte podía reembolsar,
verificar/suspender y aprobar KYC.

**Corrección:**

- `requireFullAdmin()` exige `ADMIN` para:
  - `setMerchantStatusAction`
  - `setCourierVerificationAction`
  - `adminCancelOrderAction`
  - `setKycStatusAction`
- `requireAdmin()` sigue permitiendo lectura a `SUPPORT`.
- Las páginas de admin ocultan los formularios de acción cuando el rol no es
  `ADMIN` y muestran “Solo lectura”.

### H-03. Bypass de MFA desde la app móvil

**Antes:** `/api/mobile/auth/login` verificaba email/password y rol, pero no
`mfaEnabled`. Una cuenta con MFA podía obtener un Bearer sin TOTP.

**Corrección:**

- El login móvil responde `403` si la cuenta tiene MFA activo y pide usar la web.
- Se bloquea la configuración de MFA para `COURIER`/`CUSTOMER` hasta que exista
  un desafío TOTP móvil; la UI de seguridad oculta esa tarjeta para couriers.
- Se probó con una cuenta temporal con `mfaEnabled=true`: `403`.
- El login normal de `courier2@mesacerca.cl` sigue respondiendo `200`.

### H-04. MFA no verificada en server actions

**Antes:** el layout de admin/local redirigía si faltaba MFA, pero una sesión
creada antes de activar `MFA_ENFORCED` podía invocar server actions directamente.

**Corrección:**

- `requireAdmin`, `requireFullAdmin`, `currentMerchant` y las rutas
  `/api/merchant/*` comprueban `MFA_ENFORCED` + `mfaEnabled`.
- Al activar MFA se incrementa `tokenVersion`, revocando sesiones anteriores.
- `MFA_ENCRYPTION_KEY` ya no cae a `AUTH_SECRET`/`dev-only` en producción:
  lanza error si falta.

### H-05. Webhook KYC fuera de orden / replay

**Antes:** `applyDiditDecision` aplicaba cualquier webhook firmado sin comparar
`created_at`. Un `Approved` reenviado podía pisar un `Declined` más nuevo.

**Corrección:**

- `KycCase.providerEventAt` guarda el `created_at` del evento.
- Si llega un evento con timestamp anterior, se ignora.
- Los eventos duplicados con el mismo estado actualizan el timestamp sin
  reaplicar la decisión.
- Migración: `20261109050000_security_hardening`.
- El secreto de webhook sigue siendo obligatorio en producción; hoy está
  vacío en desarrollo (ver riesgos residuales).

### H-06. Rate limit e IP real

**Antes:** `getClientIpFromHeaders` confiaba en `x-real-ip` incluso sin proxy y
usaba el último valor de `X-Forwarded-For`. Un atacante podía variar la clave
del rate limit o compartir la IP del proxy.

**Corrección:**

- Solo se confían cabeceras de proxy con `TRUST_PROXY=1`.
- Se valida la IP con `node:net.isIP` (IPv4/IPv6, con o sin puerto).
- Se prefiere `CF-Connecting-IP`; el fallback usa el primer valor válido de
  `X-Forwarded-For`.
- Sin proxy confiable se usa `"local"` en vez de un header controlable.
- Pruebas unitarias: CF header, XFF con cadena, IPv6 entre corchetes y
  `TRUST_PROXY=0` dieron los valores esperados.

### H-07. Login móvil sin límite global por IP

Se agregó `mobile-login-ip` (30/min) además de los límites por email y por
email+IP. Esto reduce credential stuffing rotando emails.

### H-08. Credenciales de prueba en producción

**Antes:** con `PAYMENTS_MODE=production`, Transbank podía caer en
`TRANSBANK_ENVIRONMENT=integration` y usar las credenciales públicas del SDK.
Mercado Pago podía recibir un token `TEST-`.

**Corrección:**

- `getTransaction()` lanza error si `PAYMENTS_MODE=production` y
  `TRANSBANK_ENVIRONMENT !== "production"`.
- `getAccessToken()` rechaza tokens `TEST-` en producción.
- `check-env` y `lib/env.ts` bloquean ambas configuraciones al arrancar.

### H-09. Fuga de datos de pago en el pedido

**Antes:** `serializeOrder` devolvía `payment` completo (incluido
`providerRef`/`raw`) y `events[].payload` con `providerRef` de Mercado Pago o
Transbank a clientes, locales y repartidores.

**Corrección:**

- `payment` se serializa solo como `{ provider, status, amount }`.
- `events[].payload` se entrega como `null`; la UI solo usa `type`/`createdAt`.
- No se encontraron consumidores de UI que necesitaran el payload.
- `SUPPORT` ya no recibe los PIN de retiro/entrega; solo `ADMIN`, el local o el cliente según corresponda.

### H-10. Carrera de reseñas

**Antes:** dos requests concurrentes podían pasar el `findUnique` y crear dos
reseñas del mismo autor/pedido, inflando ratings.

**Corrección:**

- `@@unique([orderId, authorId, targetType])` en `Review`.
- `POST /api/reviews` captura `P2002` y responde `409`.
- Migración `20261109050000_security_hardening`; no había duplicados previos.

### H-11. Abuso de costo en KYC

**Antes:** cada click en “Iniciar verificación” creaba una sesión Didit nueva,
incluso si ya había una pendiente.

**Corrección:**

- Rate limit `kyc-start:<userId>` 3/hora.
- `KycCase.providerUrl` permite reanudar una sesión de menos de 15 minutos sin
  crear otra.
- Al terminar el caso se borra `providerUrl`.
- Migración `20261109060000_kyc_provider_url`.

### H-12. Caché de páginas sensibles

Se agrega `Cache-Control: private, no-store` + `Pragma: no-cache` para
`/admin`, `/merchant`, `/courier`, `/kyc`, `/mfa`, `/settings`, `/order`,
`/checkout`, `/orders`, `/login`, `/register`, `/registro/*` y `/verify-email`.
También se actualizó Caddy y el runbook de Cloudflare.

### H-13. Repartidor no verificado en panel web

`app/(dashboard)/courier/layout.tsx`, `/courier` y `/courier/earnings` ahora
redirigen a `/kyc` si `verificationStatus !== "VERIFIED"`. La API ya lo exigía;
esto cierra la exposición de pedidos disponibles en la UI.

### H-14. Tiendas de merchants no verificados

Se agregó `merchant.status === "VERIFIED"` a la home, búsqueda móvil, detalle
de tienda y creación de pedidos. Evita que una tienda `ACTIVE` con merchant
suspendido siga vendiendo si el estado quedó inconsistente.

### H-15. Integridad de KYC

- `KycCase.providerRef` ahora es único.
- `providerUrl` no se muestra en el panel admin.
- `providerEventAt` evita carreras de webhooks.
- Se mantiene la revocación de courier/merchant cuando un KYC aprobado pasa a
  `REJECTED`.

### H-16. Health endpoint

`/api/health` ya no ejecuta `count(*)` de usuarios. Hace `SELECT 1` contra la
base; reduce carga y evita inferir tamaño de la tabla.

### H-17. Sesiones antiguas sin `ver`

`getSession`, `getMobileSession` y `getMfaPending` exigen que el JWT incluya
`ver` numérico. Tokens antiguos sin ese claim dejan de ser válidos.

### H-18. Backup local

`scripts/backup-postgres.sh`:

- Ya no sourcea `.env` (fallaba con valores como `EMAIL_FROM="MesaCerca <...>"`).
- Extrae solo `DATABASE_URL`.
- Aplica `umask 077`.
- Cifra opcionalmente con `BACKUP_PASSPHRASE` (AES-256-CBC + PBKDF2).
- Avisa si el backup queda sin cifrar.

### H-19. Separación de la key de gestión Didit

`deploy/docker-compose.yml` fuerza `DIDIT_WORKFLOW_API_KEY=""` en `app` y
`migrate`. Así una key con `Workflows: Write` no queda disponible para el
runtime web aunque esté en el `.env` del host.

---

## 4. Verificación ejecutada

- `npm audit --omit=dev` raíz: **0 vulnerabilidades**.
- `npm audit --omit=dev` móvil: **0 vulnerabilidades**.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npx prisma validate`: PASS.
- `npx prisma migrate deploy`: 2 migraciones nuevas aplicadas.
- `caddy validate`: PASS.
- `docker compose config --profile '*'`: PASS.
- `bash -n` en scripts de deploy/backup: PASS.
- `GET /api/health`: 200.
- `GET /login`: 200 con `Cache-Control: no-store`.
- `GET /mfa/setup` sin sesión: 307 a `/login`, no-store.
- `GET /kyc/return` sin sesión: 307 a login con `next` preservado.
- IDOR KYC con cookie de courier2 contra session de otro usuario: bloqueado.
- Login móvil con MFA activo: 403.
- Login móvil normal de courier2: 200.
- Uploads runtime: 200 `image/jpeg`.
- Test Didit del workflow estricto: sesión `92e5f19d...`, `Approved`,
  liveness `ACTIVE_3D` 99, face match 95, AML 0.
- Workflow `MesaCerca Courier Strict` publicado (`a08dab96...`, USD 0.58).
- Inicio de KYC desde MesaCerca: `KycCase` quedó `PENDING` con `providerRef`,
  `providerUrl` y courier en `PENDING`; el caso de prueba se eliminó y el
  courier se restauró a `VERIFIED`.
- `npm run security:audit`: doble aceptación concurrente `200/409`, PIN
  bloqueado tras 5 intentos, sin datos de cliente antes de aceptar, sin
  teléfono/coordenadas del courier después de entregado, y CORS sin
  `Access-Control-Allow-Origin` para origen no confiable.

---

## 5. Riesgos residuales antes de producción

### Bloqueantes

1. **`DIDIT_WEBHOOK_SECRET` vacío en desarrollo.** El KYC actual funciona por
   callback/polling. En producción hay que crear el destino `status.updated`,
   copiar su signing secret, configurar `DIDIT_CALLBACK_URL` HTTPS y probar un
   webhook firmado. `npm start` ya falla sin ese secreto.
2. **Cloudflare/VPS no configurados.** Falta dominio, DNS, Full (strict), WAF,
   rate limit de borde, Access en `/admin` y cierre del origen.
3. **Pagos live no probados.** Falta sandbox completo de Mercado Pago/Transbank,
   webhook, reembolso, conciliación, chargebacks y alertas de discrepancia.
4. **Pentest externo pendiente.** `docs/19-pentest-externo.md` tiene el alcance.
5. **Docker real no ejecutado en este equipo.** Se validaron Caddy y Compose,
   pero no se construyó/levantó la imagen; hacerlo en staging/VPS.

### Altos / medios

6. **Rate limits en memoria por instancia.** Con más de una réplica se diluyen.
   Migrar a Redis/Upstash o replicar reglas en Cloudflare.
7. **Body limits basados en `Content-Length`.** Un request chunked sin header
   puede saltarse el chequeo de la app. Caddy limita a 8 MB en el perfil edge;
   el perfil Tunnel va directo a Next. Considerar Caddy interno o regla de
   Cloudflare para el túnel.
8. **Sin recuperación/cambio de contraseña.** Un usuario que pierde la clave
   depende de soporte. Implementar token de un uso, expiración corta,
   revocación de sesiones y auditoría.
9. **Soporte con acceso a PII.** Aunque ya es read-only para acciones críticas,
   puede ver pedidos, direcciones y KYC. Definir mínimo necesario, auditar
   vistas y separar soporte financiero/operativo.
10. **Sin UI de auditoría.** Los `AuditLog` existen, pero no hay panel para
    revisarlos ni exportarlos a SIEM.
11. **PostgreSQL interno del Compose sin TLS.** Es una red Docker interna; para
    producción con datos sensibles usar PostgreSQL administrado con
    `sslmode=verify-full` o configurar TLS en el contenedor.
12. **Backups de uploads.** El script respalda la base, no el volumen
    `uploads`. Incluirlo o mover portadas a R2/S3.
13. **`prisma/dev.db` y `backups/*.dump` locales contienen PII/**
    hashes de contraseñas. Están en 600 y gitignored, pero no deben copiarse a
    otra máquina ni subirse. Borrar o cifrar antes de compartir el proyecto.
14. **CSP con `unsafe-inline`.** No hay sinks de XSS conocidos, pero un nonce
    sería más fuerte. Requiere integrar nonce en Next/Turbopack.
15. **App móvil:** falta Play Integrity/App Attest, certificate pinning,
    detección de root/emulador, OTA firmado y build EAS/Play Console.
16. **Preview web móvil:** usa `localStorage` para el token. No publicar el build
    web de Expo como producción; usar cookie httpOnly/BFF o no persistir token.
17. **Sin monitoreo/SIEM/Sentry.** No hay alertas de 5xx, login fallido, PIN
    bloqueado, saltos GPS, reembolsos o KYC rechazado.
18. **Sin secret manager.** `.env` 600 es aceptable para staging; producción
    debe usar Infisical/Doppler/Vault/SOPS y rotación.
19. **Cloudflare Tunnel vs Edge.** En modo Edge, Docker puede saltarse UFW al
    publicar 80/443. Usar Tunnel o reglas `DOCKER-USER`/firewall de host.
20. **Sin prueba de carga.** k6/Artillery antes de abrir tráfico.
21. **KYC:** email/teléfono duplicados siguen en `NO_ACTION`; NFC desactivado;
    no hay SDK nativo con señales de dispositivo. La liveness activa estricta
    reduce el riesgo de deepfake, no lo elimina.
22. **Legal:** consentimiento biométrico, retención, DPA con Didit y Ley 21.719
    deben cerrarse antes de datos reales.

---

## 6. Próximos pasos sugeridos

1. Configurar webhook Didit y probar un evento firmado end-to-end.
2. Probar el KYC desde MesaCerca con `courier2@mesacerca.cl` y confirmar `KycCase`.
3. Levantar Docker en staging, ejecutar `migrate deploy`, backup/restore y smoke.
4. Configurar Cloudflare Full (strict), WAF, rate limits y Access en `/admin`.
5. Implementar password reset, rate limit Redis y monitoreo.
6. Rotar/eliminar `prisma/dev.db` y backups locales con PII.
7. Contratar pentest externo y prueba de carga antes de pagos reales.
