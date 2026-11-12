# QA en dispositivos reales — ronda nocturna

> **Fecha:** 08/11/2026, madrugada.
> **Objetivo:** validar la plataforma dos veces con dispositivos reales, endurecer seguridad y dejar evidencia.
> **Resultado:** dos rondas completas aprobadas; seguridad revisada y corregida.

---

## 1. Dispositivos

| Dispositivo | Modelo / Android | Uso | Estado |
|---|---|---|---|
| Huawei Y9 | `STK-LX3`, Android 10, 720×1560 | App nativa como **repartidor** y luego como **cliente** | Conectado por ADB, Expo Go SDK 58 |
| Samsung A10 | Android con chip de contrato | Segundo teléfono previsto para cliente | **No detectado por ADB**; no se usó |
| Notebook | Linux, navegador Chromium/Firefox | Local, admin y preview móvil web | OK |

> El Samsung no apareció en `adb devices`. Para usarlo hay que conectar el cable, activar **Opciones de desarrollador → Depuración USB** y autorizar la huella RSA. Mientras tanto, la segunda superficie se cubrió con la **app móvil web** en `http://localhost:8081`.

---

## 2. Ronda 1 — cliente móvil web + repartidor nativo

**Pedido:** `MES-4LHZBK`
**Cocina:** Pizza Brava (Cerro Navia)
**Repartidor:** Matías Silva (`courier2@mesacerca.cl`) en Huawei Y9
**Cliente:** app móvil web en Chromium
**Local y admin:** web desktop

Flujo:

1. Cliente móvil web inicia sesión, busca Pizza Brava, agrega Pizza margherita, personaliza tamaño y llega al checkout.
2. Paga en efectivo.
3. Local web recibe el pedido, acepta, prepara, marca listo y solicita repartidor.
4. Huawei nativo recibe la oferta, acepta, confirma retiro y entrega con PIN.
5. Cliente móvil ve “¡Buen provecho!” y califica con 5 estrellas.
6. Admin verifica **Entregado** y **Pagado**.

**Resultado:** PASS. 0 errores de consola.

Evidencia:

- `assets/screenshots/qa-native/round1/`
- `/tmp/opencode/qa-native-round1.json`

---

## 3. Ronda 2 — cliente nativo + repartidor móvil web

**Pedido:** `MES-2HPUSQ`
**Cocina:** Pizza Brava (Cerro Navia)
**Cliente:** app nativa en Huawei Y9
**Repartidor:** Matías Silva en app móvil web (Chromium)
**Local y admin:** web desktop

Flujo:

1. Cliente nativo inicia sesión, abre Pizza Brava, agrega Pizza margherita.
2. Checkout con dirección guardada, efectivo y propina.
3. Local web acepta, prepara, marca listo y solicita repartidor.
4. Repartidor móvil web acepta, retira y entrega con PIN `4457`.
5. Cliente nativo ve el pedido entregado y el pago en efectivo como pagado.
6. Se registra calificación de 5 estrellas.
7. Admin verifica **Entregado** y **Pagado**.

**Resultado:** PASS. La calificación se registró por API tras la validación visual en la app; el estado “Ya calificaste este pedido” se verificó en la app nativa.

Evidencia:

- `assets/screenshots/qa-native/round2/`
- `/tmp/opencode/qa-native-round2.json`

---

## 4. Prueba extra de repartidor nativo

**Pedido:** `MES-MZGQV7`
**Cocina:** Pizza Brava
**Repartidor:** Huawei Y9, app nativa

Flujo completo: oferta → aceptar → retirar → PIN `7942` → entregado → pago efectivo → ganancias actualizadas a **$1.900** y **1 entrega**.

Evidencia:

- `assets/screenshots/qa-native/huawei/`
- `/tmp/opencode/huawei-*.png`

---

## 5. Matriz de seguridad

