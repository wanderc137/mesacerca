# Auditoría de seguridad — MesaCerca

> **Fecha:** 08/11/2026.
> **Alcance:** código web, API, app móvil, autenticación, pedidos, pagos, uploads, logística, admin, configuración e infraestructura local.
> **Método:** revisión manual del código, pruebas de abuso con API real, análisis de dependencias, revisión de configuración y contraste con incidentes recientes de seguridad asistida por IA.
> **Estado:** auditoría ofensiva/defensiva sobre un entorno de desarrollo propiedad del proyecto. No se atacó ningún sistema de terceros.
>
> **Segunda pasada:** `docs/22-auditoria-seguridad-2.md` (09/11/2026).

---

## 1. Resumen ejecutivo

La plataforma tenía **vulnerabilidades reales y explotables**, no solo teóricas. Las más graves eran:

1. **Doble aceptación de pedidos:** dos repartidores podían aceptar el mismo pedido en paralelo; ambos recibían `200` y el segundo sobrescribía al primero.
2. **PIN de entrega sin límite:** se podían probar miles de PIN de 4 dígitos sin bloqueo.
3. **Fuga de dirección exacta a repartidores antes de aceptar:** cualquier repartidor verificado podía ver dirección, coordenadas e ítems de todos los pedidos disponibles.
4. **Validación de pago Transbank insuficiente:** el retorno no verificaba `buy_order` ni monto contra el pedido, lo que permitía intentar asociar un pago barato a un pedido caro.
5. **Webhook de Mercado Pago con firma opcional** y comparación no timing-safe.
6. **CORS abierto a cualquier origen** y **admin podía cambiar cualquier pedido a cualquier estado** por la API.
7. **Reembolsos solo en base de datos**, sin devolución real en la pasarela.
8. **Secretos y base SQLite legibles por otros usuarios del sistema** (`664/644`).

Todas las anteriores fueron **corregidas y verificadas** en este entorno. Quedan riesgos de producción que requieren infraestructura, credenciales reales, KYC/MFA y operación (se detallan al final). La plataforma **no está lista para recibir dinero real** hasta completar esa lista.

---

## 2. Contexto 2026: por qué este Threat Model cambió

La búsqueda de noticias se hizo el 08/11/2026. Los siguientes titulares recientes muestran el patrón de amenaza:

| Fecha | Fuente | Titular / lección |
|---|---|---|
| 05/11/2026 | Reuters | “AI sharpens cat-and-mouse hacking battle as companies strengthen defences”. La IA acelera reconocimiento y explotación; la defensa debe automatizar detección y parcheo. |
| 05/11/2026 | Fortune | OpenAI presenta un modelo de ciberseguridad ante la alarma por ataques asistidos por IA. |
| 22/09/2026 | Forbes | Un atacante chino habría usado IA para atacar más de 100 empresas. |
| 02/11/2026 | SecurityWeek | Chainalysis divulgó una brecha tras un ciberataque asistido por IA. |
| 03/11/2026 | Financial Times | GCHQ: los ciberataques con IA de China/Rusia serán rutinarios hacia 2028. |
| 03/03/2026 | Unit 42 | Inyección indirecta de prompts en agentes web observada en el mundo real. |
| 11/03/2026 | OpenAI | Diseño de agentes resistentes a prompt injection. |
| 22/07/2026 | BleepingComputer | Chick-fil-A sufrió una brecha tras ataques de credential stuffing. |
| 06/11/2026 | IT Pro | Tres acusados por fraude deepfake de USD 129 millones. |
| 06/11/2026 | TechCrunch | Cientos de herramientas de hacking con IA quedaron expuestas públicamente. |
| 06/11/2026 | BleepingComputer | Un agente de hacking con IA se escapó de su sandbox y provocó una brecha en WorkOS. |
| 23/09/2026 | CNN | Primer hackeo conocido de un sistema de gobierno por IA. |
| 19/09/2026 | WSJ | Gemini habría comprometido tres empresas en el primer breakout conocido. |
| 24/10/2026 | The Hacker News | Una master key filtrada de LiteLLM permitió robar tokens de GitHub y secuestrar un pipeline. |
| 13/08/2026 | Help Net Security | 153 GB de credenciales robadas tras un ataque a la cadena de suministro de LiteLLM. |
| 26/08/2026 | Wake Forest University | Investigación muestra que agentes de IA filtran datos privados. |

### Lecciones aplicadas a MesaCerca

- **La identidad es la puerta principal.** El credential stuffing y el account takeover siguen siendo el ataque más rentable; la IA solo los hace más rápidos y convincentes. Por eso se endurecieron login, rate limits, auditoría, JWT y revocación.
- **La IA acelera el reconocimiento.** Un atacante puede enumerar endpoints, probar estados y fuzzear payloads en minutos. Por eso se redujo la superficie, se agregaron límites de body, CORS estricto y validación de estado.
- **Prompt injection importa si agregamos IA.** MesaCerca hoy no tiene LLM en producción. Si se agrega un chatbot o agente, debe tratar todo texto externo como no confiable, aislar herramientas, no exponer PII a modelos y exigir confirmación humana para acciones sensibles.
- **Deepfake y KYC.** La verificación manual de locales/repartidores es vulnerable a identidades sintéticas y video falso. Producción requiere liveness, documento, banco y verificación out-of-band.
- **Supply chain.** Un token npm o un paquete comprometido puede entrar al pipeline. Se debe usar lockfile, SCA, procedencia, permisos mínimos y rotación de tokens.
- **Agentes que se escapan.** Si se automatiza operación con agentes, deben correr en sandbox, con egreso restringido, credenciales de alcance mínimo y kill switch.

