# Despliegue en VPS Linux con Cloudflare

> Runbook operativo para publicar MesaCerca con Docker, PostgreSQL, Caddy y
> Cloudflare delante del origen. Complementa `docs/18-produccion-cloudflare-postgres.md`.
> No requiere Cloudflare ni VPS para preparar los archivos, pero sí para ejecutar
> los pasos finales.

---

## 1. Arquitectura

```
Cliente / PWA / App Android
          │ HTTPS
          ▼
Cloudflare (DNS, TLS, WAF, rate limit, bot management, Access)
          │
          ├── Tunnel: cloudflared sale del VPS hacia Cloudflare
          │
          └── Edge: HTTPS Full (strict) → Caddy :443
                                      │
                                      ▼
VPS Linux                        Next.js :3000
                                      │
                                      ▼
                               PostgreSQL :5432
                               (solo red interna)
```

- El puerto `3000` y `5432` **no se publican**.
- Las portadas de locales viven en el volumen `uploads` y se sirven por
  `/uploads/stores/...` mediante una ruta de la app (no como archivo estático).
- **Tunnel:** no hay puertos web abiertos en el VPS.
- **Edge:** Caddy es el único proceso que escucha en `80/443`; el firewall del
  host debe filtrar el tráfico de Docker, no solo UFW.
- PostgreSQL solo es accesible por la red interna de Docker.
- El PostgreSQL incluido es para single-host/staging. Para producción con datos
  sensibles, usa PostgreSQL administrado con TLS (`sslmode=verify-full`) o
  configura TLS en el contenedor.
- Cloudflare es la única entrada pública.

---

## 2. Archivos del paquete

| Archivo | Uso |
|---|---|
| `Dockerfile` | Build standalone de Next.js, imagen de ejecución y de migraciones. |
| `deploy/docker-compose.yml` | App, PostgreSQL, migraciones y Caddy. |
| `deploy/Caddyfile` | TLS de origen, proxy, headers y bloqueo de rutas internas. |
| `deploy/.env.production.example` | Variables de producción. |
| `deploy/entrypoint.sh` | Construye `DATABASE_URL` interna y ejecuta el preflight. |
| `deploy/migrate.sh` | `prisma migrate deploy` antes de arrancar la app. |
| `deploy/provision-vps.sh` | Usuario, SSH, UFW, fail2ban, Docker y actualizaciones. |
| `deploy/refresh-cloudflare-firewall.sh` | Refresca rangos de Cloudflare en UFW. |
| `deploy/backup-db.sh` / `restore-db.sh` | Backup cifrado y restauración probada. |
| `deploy/certs/` | Certificado de origen de Cloudflare. |

---

## 3. Antes de empezar

Necesitas:

- Dominio propio con nameservers en Cloudflare.
- VPS Ubuntu 24.04/26.04 LTS con IP pública.
- Acceso SSH por clave al VPS (no solo contraseña).
- Cuenta Didit con workflow y API key.
- Cuenta Resend con dominio verificado (SPF/DKIM/DMARC).
- Credenciales sandbox de Mercado Pago/Transbank si vas a probar pagos.
- `openssl` para generar secretos.

No lances pagos reales hasta probar sandbox, webhook, reembolso y conciliación.

---

## 4. Cloudflare

### 4.0 Elige el modo de entrada

| Modo | Cómo entra Cloudflare | Puertos del VPS | Certificado de origen |
|---|---|---|---|
| **Tunnel (recomendado)** | `cloudflared` sale hacia Cloudflare | Solo SSH | No hace falta |
| **Edge con Caddy** | Cloudflare → IP pública → Caddy | 80/443 solo a Cloudflare | Cloudflare Origin CA |

**Tunnel** evita abrir puertos, no expone la IP del VPS y no depende de UFW
para filtrar Docker. **Edge** es útil si no puedes instalar un conector, pero
debes tener en cuenta que Docker publica puertos saltándose UFW; las reglas de
Cloudflare en UFW no bastan por sí solas. Si eliges Edge, aplica además las
reglas de `DOCKER-USER` o usa un firewall de host que filtre el tráfico de Docker.

En este runbook, `--profile tunnel` usa Tunnel y `--profile edge` usa Caddy.

### 4.1 DNS

1. Agrega el dominio a Cloudflare.
2. **Modo Edge:** crea registros `A` para `mesacerca.cl` y `www` apuntando a la IP
   del VPS y activa el **proxy naranja**.