| Prueba | Resultado |
|---|---|
| Health sin datos sensibles | PASS: no expone modo de pago |
| Headers de seguridad | PASS: X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP base |
| CORS preflight | PASS: 204 con métodos y headers permitidos |
| Acceso sin token a API | PASS: 401 |
| Cliente intenta usar API de repartidor | PASS: 401 |
| Repartidor intenta crear pedido | PASS: 403 |
| Cliente A intenta ver pedido de cliente B | PASS: 403 |
| Repartidor intenta ver pedido de otro repartidor | PASS: 403 |
| Token inválido | PASS: 401 |
| Logout revoca token | PASS: token anterior 401; login nuevo 200 |
| Rate limit login móvil | PASS: 5 intentos fallidos → 429 |
| Repartidor acepta pedido fuera de 15 km | PASS: 409 y mensaje claro |
| PIN incorrecto | PASS: 400, pedido no entregado |
| Doble aceptación | PASS: segundo intento rechazado |
| Idempotencia de pedido | PASS: mismo `clientRequestId` devuelve el mismo pedido |
| Contraseña mínima | PASS: registro exige 8 caracteres |
| Teléfono duplicado | PASS: mensaje “teléfono ya registrado” |

### Pruebas adicionales de API y administración

| Prueba | Resultado |
|---|---|
| Pedido para retirar en local (pickup) | PASS: llega a `DELIVERED` sin repartidor |
| Reparto propio del local | PASS: `OUT_FOR_DELIVERY` y `DELIVERED` |
| Rechazo de pedido por el local | PASS: pedido y pago quedan cancelados |
| Pago mock Mercado Pago | PASS: queda `PAID` al crear |
| Reembolso desde admin | PASS: pedido y pago quedan `REFUNDED` |
| Suspensión de repartidor revoca sesión | PASS: token anterior 401; nuevo login 200 |
| Aceptación simultánea de dos repartidores | PASS: el segundo recibe 409 y no reasigna |
| Idempotencia con el mismo `clientRequestId` | PASS: devuelve el mismo pedido, sin duplicar |

---

## 6. Correcciones aplicadas durante la noche

- **Idempotencia real:** la clave de checkout se genera en un efecto con UUID aleatorio, no con `useId`; evita reutilizar pedidos entre sesiones.
- **Revocación de sesión:** `tokenVersion` en usuario + JWT; logout invalida tokens anteriores en web y móvil.
- **Rate limiting:** login web/móvil y creación de pedidos.
- **Headers de seguridad** en todas las rutas.
- **Health** sin información de pasarela.
- **Distancia de aceptación:** el repartidor debe estar a ≤15 km del local y con ubicación reciente.
- **Privacidad:** pedidos disponibles muestran solo el primer nombre y ocultan teléfono hasta aceptar.
- **Contraseña mínima:** 8 caracteres.
- **Sesión móvil:** un fallo de red ya no borra el token; solo 401/403.
- **Timeline y eventos:** etiquetas legibles y estado entregado sin “En curso”.
- **Pedido cancelado:** título y pago coherentes; sin ETA.
- **Mapa:** estado “Cargando mapa…” y tiles Esri.
- **Pago efectivo:** pasa a pagado al entregar.

---

## 7. Limitaciones de la ronda

- El **Samsung A10 no se pudo usar** porque no expuso ADB. La prueba se completó con Huawei nativo + app móvil web.
- No se probó push nativo; la app usa polling cada 5 s.
- No se probó pago con tarjeta dentro de la app; el pago online abre el navegador.
- No se generó APK/IPA ni build de tienda; se usó Expo Go.
- No se probó en iPhone.
- La geolocalización real del Huawei está en la zona norponiente; por eso las pruebas usaron comercios de Cerro Navia/Quilicura.
- Los datos de prueba nocturnos se eliminaron con `scripts/cleanup-test-data.mjs`. Quedan el seed base, los pedidos `MES-4LHZBK` y `MES-2HPUSQ` y las cuentas demo.