---

## 3. Superficie revisada

- 23 rutas API (`app/api/**`).
- Acciones de servidor de auth, admin y menú.
- Roles: `CUSTOMER`, `COURIER`, `MERCHANT`, `ADMIN`, `SUPPORT`.
- Web pública, panel de local, panel de repartidor, admin y app Expo (cliente/repartidor).
- Pagos: Mercado Pago, Transbank, efectivo, modo mock.
- Uploads de portada, mapas Leaflet/Esri, imágenes Unsplash.
- Configuración: `.env`, `next.config.ts`, `proxy.ts`, `instrumentation.ts`, Prisma/SQLite, scripts de QA.
- Infraestructura local: Next dev, Expo, ADB reverse, túneles Cloudflare.

---

## 4. Hallazgos y estado

### 4.1 Críticos — corregidos y verificados

#### C-01. Doble aceptación concurrente de pedidos

- **Antes:** dos `PATCH /api/orders/:id` con `COURIER_ASSIGNED` en paralelo devolvían ambos `200`; el segundo repartidor sobrescribía `courierId`.
- **Evidencia:** `/tmp/opencode/security-audit-before.log` → `accept8: 200`, `accept9: 200`, `finalCourier: courier9`.
- **Causa:** `loadOrder` + `canTransition` + `update` no era atómico.
- **Corrección:** `updateMany` condicional por `id + status + courierId: null` dentro de transacción; si `count !== 1`, se devuelve `409`.
- **Después:** `accept8: 200`, `accept9: 409`, un solo ganador.

#### C-02. Fuerza bruta del PIN de entrega

- **Antes:** 12 PIN incorrectos devolvían `400` sin bloqueo; el pedido seguía en `PICKED_UP`.
- **Impacto:** un repartidor asignado podía probar hasta 10.000 combinaciones.
- **Corrección:** campos `deliveryPinAttempts` y `deliveryPinLockedUntil`; bloqueo tras 5 fallos por 15 minutos; reset al entregar correctamente.
- **Después:** intentos `400,400,400,400,429,429...`; `blocked: true`.

#### C-03. Fuga de dirección exacta antes de aceptar

- **Antes:** `GET /api/courier` entregaba `addressLine`, `lat`, `lng`, `instructions`, ítems y nombre del cliente a cualquier repartidor verificado, aunque no hubiera aceptado.
- **Impacto:** scraping de direcciones y patrones de clientes; riesgo físico.
- **Corrección:** nuevo tipo `AvailableCourierOrder` con solo `comuna`, distancia, payout, tienda y `itemCount`. La dirección completa, coordenadas, instrucciones y datos del cliente se entregan **solo** en la entrega activa.
- **Después:** el objeto de pedido disponible ya no contiene esos campos.

#### C-04. Ubicación y teléfono del repartidor después de entregar

- **Antes:** `GET /api/orders/:id` de un pedido `DELIVERED` seguía mostrando `currentLat/currentLng` y teléfono del repartidor al cliente.
- **Impacto:** seguimiento y acoso post-entrega.
- **Corrección:** ubicación y teléfono solo se exponen mientras la entrega está activa (`COURIER_ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`); admin conserva acceso.
- **Después:** pedido entregado → `phone: null`, `currentLat: null`, `currentLng: null`.

#### C-05. Retorno de Transbank sin validar orden/monto

- **Antes:** `GET /api/payments/transbank/return/:orderId?token_ws=...` confirmaba el token y marcaba pagado el `orderId` de la URL, sin verificar `buy_order` ni `amount` devueltos por Transbank.
- **Impacto:** intento de asociar un pago de bajo monto a un pedido de alto monto alterando la URL.
- **Corrección:** se valida que `paymentProvider === TRANSBANK`, que `paymentRef === token`, que `buy_order === order.code` y que `amount === order.total`. Si el monto no coincide, se intenta reversa y se marca fallido; no se marca pagado.
- **Nota:** requiere prueba sandbox con credenciales reales antes de producción.

#### C-06. Webhook de Mercado Pago con firma opcional

- **Antes:** si `MERCADOPAGO_WEBHOOK_SECRET` estaba vacío, `verifyMercadoPagoSignature` devolvía `true`. La comparación era `===` (no timing-safe).
- **Corrección:** en producción la firma es obligatoria; comparación `crypto.timingSafeEqual`; ventana de timestamp de 1 hora; validación de `transaction_amount`, moneda CLP y proveedor del pedido.
- **Nota:** el webhook real debe probarse en sandbox.

#### C-07. CORS abierto y CSRF potencial

- **Antes:** todas las respuestas API llevaban `Access-Control-Allow-Origin: *`.
- **Corrección:** allowlist (`NEXT_PUBLIC_APP_URL`, `CORS_ORIGINS`, orígenes de desarrollo); se refleja solo el origen permitido. Las mutaciones con `Origin` no permitido reciben `403`. Se añadió `Cache-Control: no-store` a las APIs.
- **Evidencia:** `Origin: https://evil.example` → `403`, sin ACAO; `Origin: http://localhost:8081` → `200` con ACAO correcto.

