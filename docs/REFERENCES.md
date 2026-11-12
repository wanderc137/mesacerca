# MesaCerca — Referencias

Recursos oficiales y comunitarios usados para construir, operar y auditar MesaCerca. Los enlaces se verificaron conceptualmente al cierre del MVP; si una URL cambia, busca el título del recurso en el sitio oficial.

> **Cómo usar esta lista.** Para una decisión de producción, prioriza documentación oficial y versiones estables. Las respuestas de foros son orientativas; valida siempre contra el código y la documentación del proyecto.

---

## Índice

1. [Framework y UI](#framework)
2. [Lenguaje y estilos](#lenguaje)
3. [Base de datos](#base-datos)
4. [Autenticación y validación](#auth)
5. [App móvil](#movil)
6. [Mapas](#mapas)
7. [Pagos](#pagos)
8. [KYC e identidad](#kyc)
9. [Comunicaciones](#comunicaciones)
10. [Infraestructura y despliegue](#infra)
11. [Seguridad](#seguridad)
12. [Pruebas y calidad](#testing)
13. [Normativa chilena](#chile)
14. [Comunidad](#comunidad)

---

<a id="framework"></a>

## 1. Framework y UI

| Recurso | Enlace | Para qué |
|---|---|---|
| Next.js — Documentación | https://nextjs.org/docs | App Router, Server Components, Server Actions, route handlers, caching, deployment. |
| Next.js — Learn | https://nextjs.org/learn | Curso oficial y fundamentos. |
| Next.js — Blog | https://nextjs.org/blog | Cambios de versión y notas de release. |
| Next.js — GitHub | https://github.com/vercel/next.js | Issues, discusiones y código. |
| React — Documentación | https://react.dev/ | Hooks, componentes, estado, Server Components. |
| React — GitHub | https://github.com/facebook/react | Issues y RFCs. |
| Vercel — Docs | https://vercel.com/docs | Despliegue, dominios, cron y límites. |
| Vercel — CLI | https://vercel.com/docs/cli | Comandos de despliegue. |

---

<a id="lenguaje"></a>

## 2. Lenguaje y estilos

| Recurso | Enlace | Para qué |
|---|---|---|
| TypeScript — Handbook | https://www.typescriptlang.org/docs/ | Tipos, strict mode, utilidades. |
| TypeScript — GitHub | https://github.com/microsoft/TypeScript | Issues y releases. |
| Tailwind CSS — Docs | https://tailwindcss.com/docs | Utilidades, configuración, tema. |
| Tailwind CSS — GitHub | https://github.com/tailwindlabs/tailwindcss | Issues y plugins. |
| MDN Web Docs | https://developer.mozilla.org/ | HTML, CSS, Fetch, Web APIs, PWA. |
| web.dev — PWA | https://web.dev/explore/progressive-web-apps | Manifest, service worker, instalación. |
| Can I use | https://caniuse.com/ | Compatibilidad de APIs web. |

---

<a id="base-datos"></a>

## 3. Base de datos

| Recurso | Enlace | Para qué |
|---|---|---|
| PostgreSQL — Docs | https://www.postgresql.org/docs/ | SQL, índices, transacciones, TLS, roles. |
| PostgreSQL — Wiki | https://wiki.postgresql.org/wiki/Main_Page | Recetas y buenas prácticas. |
| PostgreSQL — GitHub | https://github.com/postgres/postgres | Código y releases. |
| Prisma — Docs | https://www.prisma.io/docs | Schema, migrations, client, transacciones. |
| Prisma — GitHub | https://github.com/prisma/prisma | Issues y ejemplos. |
| Prisma — Studio | https://www.prisma.io/studio | Exploración de datos en desarrollo. |
| Prisma — Data Guide | https://www.prisma.io/dataguide | Modelado y bases de datos. |
| PostgreSQL TLS | https://www.postgresql.org/docs/current/ssl-tcp.html | `sslmode`, certificados y verificación. |

---

<a id="auth"></a>

## 4. Autenticación y validación

| Recurso | Enlace | Para qué |
|---|---|---|
| `jose` — GitHub | https://github.com/panva/jose | JWT, JWS, JWE, firmas. |
| `jose` — Docs | https://github.com/panva/jose/blob/main/docs/README.md | API y ejemplos. |
| `bcryptjs` — GitHub | https://github.com/dcodeIO/bcrypt.js | Hash de contraseñas. |
| OWASP — Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html | Costo, algoritmos y migración. |
| `otplib` — GitHub | https://github.com/yeojz/otplib | TOTP/HOTP. |
| RFC 6238 — TOTP | https://datatracker.ietf.org/doc/html/rfc6238 | Especificación TOTP. |
| RFC 4226 — HOTP | https://datatracker.ietf.org/doc/html/rfc4226 | Especificación HOTP. |
| `qrcode` — GitHub | https://github.com/soldair/node-qrcode | QR para MFA. |
| Zod — Docs | https://zod.dev/ | Esquemas y validación. |
| Zod — GitHub | https://github.com/colinhacks/zod | Issues y releases. |
| WebAuthn — Guide | https://webauthn.guide/ | Futuro: passkeys. |

---

<a id="movil"></a>

## 5. App móvil

| Recurso | Enlace | Para qué |
|---|---|---|
| Expo — Docs | https://docs.expo.dev/ | SDK, Router, SecureStore, Location, EAS. |
| Expo — GitHub | https://github.com/expo/expo | Issues y releases. |
| Expo Router | https://docs.expo.dev/router/introduction/ | Navegación por archivos. |
| Expo SecureStore | https://docs.expo.dev/versions/latest/sdk/securestore/ | Almacenamiento seguro. |
| Expo Location | https://docs.expo.dev/versions/latest/sdk/location/ | Ubicación en foreground/background. |
| Expo EAS Build | https://docs.expo.dev/build/introduction/ | Builds en la nube. |
| React Native — Docs | https://reactnative.dev/docs/getting-started | Componentes, APIs, rendimiento. |
| React Native — GitHub | https://github.com/facebook/react-native | Issues y releases. |
| AsyncStorage | https://react-native-async-storage.github.io/async-storage/ | Persistencia simple. |
| Android — Network Security Config | https://developer.android.com/privacy-and-security/security-config | Cleartext, pinning, confianza. |
| Apple — ATS | https://developer.apple.com/documentation/security/preventing_insecure_network_connections | App Transport Security. |

---

<a id="mapas"></a>

## 6. Mapas

| Recurso | Enlace | Para qué |
|---|---|---|
| Leaflet — Docs | https://leafletjs.com/reference.html | API de mapas, marcadores, eventos. |
| Leaflet — GitHub | https://github.com/Leaflet/Leaflet | Issues y plugins. |
| Esri — World Dark Gray Base | https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer | Tiles usados por la app. |
| Esri — Terms of Use | https://www.esri.com/en-us/legal/terms/full-master-agreement | Atribución y uso. |
| OpenStreetMap — Attribution | https://www.openstreetmap.org/copyright | Buenas prácticas de atribución. |

> MesaCerca usa tiles de Esri con atribución visible. No se debe eliminar la atribución ni asumir que el servicio es ilimitado.

---

<a id="pagos"></a>

## 7. Pagos

| Recurso | Enlace | Para qué |
|---|---|---|
| Mercado Pago — Developers | https://www.mercadopago.cl/developers/es/docs | Checkout Pro, pagos, webhooks, reembolsos. |
| Mercado Pago — Checkout Pro | https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing | Creación de preferencia y retorno. |
| Mercado Pago — Webhooks | https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks | Firma y validación. |
| Mercado Pago — GitHub | https://github.com/mercadopago | SDKs y ejemplos. |
| Transbank — Developers | https://www.transbankdevelopers.cl/ | Webpay Plus, integración y producción. |
| Transbank — Webpay Plus | https://www.transbankdevelopers.cl/producto/webpay | Flujo de transacción. |
| Transbank — GitHub | https://github.com/TransbankDevelopers | SDKs y ejemplos. |
| PCI SSC | https://www.pcisecuritystandards.org/ | Alcance PCI y buenas prácticas. |
| OWASP — Payment Card Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Payment_Card_Industry_Data_Security_Standard_Cheat_Sheet.html | Manejo seguro de pagos. |

---

<a id="kyc"></a>

## 8. KYC e identidad

| Recurso | Enlace | Para qué |
|---|---|---|
| Didit — Docs | https://docs.didit.me/ | Sessions, workflows, decisiones, webhooks. |
| Didit — Dashboard | https://business.didit.me/ | Configuración y credenciales. |
| Didit — GitHub | https://github.com/didit-protocol | Ejemplos e integraciones. |
| NIST — Digital Identity Guidelines | https://pages.nist.gov/800-63-3/ | Identidad digital y niveles de assurance. |
| FATF — Recommendations | https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html | AML/CFT. |
| UIF Chile | https://www.uaf.cl/ | Obligaciones locales de prevención. |

---

<a id="comunicaciones"></a>

## 9. Comunicaciones

| Recurso | Enlace | Para qué |
|---|---|---|
| Resend — Docs | https://resend.com/docs | Email transaccional, dominios, SPF/DKIM. |
| Resend — GitHub | https://github.com/resend | SDKs y ejemplos. |
| Twilio — Docs | https://www.twilio.com/docs | SMS, verificación, entregabilidad. |
| Twilio — Verify | https://www.twilio.com/docs/verify | Alternativa para códigos. |
| Gmail — DMARC | https://support.google.com/a/answer/2466580 | Autenticación de correo. |
| RFC 7208 — SPF | https://datatracker.ietf.org/doc/html/rfc7208 | Especificación SPF. |
| RFC 6376 — DKIM | https://datatracker.ietf.org/doc/html/rfc6376 | Especificación DKIM. |
| RFC 7489 — DMARC | https://datatracker.ietf.org/doc/html/rfc7489 | Especificación DMARC. |

---

<a id="infra"></a>

## 10. Infraestructura y despliegue

| Recurso | Enlace | Para qué |
|---|---|---|
| Docker — Docs | https://docs.docker.com/ | Imágenes, compose, volúmenes, redes. |
| Docker — Multi-stage builds | https://docs.docker.com/build/building/multi-stage/ | Imagen de producción. |
| Docker — Compose | https://docs.docker.com/compose/ | Servicios, healthchecks, secretos. |
| Caddy — Docs | https://caddyserver.com/docs/ | Reverse proxy, TLS, headers. |
| Caddy — GitHub | https://github.com/caddyserver/caddy | Issues y módulos. |
| Cloudflare — Developers | https://developers.cloudflare.com/ | DNS, SSL, WAF, Access, Tunnel. |
| Cloudflare Tunnel | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/ | Conexión saliente sin abrir puertos. |
| Cloudflare WAF | https://developers.cloudflare.com/waf/ | Reglas gestionadas y personalizadas. |
| Cloudflare Access | https://developers.cloudflare.com/cloudflare-one/applications/ | Protección de `/admin`. |
| Cloudflare SSL/TLS | https://developers.cloudflare.com/ssl/ | Full (strict), Origin CA, HSTS. |
| Let's Encrypt | https://letsencrypt.org/docs/ | Certificados TLS. |
| Node.js — Docs | https://nodejs.org/docs/ | Versión, APIs, releases. |
| npm — Docs | https://docs.npmjs.com/ | Scripts, lockfile, auditoría. |
| OpenSSL | https://www.openssl.org/docs/ | Generación de secretos y certificados. |

---

<a id="seguridad"></a>

## 11. Seguridad

| Recurso | Enlace | Para qué |
|---|---|---|
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ | Riesgos web principales. |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Verificación de seguridad. |
| OWASP Cheat Sheets | https://cheatsheetseries.owasp.org/ | Recetas por tema. |
| OWASP — Authentication | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | Login, sesiones, MFA. |
| OWASP — Authorization | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | RBAC y pertenencia. |
| OWASP — Input Validation | https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html | Validación. |
| OWASP — File Upload | https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html | Uploads seguros. |
| OWASP — CSP | https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html | CSP. |
| OWASP — CSRF | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | CSRF. |
| OWASP — XSS | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html | XSS. |
| OWASP — Secrets Management | https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html | Secretos. |
| CWE Top 25 | https://cwe.mitre.org/top25/ | Debilidades comunes. |
| NIST CSF | https://www.nist.gov/cyberframework | Marco de ciberseguridad. |
| Have I Been Pwned | https://haveibeenpwned.com/ | Verificación de filtraciones (sin enviar PII en claro). |

---

<a id="testing"></a>

## 12. Pruebas y calidad

| Recurso | Enlace | Para qué |
|---|---|---|
| Playwright — Docs | https://playwright.dev/docs/intro | E2E, smoke, dispositivos. |
| Playwright — GitHub | https://github.com/microsoft/playwright | Issues y releases. |
| Testing Library | https://testing-library.com/docs/ | Pruebas de componentes. |
| Vitest | https://vitest.dev/ | Tests unitarios (futuro). |
| ESLint | https://eslint.org/docs/latest/ | Reglas y configuración. |
| Prettier | https://prettier.io/docs/ | Formato (si se adopta). |
| Lighthouse | https://developer.chrome.com/docs/lighthouse/overview/ | Rendimiento, PWA, accesibilidad. |
| WebPageTest | https://www.webpagetest.org/ | Rendimiento web. |
| k6 | https://k6.io/docs/ | Pruebas de carga (futuro). |

---

<a id="chile"></a>

## 13. Normativa chilena

> Esta sección es informativa. No constituye asesoría legal. Valida cada obligación con abogados y contadores antes de operar.

| Recurso | Enlace | Para qué |
|---|---|---|
| Ley 21.431 — Plataformas digitales | https://www.bcn.cl/leychile/navegar?idNorma=1181228 | Relación con repartidores y plataformas. |
| Ley 21.719 — Protección de datos | https://www.bcn.cl/leychile/navegar?idNorma=1209272 | Datos personales, derechos y obligaciones. |
| Ley 19.496 — Consumidor | https://www.bcn.cl/leychile/navegar?idNorma=61438 | Derechos del consumidor, información y publicidad. |
| SII — Documentos electrónicos | https://www.sii.cl/ | Boleta/factura electrónica. |
| SII — Regímenes tributarios | https://www.sii.cl/ | IVA y régimen de empresa. |
| FNE — Competencia | https://www.fne.gob.cl/ | Libre competencia. |
| ChileAtiende — Empresas | https://www.chileatiende.gob.cl/ | Trámites y constitución. |
| Biblioteca del Congreso | https://www.bcn.cl/leychile/ | Texto actualizado de leyes. |
| Agencia de Protección de Datos | https://www.agenciapd.cl/ | Autoridad de protección de datos (cuando corresponda). |

---

<a id="comunidad"></a>

## 14. Comunidad

| Recurso | Enlace | Para qué |
|---|---|---|
| Stack Overflow | https://stackoverflow.com/ | Preguntas técnicas; busca antes de publicar. |
| GitHub | https://github.com/ | Código, issues, releases. |
| Next.js Discord | https://nextjs.org/discord | Comunidad de Next.js. |
| React Community | https://react.dev/community | Foros y recursos. |
| Prisma Discord | https://www.prisma.io/discord | Comunidad de Prisma. |
| Expo Discord | https://chat.expo.dev/ | Comunidad de Expo. |
| Leaflet — Stack Overflow | https://stackoverflow.com/questions/tagged/leaflet | Mapas. |
| Mercado Pago — Comunidad | https://www.mercadopago.cl/developers/es/support | Soporte y foros. |
| Transbank — Soporte | https://www.transbankdevelopers.cl/contacto | Soporte de integración. |
| Cloudflare Community | https://community.cloudflare.com/ | DNS, WAF, Tunnel. |
| Docker Community | https://forums.docker.com/ | Contenedores. |
| OWASP Community | https://owasp.org/community/ | Seguridad. |
| Reddit — r/nextjs | https://www.reddit.com/r/nextjs/ | Discusión (no oficial). |
| Reddit — r/reactnative | https://www.reddit.com/r/reactnative/ | Discusión (no oficial). |

---

## Notas de mantenimiento

- Revisa los enlaces de pago y KYC antes de cada release; sus APIs cambian con frecuencia.
- Fija versiones en `package.json` y actualiza con `npm audit` y pruebas.
- No copies fragmentos de foros sin adaptarlos y validarlos.
- Para cambios de seguridad, prioriza OWASP ASVS y la documentación oficial.

**Volver:** [`README.md`](../README.md) · [`datasheet.md`](datasheet.md) · [`developer.md`](developer.md) · [`BITACORA.md`](BITACORA.md)