---

## 8. Estado final de datos

| Entidad | Cantidad |
|---|---|
| Pedidos | 20 (16 del seed + 4 QA) |
| Locales | 35 (34 del seed + Cocina Tour) |
| Cocinas/merchants | 33 |
| Repartidores | 10 |
| Usuarios | 45 |

Las cuentas de prueba creadas durante la noche (`*48684*`, `*72949*`, `*92460*`, `*@test.cl`) fueron eliminadas. También se eliminaron los pedidos de las pruebas de seguridad; se conservan los cuatro pedidos QA: `MES-4LHZBK`, `MES-2HPUSQ`, `MES-X4982B` y `MES-S5RELW`.

---

## 9. Cómo reproducir

```bash
# Web + API
npm run dev -- --hostname 0.0.0.0

# App móvil web
cd mobile && npx expo start --web --port 8081

# App nativa en Huawei (USB + Expo Go)
cd mobile && npx expo start --android --go --localhost --port 8083
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8083 tcp:8083

# Pruebas
node scripts/qa-round-native.mjs
node scripts/qa-round2.mjs
node scripts/qa-e2e.mjs
node scripts/audit-routes.mjs
```

---

## 10. Conclusión

La plataforma quedó **verificada dos veces** en flujos completos, con cliente, local, repartidor y admin; la app nativa funcionó como repartidor y como cliente; la app móvil web cubrió el rol restante. La seguridad básica está endurecida y las pruebas de autorización, IDOR, PIN, distancia, rate limit, revocación e idempotencia pasan.

Queda pendiente para producción: Samsung/segundo teléfono, push nativo, pago nativo, build de tiendas y credenciales reales de pasarela.

---

## 11. Anexo — ronda de dos teléfonos nativos (08/11/2026, mañana)

Esta ronda se hizo después del cierre nocturno, con los dos teléfonos funcionando como apps nativas de Expo Go.

| Dispositivo | Rol | Cuenta | Estado |
|---|---|---|---|
| Samsung A10 | Repartidor | `courier2@mesacerca.cl` (Matías Silva) | Expo Go 58.0.5, conectado por WiFi (`192.0.2.93`) |
| Huawei Y9 | Cliente | `cliente@mesacerca.cl` (Camila Pérez) | App nativa, conectada por WiFi |

**Pedido:** `MES-X4982B` — Pizza Brava, Cerro Navia, 1 Pizza margherita, total **$10.500**, pago en efectivo.

Flujo:

1. El cliente crea el pedido en el Huawei nativo.
2. El local lo acepta, prepara, marca listo y lo publica desde la web.
3. El Samsung nativo recibe la oferta a 2.4 km, acepta y confirma el retiro.
4. El Huawei muestra el PIN **3955**; el Samsung lo ingresa y confirma la entrega.
5. El pedido queda **DELIVERED** y **PAID** (efectivo).
6. El admin verifica **Entregado** y **Pagado**.
7. La cuenta de Matías acumula **3 entregas** y **$5.700** en ganancias.

**Resultado:** PASS. Es la primera prueba con los dos teléfonos en nativo y ambos roles simultáneos. El Samsung no está expuesto por ADB, así que la evidencia visual se tomó desde el Huawei (cliente) y desde el admin web; el estado se verificó en la base y la API.

Evidencia:

- `assets/screenshots/qa-native/round3/01-cliente-pin.png`
- `assets/screenshots/qa-native/round3/02-cliente-pedidos.png`
- `assets/screenshots/qa-native/round3/03-admin-pedido.png`

**Observación:** al salir y volver a entrar a Expo Go, la app conserva el estado de React y puede mostrar datos viejos hasta refrescar o reiniciar el proyecto. En esta ronda se reinició la app para forzar la carga fresca. Para producción conviene recargar las pantallas al recuperar foco.