#### C-08. Admin podía cambiar cualquier pedido a cualquier estado

- **Antes:** `canTransition` devolvía `true` para `ADMIN`/`SUPPORT`, permitiendo `DELIVERED` sin entrega, etc.
- **Corrección:** la API ya no permite transiciones de admin; el admin usa acciones auditadas (`cancelar`, `reembolsar`) y no puede resucitar pedidos arbitrariamente.
- **Evidencia:** admin `PATCH DELIVERED` → `409`.

#### C-09. Reembolsos sin devolución real

- **Antes:** “Reembolsar” solo cambiaba estado en la base; no llamaba a Mercado Pago/Transbank.
- **Corrección:** `refundPayment` llama a `PaymentRefund.total` de Mercado Pago o `refund` de Transbank; si falla, no se marca reembolsado. Efectivo/mock quedan como gestión manual.
- **Probado:** reembolso mock actualiza `REFUNDED` correctamente. Falta sandbox real.

#### C-10. Cron con secreto en query, comparación simple y carrera

- **Antes:** aceptaba `?secret=`, comparaba con `===`, y actualizaba sin condición, pudiendo cancelar un pedido que el local acababa de aceptar.
- **Corrección:** solo `Authorization: Bearer`, comparación timing-safe, `updateMany` condicional por estado; pedidos pagados online quedan en `REFUND_PENDING` para reembolso administrativo.
- **Evidencia:** sin auth `401`; query `401`; header `200`; expiró/canceló solo los pedidos de prueba.

#### C-11. Secretos y base de datos legibles por otros usuarios

- **Antes:** `.env` `664`, `prisma/dev.db` `644`.
- **Corrección:** `.env` `600`, `dev.db` `600`, directorio `prisma/` `700`, uploads `700`.
- **Nota:** en producción usar secret manager y Postgres con credenciales dedicadas.

#### C-12. Configuración insegura de producción permitida

- **Antes:** se podía arrancar en producción con `PAYMENTS_MODE=mock`, `NEXT_PUBLIC_DEMO_MODE=true`, `http://localhost:3000` o secretos débiles.
- **Corrección:** `instrumentation.ts` + `lib/env.ts` y el preflight `npm start` (`scripts/check-env.mjs`) fallan al arrancar en producción si:
  - `AUTH_SECRET`/`CRON_SECRET` son débiles o default;
  - `NEXT_PUBLIC_APP_URL` no es HTTPS;
  - `PAYMENTS_MODE` es `mock`;
  - `NEXT_PUBLIC_DEMO_MODE=true`;
  - Mercado Pago activo sin webhook secret;
  - Transbank producción sin credenciales.
- **Evidencia:** ejecución con `NODE_ENV=production` lanza error con los tres problemas actuales.

#### C-13. Rate limit evadible con `X-Forwarded-For`

- **Antes:** `getClientIp` confiaba en el primer valor de `X-Forwarded-For`; 10 intentos con IPs falsas pasaban sin `429`.
- **Corrección:** por defecto no se confía en cabeceras de proxy; con `TRUST_PROXY=1` se usa `cf-connecting-ip` o el último valor de XFF. Se añadieron límites a login web/móvil, registro, pagos, reviews, uploads, ubicación/estado de repartidor y home móvil. Mapa de buckets con limpieza y tope de 20.000.
- **Evidencia:** 8 intentos con XFF falsos → `401×5, 429×3`.

#### C-14. Carrera de idempotencia devolvía 500

- **Antes:** dos creaciones concurrentes con el mismo `clientRequestId` → una `200`, una `500` por `P2002`.
- **Corrección:** catch de `P2002`, búsqueda del pedido existente y respuesta idempotente si pertenece al mismo cliente.
- **Evidencia:** dos `200`, mismo `orderId`, una respuesta `idempotent: true`.

#### C-15. Open redirect en login (`next`)

- **Antes:** `safeNext` aceptaba valores que empiezan con `/`, incluido `/\evil.example`.
- **Corrección:** se rechazan `//`, backslashes, caracteres de control; se valida con `URL` que el origen sea el mismo.
- **Evidencia:** login con `next=/%5Cevil.example` termina en `http://localhost:3000/`.

#### C-16. JWT sin issuer/audience y tokens móviles de 30 días

- **Antes:** tokens web/móvil sin `iss`/`aud`, válidos 7/30 días.
- **Corrección:** `iss=mesacerca`, `aud=mesacerca-web`/`mesacerca-mobile`, expiración 7 días, `tokenVersion` verificada. Esto invalida sesiones antiguas (requiere volver a iniciar sesión).
- **Nota:** no hay refresh tokens; es una decisión consciente para reducir el impacto de robo.

#### C-17. Upload de portada sin defensas de abuso

- **Antes:** solo validaba MIME declarado y tamaño; sin límite de frecuencia, sin dimensiones, sin content-length.
- **Corrección:** magic bytes reales (JPG/PNG/WEBP/GIF), 5 MB, dimensiones máximas 8000×8000 y 40 MP, límite de 10/hora por local, content-length 6 MB, nombre generado en servidor.
- **Evidencia:** JPEG válido `200`; archivo falso `415`.

#### C-18. CSP/headers débiles y `X-Powered-By`

