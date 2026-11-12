# Seguridad en MesaCerca

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, **no abras un issue público**. Escríbenos a:

`seguridad@mesacerca.cl` (buzón de referencia; reemplazar por el correo real antes de producción)

Incluye:

- Descripción del problema y impacto.
- Pasos para reproducirlo.
- Versión/entorno afectado.
- Evidencia (capturas, requests) sin datos personales de terceros.

Responderemos en un plazo objetivo de **48 horas hábiles** y coordinaremos una divulgación responsable. No tomaremos acciones legales contra investigadores que actúen de buena fe, respeten la privacidad y no degraden el servicio.

## Alcance

- Aplicación web y API de MesaCerca.
- App móvil Expo (cliente/repartidor).
- Paneles de local, repartidor y administración.
- Lógica de pedidos, pagos, logística, uploads y autenticación.

Fuera de alcance: ataques de denegación de servicio volumétricos, ingeniería social, pruebas sobre terceros (Mercado Pago, Transbank, Cloudflare) y acceso físico.

## Estado de seguridad

La auditoría interna y las pruebas de abuso están documentadas en [`docs/17-auditoria-seguridad.md`](docs/17-auditoria-seguridad.md) y [`docs/22-auditoria-seguridad-2.md`](docs/22-auditoria-seguridad-2.md).

**No usar con dinero real ni datos personales reales** hasta completar el checklist de producción: MFA, KYC/liveness, WAF, Postgres con backups, pagos sandbox, monitoreo/SIEM y pentest externo.

## Prácticas implementadas

- Sesiones JWT con `issuer`/`audience`, `tokenVersion`, `purpose` y revocación.
- Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- MFA TOTP para admin, soporte y locales, con secreto cifrado AES-256-GCM y códigos de recuperación.
- La app móvil todavía no soporta MFA: el login móvil rechaza cuentas con MFA activo.
- PostgreSQL con TLS `verify-full`, SCRAM-SHA-256 y migraciones versionadas.
- Verificación de email y teléfono con tokens/códigos de un solo uso.
- KYC con proveedor externo, webhook firmado y revisión administrativa.
- Retención/anonymización de PII (`scripts/anonymize-pii.mjs`).
- Rate limiting en login, registro, pagos, reviews, uploads y ubicación.
- CORS con allowlist y bloqueo de mutaciones desde orígenes no confiables.
- Validación de precios, ítems, modificadores y estado en el servidor.
- Bloqueo de PIN tras 5 intentos fallidos.
- Aceptación atómica de pedidos para evitar carreras.
- Minimización de datos de clientes para repartidores antes de aceptar.
- Uploads con validación de magic bytes, tamaño y dimensiones.
- Webhooks de pago con firma y validación de monto/moneda.
- Validación de `buy_order`/monto en el retorno de Transbank.
- Reembolsos con llamada a la pasarela (Mercado Pago/Transbank).
- Cabeceras de seguridad y CSP.
- Auditoría de login/logout/MFA y acciones administrativas.
- Validación de configuración insegura en `npm start` (MFA/KYC/HTTPS/secretos).
- `npm audit` sin vulnerabilidades conocidas (override `deepmerge-ts`).

## Buenas prácticas para contribuir

- No commitear `.env`, bases de datos, tokens ni claves.
- No usar `NEXT_PUBLIC_*` para secretos.
- Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` antes de un PR.
- Revisar `npm audit` y no agregar dependencias sin justificar.
- Reportar cualquier hallazgo por el canal privado.
