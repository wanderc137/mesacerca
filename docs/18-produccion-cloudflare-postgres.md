# Producción: Cloudflare + PostgreSQL + confianza

> Guía de despliegue endurecido para MesaCerca. Complementa `docs/17-auditoria-seguridad.md`.
> Para ejecutar el despliegue en un VPS con Docker/Caddy, usa el runbook
> `docs/21-despliegue-vps-cloudflare.md`.

---

## 1. Arquitectura recomendada

```
Cliente / App
     │ HTTPS
     ▼
Cloudflare (DNS, TLS, WAF, rate limit, bot management)
     │ HTTPS (Full Strict)
     ▼
Next.js (Vercel / Fly.io / Render / VPS con Docker)
     │ TLS verify-full
     ▼
PostgreSQL administrado (Neon / Supabase / RDS / Cloud SQL)
```

- El origen **no se expone directo**: solo acepta tráfico desde Cloudflare (firewall/origen autenticado).
- Cloudflare termina TLS público; el origen usa un certificado de origen válido.
- La app exige TLS hacia PostgreSQL con `sslmode=verify-full` y CA.

---

## 2. Cloudflare

### 2.1 TLS y DNS
- Proxy naranja activo para el dominio.
- SSL/TLS → **Full (strict)**.
- **Always Use HTTPS** y HSTS (max-age 6–12 meses, includeSubDomains, preload cuando estés listo).
- Minimum TLS 1.2; ideal 1.3.
- Deshabilitar “Opportunistic Encryption” si usas Full Strict.

### 2.2 WAF y rate limiting
Reglas mínimas:

| Ruta | Regla |
|---|---|
| `/api/mobile/auth/login` | 5 req/min por IP + bot score; bloqueo temporal tras 429 repetidos. |
| `/api/orders` | 20 req/min por IP; 12/min por usuario en la app. |
| `/api/merchant/cover` | 10 req/hora por IP. |
| `/login`, `/register`, `/registro/*` | 10 req/min por IP + Turnstile si hay bots. |
| `/admin/*` | Cloudflare Access (Zero Trust) + MFA de la app. |
| `/api/courier/location` | 120 req/min por IP; 60/min en la app por usuario. |
| `/api/courier/status` | 30 req/min por IP. |
| `/api/kyc/return`, `/api/kyc/webhook` | 30 req/min; webhook solo con HMAC válido. |
| `/api/*` | Bypass de caché; no cachear respuestas autenticadas. |

- Activar **Managed Rules** (OWASP Core Ruleset) en modo bloqueo tras una semana de observación.
- Activar **Bot Fight Mode** o Super Bot Fight Mode.
- Activar **Turnstile** en registro/login si aparece abuso; el rate limit de la app ya existe.
- Configurar **Logpush** a S3/R2/SIEM para conservar logs de seguridad.

### 2.3 Caché
- Cache Rules: bypass para `/api/*`, `/admin/*`, `/merchant/*`, `/courier/*`, `/order/*`, `/checkout`, `/login`.
- Cachear solo `/_next/static/*`, imágenes públicas y fuentes.

### 2.4 Origen
- Firewall del servidor: permitir 80/443 solo a rangos de Cloudflare.
- `TRUST_PROXY=1` en la app para usar `cf-connecting-ip`.
- `COURIER_SECURITY_ENFORCED=true` para activar límites de salto, frescura de GPS y geofence de retiro.
- `CORS_ORIGINS` con el dominio productivo (`https://mesacerca.cl`) y orígenes de la app web si aplica.
- Mantener el origen sin IP pública directa o con Cloudflare Tunnel.
- Si el origen tiene IP histórica, rotarla; Cloudflare no protege accesos directos.
- SPF/DKIM/DMARC para el dominio de correo; Cloudflare no evita spoofing de email.
- DNS: eliminar registros huérfanos y subdominios sin uso (subdomain takeover).

### 2.5 Lo que Cloudflare no resuelve
Cloudflare no corrige lógica de negocio, tokens robados, abuso autenticado, fraude interno, GPS falso, deepfakes ni clientes móviles comprometidos. Ver la tabla completa en `docs/17-auditoria-seguridad.md` sección 11.

---

## 3. PostgreSQL

### 3.1 Requisitos
- PostgreSQL 16+ administrado (Neon/Supabase/RDS/Cloud SQL) o 18 self-hosted.
- **Cifrado en reposo** del proveedor (EBS/Cloud SQL/Neon lo incluyen).
- **TLS obligatorio**:
  - `hostssl` en `pg_hba.conf`.
  - `sslmode=verify-full` y `sslrootcert` en `DATABASE_URL`.
- Usuario de aplicación sin superpoderes; usuario de migraciones separado.
- Sin puerto público; solo red privada/VPC.
- `statement_timeout`, `idle_in_transaction_session_timeout`, `lock_timeout`.
- Connection pooling (PgBouncer/Neon pooler) si hay serverless.
- Backups automáticos + **PITR**, cifrados, offsite e inmutables. Probar restauración mensual.

### 3.2 `DATABASE_URL` de ejemplo

```env
DATABASE_URL="postgresql://mesacerca_app:CLAVE@db.internal:5432/mesacerca?schema=public&sslmode=verify-full&sslrootcert=/etc/ssl/certs/mesacerca-db-ca.pem"
```

### 3.3 Migraciones

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

`npm start` ejecuta `scripts/check-env.mjs` y **falla** si la configuración es insegura.