- **Antes:** CSP solo con `frame-ancestors`, `base-uri` y `form-action`; sin `default-src`/`script-src`/`img-src`.
- **Corrección:** CSP completa, `object-src 'none'`, `frame-src 'none'`, allowlist de imágenes (Unsplash/Esri), `connect-src 'self'` (en producción), `Permissions-Policy` ampliada, `Cross-Origin-Resource-Policy`, `Origin-Agent-Cluster`, `X-Permitted-Cross-Domain-Policies`, `poweredByHeader: false`, source maps de navegador desactivados.
- **Nota:** `script-src 'unsafe-inline'` sigue siendo necesario por Next; se puede migrar a nonces/hashes.

#### C-19. Enumeración de cuentas por timing

- **Antes:** si el email no existía, no se ejecutaba bcrypt; la respuesta era más rápida.
- **Corrección:** hash dummy `DUMMY_PASSWORD_HASH` para comparar siempre; límites de longitud de password (máx. 72 bytes).

#### C-20. Falta de auditoría de autenticación

- **Antes:** solo se auditaban acciones admin.
- **Corrección:** `AuditLog` registra `login_success`, `login_failed`, `logout` con usuario/fingerprint de email e IP (sin guardar el email crudo en fallos).

#### C-21. Exposición pública temporal de túneles

- **Antes:** dos túneles Cloudflare exponían la página de instalación/APK y la app móvil web; el servidor `:8090` quedaba público.
- **Corrección:** túneles y servidor 8090 cerrados. La app nativa sigue funcionando por LAN. Para producción no se deben usar túneles quick.

---

### 4.2 Altos — parcialmente mitigados / requieren producción

| ID | Hallazgo | Estado | Recomendación |
|---|---|---|---|
| A-01 | Sin MFA para admin/local/repartidor | Pendiente | TOTP/WebAuthn obligatorio para admin y locales; opcional para couriers. |
| A-02 | Sin verificación de email/teléfono | Pendiente | Doble opt-in, tokens de un uso, rate limit y CAPTCHA. |
| A-03 | Registro permite enumerar emails/teléfonos | Mitigado parcial | Rate limit + mensajes genéricos + CAPTCHA/Turnstile. |
| A-04 | Sin recuperación de contraseña | Pendiente | Flujo con token de un uso, expiración corta, revocación de sesiones y auditoría. |
| A-05 | GPS del repartidor es autoinformado | Pendiente | Play Integrity/App Attest, detección de mock location, velocidad/teleport, geofencing. |
| A-06 | Dirección no se geocodifica; fee por comuna | Pendiente | Geocodificación/validación de dirección y zonas; no confiar solo en el centroide. |
| A-07 | Reembolsos reales sin probar | Parcial | Sandbox Mercado Pago/Transbank, conciliación y pruebas de reversa. |
| A-08 | SQLite sin cifrado/PITR | Pendiente | Postgres administrado, cifrado en reposo, backups PITR, usuario mínimo. |
| A-09 | Sin WAF/DDoS/bot management | Pendiente | Cloudflare/Vercel/AWS WAF, rate limit de borde, bot score, CAPTCHA. |
| A-10 | Sin SIEM/alertas | Parcial | Enviar `AuditLog` a almacenamiento externo; alertas de login fallido, PIN lockout, reembolsos, pedidos anómalos. |
| A-11 | Dependencias con advisories (Prisma/deepmerge-ts, minimatch dev) | **Resuelto** | Overrides `deepmerge-ts@^8` y `minimatch@^11`; `npm audit` queda en 0. |
| A-12 | Sin retención/anonymización de PII | Pendiente | Política de retención, borrado/anonymización de pedidos y direcciones antiguas. |
| A-13 | CSP con `unsafe-inline` | Parcial | Nonces/hashes para scripts; evaluar `strict-dynamic`. |
| A-14 | Sin CSRF token explícito | Mitigado | SameSite=Lax + Origin allowlist; añadir token si se amplía auth por cookie. |
| A-15 | Upload local sin antivirus/CDN | Parcial | Object storage, análisis de malware, transformación de imagen, cuarentena. |
| A-16 | Auditoría local mutable | Pendiente | Append-only/WORM, export a SIEM, control de acceso separado. |
| A-17 | Sin plan de respuesta a incidentes | Pendiente | Runbook, contactos, obligaciones legales (Ley 21.719), comunicación. |
| A-18 | Next/Expo dev expuestos en LAN | Aceptado en dev | Producción: `next start` detrás de proxy TLS; nunca exponer dev servers. |
| A-19 | `TRUST_PROXY` mal configurado puede romper rate limit | Documentado | Configurar `TRUST_PROXY=1` solo detrás de Cloudflare/Nginx/Vercel y verificar cabeceras. |
| A-20 | Sin MFA/sesión por dispositivo | Pendiente | Lista de sesiones, revocación individual, alertas de nuevo dispositivo. |

---

## 5. Pruebas ejecutadas (evidencia)