3. **Modo Tunnel:** no crees `A` manualmente; al configurar el Public Hostname
   Cloudflare crea el `CNAME` proxied hacia el túnel.
4. No crees subdominios huérfanos ni registros `AAAA` sin IPv6 real.

### 4.2 TLS

1. SSL/TLS → Overview → **Full (strict)**.
2. Edge Certificates → **Always Use HTTPS**.
3. Minimum TLS 1.2 (ideal 1.3).
4. HSTS: `max-age=31536000; includeSubDomains`; `preload` solo cuando estés seguro.

**Solo modo Edge con Caddy:** crea un certificado de origen.

5. SSL/TLS → Origin Server → **Create Certificate** para `mesacerca.cl` y `*.mesacerca.cl`.
6. Guarda el certificado y la clave en el VPS:

```bash
mkdir -p /opt/mesacerca/deploy/certs
chmod 700 /opt/mesacerca/deploy/certs
# copia origin.pem y origin.key
chmod 644 /opt/mesacerca/deploy/certs/origin.pem
chmod 600 /opt/mesacerca/deploy/certs/origin.key
```

Full (strict) rechaza certificados autofirmados. No uses el modo “Flexible”.

**Modo Tunnel:** no necesitas certificado de origen. Cloudflare crea el DNS y
el conector se autentica con el token del túnel.

### 4.3 WAF y rate limiting

Activa:

- Managed Rules (OWASP Core Ruleset). Empieza en observación y pasa a bloqueo.
- Bot Fight Mode o Super Bot Fight Mode.
- Turnstile en registro/login solo si aparece abuso.
- Logpush a R2/S3/SIEM para conservar logs.

Reglas mínimas de rate limit por IP:

| Expresión | Límite | Acción |
|---|---|---|
| `http.request.uri.path eq "/api/mobile/auth/login"` | 5/min | Block 10 min |
| `http.request.uri.path eq "/login"` | 10/min | Managed Challenge |
| `starts_with(http.request.uri.path, "/registro/")` | 10/min | Managed Challenge |
| `starts_with(http.request.uri.path, "/api/orders")` | 30/min | Block 5 min |
| `starts_with(http.request.uri.path, "/api/courier/location")` | 120/min | Block 5 min |
| `starts_with(http.request.uri.path, "/api/courier/status")` | 30/min | Block 5 min |
| `starts_with(http.request.uri.path, "/api/kyc/")` | 30/min | Block 5 min |
| `starts_with(http.request.uri.path, "/api/merchant/cover")` | 10/hour | Block 1 hour |

Cloudflare complementa los límites de la app; no los reemplaza. Los límites de
la app son en memoria por instancia. Si escalas a varias réplicas, mueve el
rate limit a Redis/Upstash o crea reglas de borde equivalentes.

### 4.4 Cloudflare Access para admin

1. Zero Trust → Access → Applications → Add an application → Self-hosted.
2. Dominio: `mesacerca.cl`, path `admin*`.
3. Política: permitir solo emails del equipo admin/soporte.
4. Login por email OTP o proveedor corporativo.
5. Sesión corta (8 h) y MFA del proveedor.
6. Mantén el MFA TOTP de la app como segunda capa.

No protejas solo el enlace: Access debe cubrir `/admin*` completo, incluidas
server actions.

### 4.5 Caché

Cache Rules:

- **Bypass** para `/api/*`, `/admin/*`, `/merchant/*`, `/courier/*`,
  `/order/*`, `/checkout`, `/orders`, `/login`, `/register`, `/registro/*`,
  `/kyc/*`, `/mfa/*`, `/settings/*`, `/verify-email`.
- **Cache** `/_next/static/*`, `/uploads/*` (nombres inmutables), imágenes
  públicas y fuentes.
- No cachear respuestas con `Set-Cookie` ni autenticadas.

---

## 5. Provisión del VPS

Desde tu equipo, con la clave pública ya instalada:

```bash
scp -P 22 deploy/provision-vps.sh root@IP:/root/
# Tunnel: no abre 80/443
ssh root@IP 'EDGE_MODE=tunnel bash /root/provision-vps.sh'
# Caddy con IP pública: abre 80/443 solo a Cloudflare
ssh root@IP 'EDGE_MODE=public bash /root/provision-vps.sh'
```

El script:

- crea el usuario `deploy` y copia las claves de root;
- desactiva login por contraseña y root con contraseña;
- instala Docker, UFW, fail2ban y actualizaciones automáticas;
- permite SSH;
- en modo `public`, añade reglas UFW para `80/443` desde rangos de Cloudflare;
- prepara `/opt/mesacerca` y `/opt/mesacerca/backups`.

En modo `public`, recuerda que Docker puede saltarse UFW al publicar puertos.
Verifica el origen con un escaneo externo. Si no puedes garantizar el filtrado
de Docker, usa Tunnel. Los rangos de Cloudflare cambian: ejecuta
`deploy/refresh-cloudflare-firewall.sh` periódicamente o prográmalo con cron.

El script resetea UFW y asume un VPS dedicado a MesaCerca. Revisa siempre la salida
de `sshd -t` y `ufw status` antes de cerrar la sesión. Si usas un puerto SSH no
estándar, pásalo con `SSH_PORT=2222`.

---

## 6. Desplegar MesaCerca

### 6.1 Copiar el proyecto

```bash
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude backups --exclude deploy/.env --exclude deploy/certs \
  ./ deploy@IP:/opt/mesacerca/
```

### 6.2 Configurar variables

```bash
cd /opt/mesacerca/deploy
cp .env.production.example .env
chmod 600 .env
```

Genera secretos reales:

```bash
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 48   # CRON_SECRET
openssl rand -base64 48   # MFA_ENCRYPTION_KEY
openssl rand -base64 48   # DIDIT_WEBHOOK_SECRET
openssl rand -hex 24      # POSTGRES_PASSWORD
```

Completa además:

- `DOMAIN` y `NEXT_PUBLIC_APP_URL`.
- `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_CALLBACK_URL`.
  En Didit configura callback `https://mesacerca.cl/kyc/return`, webhook
  `https://mesacerca.cl/api/kyc/webhook` y el mismo `DIDIT_WEBHOOK_SECRET`.
- `RESEND_API_KEY`, `EMAIL_FROM`.
- Credenciales sandbox de pagos.
- `TLS_CERT`/`TLS_KEY` si usas Caddy con otras rutas.
- `CLOUDFLARE_TUNNEL_TOKEN` si usas Tunnel.

`POSTGRES_PASSWORD` debe ser alfanumérico (o URL-encoded) para no romper la URL
interna. El entrypoint rechaza caracteres problemáticos.

`NEXT_PUBLIC_APP_URL` se incrusta en el build. Si cambias el dominio, vuelve a
ejecutar `docker compose build`; reiniciar el contenedor no basta.

Si usas PostgreSQL administrado, monta su CA en el contenedor de la app (por
ejemplo en `deploy/certs/db-ca.pem`) y usa
`sslmode=verify-full&sslrootcert=/app/certs/db-ca.pem` en `DATABASE_URL`.

### 6.3 Cloudflare Tunnel (recomendado)

1. Cloudflare dashboard → **Networking → Tunnels** → **Create a tunnel** → Cloudflared.
2. Copia el token del conector.
3. En `deploy/.env`: `CLOUDFLARE_TUNNEL_TOKEN=...`.
4. En el túnel, agrega dos rutas publicadas:
   - `mesacerca.cl` → `http://app:3000`
   - `www.mesacerca.cl` → `http://app:3000`
5. Cloudflare crea los registros DNS proxied automáticamente.

```bash
docker compose build
docker compose --profile tunnel up -d
docker compose ps
docker compose logs -f cloudflared
docker compose logs migrate
```

No abras `80/443` en el VPS. `cloudflared` sale hacia Cloudflare y no necesita
certificado de origen. El servicio `migrate` aplica `prisma migrate deploy` y
termina; la app solo arranca si la migración fue exitosa y PostgreSQL está sano.

### 6.4 Caddy con IP pública (alternativa)

Solo si no usas Tunnel. Requiere el certificado de origen de la sección 4.2 y
`EDGE_MODE=public` en la provisión.

```bash
docker compose build
docker compose --profile edge up -d
docker compose ps
docker compose logs -f caddy
docker compose logs migrate
```

Verifica:

```bash
curl -fsS https://mesacerca.cl/api/health
docker compose logs -f app
```

La primera respuesta debe ser `{"ok":true,...}`.

### 6.5 Primer admin

### 6.4 Primer admin

No ejecutes el seed demo en producción. Crea el admin de forma controlada:

- registra la cuenta con el flujo normal, o
- inserta el usuario con un script puntual y cambia la contraseña de inmediato;
- activa MFA TOTP antes de operar;
- no dejes cuentas demo (`admin@mesacerca.cl`, `mesacerca123`) activas.

El seed está bloqueado con `NODE_ENV=production` salvo `ALLOW_DEMO_SEED=true`
en una base de staging desechable.

---

## 7. Backups

```bash
cd /opt/mesacerca/deploy
BACKUP_PASSPHRASE='...' ./backup-db.sh
```

- Guarda los backups fuera del VPS (R2/S3/otro host).
- Cifra siempre; la clave no debe vivir en el mismo VPS.
- El script respalda PostgreSQL, no el volumen `uploads`. Incluye las portadas
  en el backup (o muévelas a R2/S3) si son parte de tu operación.
- Para restaurar, detén la app primero (`docker compose stop app`) y luego:
- Prueba la restauración en una base desechable:

```bash
CONFIRM_RESTORE=YES ./restore-db.sh ../backups/mesacerca-....dump
```

Programa el backup con cron o systemd timer y alerta si falla. Un backup que
nunca se restauró no es un backup.

---

## 8. Verificación de seguridad

```bash
# TLS y headers
curl -I https://mesacerca.cl
curl -I https://mesacerca.cl/api/health

# Modo Tunnel: no debe haber 80/443 escuchando en el VPS
ss -ltnp | grep -E ':(80|443)\b' || echo "sin puertos web públicos (correcto)"

# Modo Edge: el origen no debe responder directo fuera de Cloudflare
curl -m 5 -I http://IP_DEL_VPS || echo "origen cerrado (correcto)"

# Rate limit de login
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://mesacerca.cl/api/mobile/auth/login \
    -H 'content-type: application/json' \
    -d '{"email":"nadie@example.com","password":"incorrecta"}';
done

# Comprobar que /admin exige Access
curl -I https://mesacerca.cl/admin
```

Comprueba también:

- `ss -ltnp` solo muestra `22` (Tunnel) o `22/80/443` (Edge).
- `docker compose ps` no publica `3000` ni `5432`.
- En Edge, `ufw status verbose` solo permite Cloudflare en `80/443`; recuerda
  que Docker puede saltarse UFW al publicar puertos. Verifica con un escaneo
  externo y, si hace falta, añade reglas en `DOCKER-USER`.
- En Tunnel, el origen no tiene puertos web abiertos.
- `docker compose exec app sh -c 'test -n "$AUTH_SECRET" && test -n "$CRON_SECRET" && test -n "$DIDIT_API_KEY" && echo "secretos presentes"'` (sin imprimir valores).
- Logs sin tokens, cookies, documentos ni coordenadas exactas.
- Alertas de 5xx, login fallido, PIN bloqueado, cancelaciones y saltos de GPS.

---

## 9. Actualizaciones y rollback

```bash
cd /opt/mesacerca
git pull        # o rsync de la nueva versión
cd deploy
docker compose build
docker compose up -d
```

- Las migraciones son hacia adelante; prueba primero en staging.
- Guarda una imagen anterior (`docker image tag`) para rollback rápido.
- Si una migración es incompatible, restaura el backup y vuelve a la imagen
  anterior; no improvises `prisma db push` en producción.
- Rota secretos si sospechas compromiso y revoca sesiones (`tokenVersion`).

---

## 10. Checklist de lanzamiento

- [ ] Dominio con Cloudflare Full (strict) y HSTS.
- [ ] Origen solo accesible por Cloudflare.
- [ ] `TRUST_PROXY=1` y rate limit usando IP real.
- [ ] `MFA_ENFORCED=true`, `KYC_REQUIRED=true`, `EMAIL_VERIFICATION_REQUIRED=true`, `COURIER_SECURITY_ENFORCED=true`.
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` y sin cuentas demo activas.
- [ ] Didit live con webhook firmado y callback HTTPS.
- [ ] Resend con SPF/DKIM/DMARC.
- [ ] `PAYMENTS_MODE=sandbox` probado antes de producción.
- [ ] PostgreSQL con backups cifrados y restauración probada.
- [ ] WAF, rate limits, bot management y Access en `/admin`.
- [ ] Monitoreo, alertas y runbook de incidentes.
- [ ] Pentest externo cerrado antes de dinero real.