### 3.4 Cifrado adicional (opcional)
- Cifrado de disco/LUKS si es self-hosted.
- Cifrado a nivel de campo para datos muy sensibles (documentos KYC, teléfono) usando KMS; hoy el proveedor KYC guarda documentos, no MesaCerca.
- Secretos de MFA cifrados con AES-256-GCM y `MFA_ENCRYPTION_KEY`.

### 3.5 Backup y restauración

```bash
npm run db:backup   # pg_dump custom + checksum en backups/
```

- Guardar los `.dump` en almacenamiento cifrado/offsite e inmutable.
- Probar restauración en una base temporal al menos una vez al mes.
- En producción, preferir el backup/PITR del proveedor y complementar con un dump lógico.

### 3.6 Retención y anonimización de PII

PII = nombre, email, teléfono, dirección, coordenadas, historial e identificadores.

Política recomendada:
- **180 días:** anonimizar dirección/coordenadas/instrucciones de pedidos antiguos; se conservan montos e ítems para contabilidad.
- **730 días:** anonimizar usuarios inactivos (nombre, email, teléfono, password) y suspender la cuenta.
- **Documentos KYC:** los guarda el proveedor; MesaCerca solo conserva referencia/estado.
- Ejecutar:

```bash
node scripts/anonymize-pii.mjs          # dry-run
node scripts/anonymize-pii.mjs --apply  # aplicar
```

Programar semanalmente con un cron/worker y registrar en auditoría.

> Ajusta los plazos a obligaciones tributarias/legales. En Chile, documentos tributarios pueden requerir 6 años; por eso se conservan montos y no la dirección.

---

## 4. Variables de producción

```env
NODE_ENV="production"
DATABASE_URL="postgresql://...sslmode=verify-full&sslrootcert=..."
AUTH_SECRET="<openssl rand -base64 48>"
CRON_SECRET="<openssl rand -base64 48>"
NEXT_PUBLIC_APP_URL="https://mesacerca.cl"
NEXT_PUBLIC_DEMO_MODE="false"
PAYMENTS_MODE="sandbox"            # o production cuando haya credenciales
TRUST_PROXY="1"
CORS_ORIGINS="https://mesacerca.cl"
MFA_ENFORCED="true"
MFA_ENCRYPTION_KEY="<openssl rand -base64 32>"
KYC_REQUIRED="true"
KYC_PROVIDER="sumsub"              # o el proveedor elegido
KYC_HOSTED_URL="https://verify.proveedor.com/session?user={userId}&case={caseId}"
KYC_WEBHOOK_SECRET="<openssl rand -base64 48>"
RESEND_API_KEY="re_..."
EMAIL_FROM="MesaCerca <no-reply@mesacerca.cl>"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM="+56..."
```

`npm start` falla si faltan MFA/KYC/HTTPS/secretos fuertes o si `PAYMENTS_MODE=mock`.

---

## 5. MFA, email, teléfono y KYC

### MFA
- TOTP (Google Authenticator/Authy/1Password), secreto cifrado AES-256-GCM.
- Códigos de recuperación de un solo uso (hashes bcrypt).
- Flujo: login → desafío MFA → sesión; setup obligatorio si `MFA_ENFORCED=true`.
- Admin/local deben activarlo antes de operar en producción.

### Email
- Resend (`RESEND_API_KEY`) o adaptar `lib/email.ts` a SMTP/SES.
- Verificación con token de un uso, 24 h, página `/verify-email`.
- Sin proveedor, en desarrollo el enlace se imprime en el log.

### Teléfono
- Twilio (`TWILIO_*`) o adaptar `lib/sms.ts`.
- Código de 6 dígitos, 10 min, rate limit.
- En desarrollo el código se imprime en el log.
- App móvil: el courier puede abrir `/settings/security` desde “Mi cuenta”.

### KYC / liveness
- MesaCerca crea un caso `KycCase` y redirige a un proveedor con liveness (`KYC_HOSTED_URL`).
- El proveedor devuelve el resultado a `/api/kyc/webhook` con HMAC `x-kyc-signature`.
- Admin revisa en `/admin/kyc`.
- Si `KYC_REQUIRED=true`, no se puede verificar un local/repartidor sin caso `APPROVED`.
- **Modo mock** solo para desarrollo: no captura selfie ni documento. Producción exige proveedor real; `npm start` falla si `KYC_PROVIDER=mock`.

---

## 6. Operación

- Monitoreo: Sentry/OpenTelemetry, uptime, alertas de 5xx, latencia y errores de pago.
- Alertas de seguridad: picos de login fallido, bloqueos de PIN, reembolsos, cambios admin, KYC rechazados.
- Logs sin PII; no loggear tokens, cookies, documentos ni coordenadas exactas.
- Runbook de incidentes: contactos, kill switch, rotación de secretos, notificación legal.
- Backups: probar restauración; guardar copia offline/inmutable.
- Pentest externo antes de lanzamiento; bug bounty después.
- Revisar `npm audit`, Dependabot y SBOM en cada release.

---

## 7. Checklist de lanzamiento

- [ ] Dominio con Cloudflare Full Strict + HSTS.
- [ ] Origen solo accesible por Cloudflare.
- [ ] PostgreSQL TLS verify-full + cifrado en reposo + PITR.
- [ ] `npm start` pasa el preflight de seguridad.
- [ ] MFA obligatorio para admin, soporte y locales.
- [ ] Email/teléfono verificables.
- [ ] KYC con proveedor real y webhook firmado.
- [ ] WAF/rate limit/bot management activos.
- [ ] Pagos sandbox probados (pago, webhook, reembolso).
- [ ] Backups restaurados en prueba.
- [ ] Monitoreo/SIEM y alertas.
- [ ] Retención/anonymización programada.
- [ ] Pentest externo cerrado.