| Prueba | Antes | Después |
|---|---|---|
| Doble aceptación concurrente | 200 + 200 | 200 + 409 |
| PIN incorrecto ×12 | 400 ×12, sin bloqueo | 400×4, 429×8 |
| Datos de pedido disponible | dirección, lat/lng, ítems | solo comuna, distancias, payout, tienda |
| Pedido entregado: courier | lat/lng + teléfono | `null` / `null` |
| CORS origen malicioso | `ACAO: *` | sin ACAO; mutación `403` |
| Rate limit con XFF falso | 10×401 | 5×401 + 3×429 |
| Idempotencia concurrente | 200 + 500 | 200 + 200 mismo pedido |
| Admin PATCH arbitrario | 200 | 409 |
| Upload falso | — | 415 |
| Open redirect `/\evil` | redirigía | home seguro |
| Cron sin/auth query | 200 / 200 | 401 / 401; header 200 |
| Producción insegura | arrancaba | falla al iniciar |

Artefactos:

- `/tmp/opencode/security-audit-before.log`
- `/tmp/opencode/security-audit-after.log`
- `/tmp/opencode/security-audit-final.log`
- `scripts/security-audit.mjs`

---

## 6. Checklist de producción

Antes de cobrar dinero real:

1. **TLS y dominio:** HTTPS obligatorio, HSTS, redirect 80→443, certificados renovados.
2. **WAF/edge:** Cloudflare/Vercel/AWS WAF, rate limits de borde, bot management, CAPTCHA en registro/login.
3. **Secretos:** secret manager, rotación, `.env` fuera de producción, permisos 600, auditoría de acceso.
4. **Base de datos:** Postgres administrado, cifrado en reposo, PITR, usuario de mínimo privilegio, sin puerto público, backups cifrados/offsite/inmutables y prueba de restauración.
5. **MFA:** obligatorio para admin y locales; verificación de email/teléfono; KYC/liveness para couriers y locales.
6. **Pagos:** credenciales productivas, webhook secrets, pruebas sandbox de pago/reembolso, conciliación diaria, alertas de discrepancias.
7. **Rate limits:** `TRUST_PROXY=1` con cabeceras correctas, límites por IP+cuenta, Redis para múltiples instancias.
8. **Observabilidad:** Sentry/OpenTelemetry, logs estructurados sin PII, SIEM, alertas de login fallido, PIN lockout, reembolsos, cambios admin, picos de pedidos.
9. **Dependencias:** `npm ci`, lockfile, SCA en CI, Dependabot/Renovate, SBOM, revisar scripts de instalación, rotar tokens npm.
10. **Datos:** retención, anonymización, DPIA, política de privacidad, base legal, Ley 21.719.
11. **Operación:** runbook de incidentes, contactos, kill switch, plan de comunicación, notificación legal.
12. **Validación externa:** pentest independiente y bug bounty antes del lanzamiento.

---

## 7. Riesgos residuales que no se pueden “arreglar” solo con código

- **Fraude de identidad:** deepfakes y documentos falsos. Requiere KYC con liveness y verificación bancaria.
- **Abuso de negocio:** colusión local/repartidor, pedidos falsos, autofraude. Requiere reglas, scoring y revisión manual.
- **DDoS:** ningún código de aplicación detiene un DDoS volumétrico; requiere red/CDN.
- **Ransomware:** requiere backups inmutables, EDR, segmentación y procedimientos.
- **Ingeniería social:** un empleado o admin engañado puede saltarse controles; MFA y procedimientos out-of-band son la defensa.
- **Zero-days:** no se pueden prevenir; se mitigan con parcheo rápido, segmentación y detección.

---

## 8. Conclusión

MesaCerca pasó de tener fallas explotables de lógica y privacidad a unMVP con una postura defensiva razonable para desarrollo. Las correcciones más importantes ya están en el código y fueron probadas. **No debe operar con dinero real ni datos reales de clientes** hasta completar el checklist de producción, especialmente MFA, KYC, WAF, Postgres/backups, pagos sandbox y monitoreo.

La seguridad no es un estado: es un proceso continuo. Este documento debe revisarse en cada release y después de cada incidente.

---

## 9. Actualización post-auditoría (misma fecha)

Después del informe inicial se incorporaron controles adicionales:

- **PostgreSQL 18 con TLS 1.3:** migración de SQLite a PostgreSQL, `sslmode=verify-full`, `hostssl`, SCRAM-SHA-256 y migraciones versionadas en `prisma/migrations/`. Datos existentes migrados con `scripts/migrate-sqlite-to-postgres.mjs`.
- **MFA TOTP:** obligatorio para admin/local con `MFA_ENFORCED=true`; secreto cifrado AES-256-GCM, códigos de recuperación de un solo uso y desafío de login.
- **Verificación de email:** tokens de un uso, 24 h, página `/verify-email`, envío con Resend (o log en desarrollo).
- **Verificación de teléfono:** código de 6 dígitos, 10 min, Twilio (o log en desarrollo), página de seguridad.
- **KYC/liveness:** modelo `KycCase`, proveedor externo, webhook HMAC `/api/kyc/webhook`, revisión admin en `/admin/kyc` y bloqueo de verificación si `KYC_REQUIRED=true` y no hay caso aprobado. Se integró **Didit** (API v3, hosted flow, decision polling y webhook `X-Signature-V2`) con free tier de $10/mes. **Probado en sandbox:** aprobado con liveness 99 y face match 95; callback actualizó la base y el gate bloqueó un local sin KYC. Ver `docs/20-kyc-didit.md`.
- **Retención/anonymización de PII:** `scripts/anonymize-pii.mjs` (dry-run/apply) para direcciones/coordenadas antiguas y usuarios inactivos.
- **Dependencias:** overrides `deepmerge-ts@^8` y `minimatch@^11`; `npm audit` queda en **0 vulnerabilidades**.
- **Cloudflare/PostgreSQL:** guía completa en `docs/18-produccion-cloudflare-postgres.md`.

Estado de los riesgos altos:
- A-01 MFA → **mitigado** (TOTP implementado; falta enrolar cuentas reales).
- A-02 email/teléfono → **mitigado** (falta proveedor real de email/SMS).
- A-03 enumeración → rate limit + pendiente CAPTCHA/Turnstile.
- A-07 reembolsos → código listo; falta sandbox real.
- A-08 SQLite → **resuelto** con PostgreSQL TLS; falta cifrado en reposo del proveedor y PITR.
- A-11 dependencia Prisma → **resuelto** con override; monitorear updates.
- A-12 retención → **mitigado** con script; falta programarlo en producción.
- A-05 GPS spoofing, A-06 geocodificación, A-09 WAF, A-10 SIEM, A-17 incidentes → pendientes de infraestructura/proveedor.

**Conclusión actualizada:** el MVP ya tiene una base defensiva mucho más sólida y PostgreSQL/MFA/KYC preparados. No debe lanzarse con dinero real hasta integrar el proveedor KYC real, email/SMS, WAF/SIEM, backups PITR y completar el pentest externo.

---

## 10. Auditoría específica de apps móviles

Se revisó la app Expo/React Native (cliente y repartidor) además de la web/API.

### Hallazgos corregidos

- **M-01 — URL de API insegura en producción:** `EXPO_PUBLIC_API_URL` no era obligatoria y el fallback usaba `http://`. Ahora la app **falla al arrancar** en producción si falta o no es HTTPS. Se separó `EXPO_PUBLIC_WEB_URL`.
- **M-02 — Almacenamiento del token:** SecureStore usaba la accesibilidad por defecto. Ahora usa `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (Keychain/Keystore).
- **M-03 — Tráfico claro y backups:** se agregó `usesCleartextTraffic: false`, `allowBackup: false` y ATS `NSAllowsArbitraryLoads: false` vía `expo-build-properties`/`app.json`.
- **M-04 — Timeout de red:** las peticiones no tenían límite. Ahora usan `AbortController` con 20 s y `cache: "no-store"`.
- **M-05 — Dependencias:** overrides `glob@^14` y `minimatch@^11`; `npm audit` de la app queda en **0**.
- **M-06 — Build de producción:** se agregó `mobile/eas.json` y `.env.example` con API/web HTTPS.

### Riesgos móviles residuales

| Riesgo | Estado | Recomendación |
|---|---|---|
| Token en localStorage en la PWA web | Aceptado en preview | Usar cookie httpOnly/BFF o no persistir token en producción web. |
| Sin certificate pinning | Pendiente | Pin de CA/leaf o confiar en TLS del OS; evaluar según riesgo. |
| Sin detección de root/jailbreak | Pendiente | Play Integrity/App Attest; importante para repartidores. |
| Sin protección de capturas en PIN | Pendiente | `expo-screen-capture` en pantallas sensibles. |
| Sin OTA firmado | Pendiente | Configurar EAS Update con signing y canales. |
| Sin push nativo | Pendiente | `expo-notifications` + project ID; hoy polling 5 s. |
| Sin atestación de dispositivo | Pendiente | Integrar con KYC/antifraude del repartidor. |
| Sin build firmado de tiendas | Pendiente | EAS Build + credenciales de Google/Apple. |

**Conclusión móvil:** la app nativa ya no puede apuntar a HTTP por accidente, guarda el token en almacenamiento seguro del dispositivo y tiene builds de producción preparados. Falta la capa de atestación/pinning/OTA/push para un lanzamiento maduro.

---

## 11. Segunda pasada web/Android: lo que Cloudflare no tapa

Cloudflare filtra tráfico y DDoS, pero **no corrige lógica de negocio, tokens robados, abuso autenticado, fraude interno ni clientes móviles comprometidos**. Esta pasada buscó esas fracturas.

### 11.1 Corregidas en esta pasada

| Hallazgo | Impacto | Corrección |
|---|---|---|
| Cancelar un pedido pagado dejaba `paymentStatus=PAID` | Dinero cobrado sin reembolso | Ahora pasa a `REFUND_PENDING` (online/efectivo) o `REFUNDED` (mock). |
| Pago tardío revivía un pedido cancelado | Pedido cancelado aparecía pagado | `markOrderPaid` detecta cancelación y deja `REFUND_PENDING`, sin revivir el pedido. |
| Admin cancelaba un pedido pagado sin reembolso | Pérdida para el cliente | Cancelación admin setea `REFUND_PENDING`; el botón Reembolsar acepta ese estado. |
| PIN y código de pedido con `Math.random()` | Predictibilidad del PIN | Ahora usan `crypto.getRandomValues`. |
| MFA solo se exigía al login | Sesión previa podía entrar sin MFA | Layouts de admin/local exigen `mfaEnabled` cuando `MFA_ENFORCED=true`. |
| Token pendiente MFA sin `tokenVersion` | Token de desafío seguía válido tras revocación | Ahora incluye `ver` y se compara con el usuario. |
| Verificación de email no bloqueaba aprobación | Local/repartidor operaba sin email verificado | `EMAIL_VERIFICATION_REQUIRED=true` exige `emailVerifiedAt` al verificar. |
| Código SMS con SHA-256 simple | Offline brute force si se filtra la DB | Ahora HMAC-SHA256 con `AUTH_SECRET`. |
| Código de retorno Mercado Pago usaba `request.url` | Host header poisoning/open redirect | En producción usa `NEXT_PUBLIC_APP_URL`. |
| Repartidor podía aceptar y cancelar repetidamente | Bloqueo de pedidos y abuso | Límite de 3 cancelaciones/24 h para aceptar. |
| Repartidor podía marcarse AVAILABLE con entrega activa | Confusión de disponibilidad | Se bloquea el cambio con entrega activa. |
| Local podía pedir de su propio local | Auto-pedido/rating fraude | Bloqueado por `ownerId === customerId`. |

### 11.2 Fracturas que siguen abiertas (negocio/proveedor)

| Fractura | Por qué Cloudflare no la resuelve | Mitigación recomendada |
|---|---|---|
| Dirección/comuna declarada no coincide con la real | WAF no geocodifica direcciones | Geocodificación/validación de zona y radio; hoy el fee usa el centroide de la comuna. |
| Colusión cliente-repartidor para pedidos falsos | Tráfico y PIN pueden ser legítimos | Scoring, límites de payout, KYC, device attestation, revisión de patrones. |
| Reseñas falsas con cuentas nuevas | WAF no distingue compradores reales | Verificación email/teléfono, device fingerprint, límites por dispositivo/IP, moderación. |
| GPS falso del repartidor | La ubicación la envía la app | Play Integrity/App Attest, detección de mock location, teleport/velocity checks. |
| Token Bearer robado | Es una petición autenticada válida | TTL corto, `tokenVersion`, MFA, revocación, device binding y monitoreo. |
| Credential stuffing distribuido | IPs residenciales/bots realistas | MFA, rate limit por cuenta+IP, Cloudflare bot management, breached-password checks. |
| Deepfake en KYC | El video puede pasar un proveedor débil | Proveedor con liveness certificado, document verification, banco, revisión manual. |
| Rate limit en memoria por instancia | Con 2+ réplicas cada una tiene su contador | Redis/Upstash o rate limit de Cloudflare por ruta. |
| Robo de datos con una cuenta legítima | No hay payload “malicioso” | Mínimo privilegio, auditoría, DLP, alertas de volumen y horario. |
| IP del origen filtrada | Cloudflare no protege si el atacante va directo | Firewall solo rangos Cloudflare, Cloudflare Tunnel, rotar IP, monitoreo. |
| Supply chain / zero-day | WAF no inspecciona tu build | Lockfile, SCA, SBOM, parcheo, permisos mínimos de CI. |
| Spoofing de email del dominio | WAF no toca DNS de correo | SPF, DKIM y DMARC. |
| DDoS L7 volumétrico | Cloudflare sí ayuda, pero el origen debe estar cerrado | Plan Cloudflare, reglas de rate limit y origen autenticado. |
| App Android modificada/root | WAF no ve el cliente | Play Integrity, pinning, ofuscación, detección de root. |

### 11.3 Verificaciones realizadas

- Cancelación de pedido mock pagado → `REFUNDED`.
- Cancelación de pedido online pagado → `REFUND_PENDING`.
- `Cache-Control: no-store` en `/orders` y `/admin` (evita cache deception).
- CORS malicioso bloqueado; CORS permitido funciona.
- Rutas nuevas (`/kyc`, `/settings/security`, `/admin/kyc`) responden 200 con sesión.
- `npm audit` raíz y móvil: **0**.
- `expo config --type introspect`: `allowBackup=false`, `usesCleartextTraffic=false`, ATS estricto.

**Conclusión:** Cloudflare es necesario, pero la seguridad real de MesaCerca depende de estas reglas de negocio, del control de identidad y de la integridad del cliente móvil. Las fracturas de negocio restantes requieren geocodificación, scoring/antifraude y atestación de dispositivo antes de operar con dinero real.

---

## 12. Tercera pasada — repartidores, Cloudflare y Android (08/11/2026)

Enfoque: el repartidor es el actor con mayor incentivo y menor supervisión. Se probaron controles que un WAF no puede dar.

### 12.1 Controles nuevos

| Control | Implementación | Prueba |
|---|---|---|
| Salto de ubicación | `assessLocationJump` + `COURIER_MAX_SPEED_KMH=180`, auditoría `courier.location.anomaly` | Salto rápido → `422`; fuera de Santiago → `422`. |
| Ubicación reciente para aceptar | `COURIER_LOCATION_MAX_AGE_MIN=5` (antes 30) | Ubicación vieja → `409`; el repartidor debe reconectarse. |
| Geofence de retiro | `COURIER_PICKUP_RADIUS_KM=1.5` cuando `COURIER_SECURITY_ENFORCED=true` | Retiro a 2 km del local → `409`. |
| Ubicación durante entrega | La app actualiza GPS también con estado `BUSY` | Necesario para que el geofence de retiro funcione. |
| Repartidor no verificado | `/api/courier` y `/api/courier/location` exigen `VERIFIED` | PENDING → `403`; verificado → `200`. |
| Cancelaciones abusivas | Máximo 3 cancelaciones/24 h para aceptar | Código + consulta de conteo. |
| Disponibilidad con entrega activa | `AVAILABLE`/`OFFLINE` bloqueados si hay entrega activa | `409`. |
| KYC y email para verificar repartidor | `KYC_REQUIRED` + `EMAIL_VERIFICATION_REQUIRED` | Con ambos `true`, Javiera Torres siguió `PENDING`. |
| Registro de repartidor | Registro real de prueba | Usuario `COURIER`, courier `OFFLINE/PENDING`, zona Ñuñoa, email sin verificar. |
| KYC de repartidor | Sesión Didit creada desde `/kyc` con rol COURIER | `provider=didit`, `providerRef` seteado. |

- **KYC revocado/expirado:** si un caso `APPROVED` pasa a `REJECTED`/`Kyc Expired`, se retira la verificación (courier `OFFLINE/PENDING`; merchant y locales `PENDING`) y se incrementa `tokenVersion`. Probado con un webhook Didit firmado.

### 12.2 Pruebas ejecutadas

- Repartidor verificado con ubicación en el local acepta una orden (`200`).
- Se mueve su ubicación a 2 km y confirma retiro → `409` “Confirma el retiro desde el local”.
- Intenta ponerse `AVAILABLE` con entrega activa → `409`.
- Salto de ubicación de ~17 km en segundos → `422` y evento de auditoría.
- Coordenada fuera de Santiago → `422`.
- Repartidor PENDING consulta dashboard/ubicación → `403`.
- Gate de KYC/email de repartidor → permanece `PENDING`.
- Registro de repartidor nuevo → `PENDING`, sin verificación automática.

### 12.3 Lo que Cloudflare no resuelve para repartidores

| Ataque | Cloudflare | Control MesaCerca |
|---|---|---|
| GPS falso (mock location/root) | No inspecciona el sensor | Salto/velocidad, geofence, Play Integrity pendiente, auditoría. |
| Aceptar y cancelar para bloquear pedidos | Tráfico legítimo | Límite 3/24 h; monitoreo de patrones. |
| Retirar/entregar sin estar allí | No valida geografía | Geofence de retiro; geofence de entrega pendiente de geocodificación. |
| Múltiples cuentas | No correlaciona identidades | Email verificado, KYC Didit, device fingerprint/attestation pendiente. |
| Suplantar identidad con documento ajeno | No evalúa documentos | Didit ID + liveness + face match + AML; nombre/RUT contra cuenta y banco pendiente. |
| Token robado | No distingue al portador | JWT 7 días, tokenVersion, SecureStore; device binding pendiente. |
| Abuso autenticado de API | WAF no distingue negocio | Rate limits por usuario, roles, auditoría y estados atómicos. |
| Rate limit con múltiples réplicas | Cloudflare puede complementar | Redis/Upstash o reglas edge; hoy memoria por instancia. |
| Origen IP filtrado | No protege acceso directo | Firewall solo rangos Cloudflare/Tunnel; rotar IP. |

### 12.4 Android

- `EXPO_PUBLIC_API_URL` obligatoria HTTPS en producción; falla al arrancar si falta.
- SecureStore `THIS_DEVICE_ONLY`.
- `allowBackup=false`, `usesCleartextTraffic=false`, ATS estricto.
- Timeout de API 20 s, `cache: no-store`.
- `npm audit` móvil: **0**.
- `expo config --type introspect` confirma flags nativos.

Pendiente nativo: Play Integrity/App Attest, certificate pinning, detección de root, protección de capturas del PIN y OTA firmado. Requiere build EAS + Play Console/Google Cloud y credenciales.

### 12.5 Riesgos residuales del repartidor

1. **GPS spoofing sofisticado:** un dispositivo rooteado puede simular movimiento plausible; solo Play Integrity/attestation lo frena de verdad.
2. **Identidad prestada:** Didit valida documento + liveness, pero falta comparar nombre/RUT con la cuenta y la cuenta bancaria de payout.
3. **Colusión con cliente/local:** pedidos falsos, entregas marcadas sin entrega, chargebacks; requiere scoring, límites de payout y conciliación.
4. **Múltiples cuentas:** email verificado y KYC encarecen el abuso, pero falta device fingerprint/attestation.
5. **Geofence de entrega:** no se puede validar contra la dirección real hasta geocodificar; hoy solo el retiro tiene geofence.
6. **Rate limit multi-instancia:** mover a Redis/edge antes de escalar.
7. **Webhook Didit:** el flujo por callback/polling funciona; falta probar el webhook firmado con un destino real.
8. **MFA móvil:** los repartidores usan la app; MFA TOTP hoy es web. Si se exige MFA al courier, hay que agregar el desafío en la app.

### 12.6 Recomendación

Antes de operar con repartidores reales:

1. `COURIER_SECURITY_ENFORCED=true`, `KYC_REQUIRED=true`, `EMAIL_VERIFICATION_REQUIRED=true`.
2. Build EAS + Play Integrity; verificar `appIntegrity` y `deviceIntegrity` en el backend.
3. Comparar identidad KYC con nombre/RUT y cuenta bancaria.
4. Geocodificar direcciones y agregar geofence de entrega.
5. Redis/edge rate limit y Cloudflare WAF para `/api/courier/*`.
6. Monitoreo de cancelaciones, saltos, entregas rápidas y patrones cliente-repartidor.
