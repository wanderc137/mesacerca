# App móvil MesaCerca — cliente y repartidor

> **Estado:** MVP funcional en Expo/React Native, probado en web y listo para Expo Go.
> **Una sola app, dos experiencias:** el rol se detecta al iniciar sesión.
> **Fecha:** 07/11/2026.

---

## 1. Qué incluye

### Experiencia cliente

- Login y sesión persistente.
- Home con búsqueda, filtro por comuna y cocina.
- Detalle de local, categorías, platos y modificadores.
- Carrito persistente.
- Checkout con dirección, retiro/delivery, propina, efectivo o pago online.
- Tracking del pedido con timeline, PIN y repartidor.
- Cancelación antes de que el local acepte.
- Calificación con estrellas.
- Historial de pedidos.
- Cuenta, soporte y cierre de sesión.

### Experiencia repartidor

- Login y sesión persistente.
- Conexión/desconexión.
- Pedidos disponibles con distancia al local, distancia de entrega y pago.
- Aceptar pedido; primero en aceptar gana.
- Retiro y entrega con PIN.
- Ruta en Google Maps.
- Ganancias del día/semana y detalle de entregas.
- Cuenta, verificación y cierre de sesión.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 58 |
| UI | React Native 0.88 + React 19 |
| Navegación | Expo Router |
| Estado | React Context |
| Sesión | `expo-secure-store` (nativo) / `localStorage` (web) |
| Carrito | `@react-native-async-storage/async-storage` |
| Ubicación | `expo-location` |
| Iconos | `@expo/vector-icons` (Ionicons) |
| API | REST con Bearer token |
| Tipado | TypeScript estricto |

---

## 3. Cómo ejecutar

### 3.1 Requisitos

- Node.js 20+.
- App **Expo Go** en el teléfono (iOS/Android).
- Teléfono y computador en la misma red WiFi.
- El servidor web de MesaCerca corriendo en `0.0.0.0:3000`.

### 3.2 Servidor

En la raíz del proyecto:

```bash
npm run dev -- --hostname 0.0.0.0
```

### 3.3 App

```bash
cd mobile
npm install
npx expo start
```

Escanea el QR con Expo Go.

La app detecta automáticamente la IP del computador desde Metro y usa:

```text
http://<IP-del-computador>:3000
```

Si la detección falla, crea `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.0.2.92:3000
```

### 3.4 Web (preview)

```bash
cd mobile
npx expo start --web
```

Abre `http://localhost:8081`.

### 3.5 Build de producción

```bash
cd mobile
npx expo export --platform web
# o, para tiendas:
npx eas-cli@latest build
```

### 3.6 Seguridad de la app

- **HTTPS obligatorio en producción:** `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_WEB_URL` deben usar `https://`. La app lanza error al arrancar si faltan o son HTTP en un build de producción.
- Variable de entorno de ejemplo en `mobile/.env.example`.
- **Token nativo:** SecureStore con `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (Keychain/Keystore). En la PWA de preview se usa localStorage; para producción web conviene cookie httpOnly/BFF.
- **Android:** `allowBackup: false` y `usesCleartextTraffic: false` vía `expo-build-properties`.
- **iOS:** ATS con `NSAllowsArbitraryLoads: false`.
- **Sin secretos en el bundle:** solo variables `EXPO_PUBLIC_*`; nunca claves de pago, KYC o DB.
- **Deep link `mesacerca://`:** solo rutas de la app; no transporta tokens ni datos sensibles.
- **Timeout de API:** 20 s con `AbortController`; sin reintentos automáticos infinitos.
- **Pendiente:** certificate pinning, detección de root/jailbreak, protección de capturas en pantalla de PIN, atestación de dispositivo para repartidores y OTA firmado con EAS Update.
- **Build de tiendas:** `mobile/eas.json` tiene perfiles development/preview/production; configurar `EXPO_PUBLIC_API_URL` como secreto de EAS.

---

## 4. Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `mesacerca123` |
| Repartidor demo (KYC aprobado) | `repartidor@mesacerca.cl` | `mesacerca123` |
| Repartidor QA (cuenta libre) | `courier2@mesacerca.cl` | `mesacerca123` |
| Repartidor QA | `angel.92460@mesacerca.cl` | `mesacerca123` |

> En desarrollo, el login muestra botones “Cliente demo” y “Repartidor demo”. En producción no aparecen. El botón “Repartidor demo” usa `repartidor@mesacerca.cl`, la misma cuenta que la web, para que el KYC aprobado sea consistente.

---

## 5. Flujo de prueba recomendado

1. Abrir la app y entrar como **Cliente demo**.
2. Buscar “Sofía” o elegir una cocina.
3. Agregar un plato; si tiene modificadores, elegir opciones.
4. Ir a pagar; elegir **Efectivo al recibir**.
5. Confirmar el pedido y ver el tracking.
6. Cerrar sesión y entrar como **Repartidor demo**.
7. Conectarse y ver los pedidos disponibles.
8. Aceptar un pedido, confirmar retiro y entregar con PIN.
9. Volver a la cuenta cliente y ver el pedido entregado.
10. Calificar con 5 estrellas.

> Para probar el ciclo completo con una cocina nueva, usar la guía `docs/13-guia-de-pruebas.md` y las pantallas web del local/admin.

---

## 6. API móvil

La app usa estos endpoints con `Authorization: Bearer <token>`:

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/mobile/auth/login` | Login y token |
| GET | `/api/mobile/me` | Validar sesión |
| GET | `/api/mobile/home` | Locales, comunas y cocinas |
| GET | `/api/mobile/stores/[slug]` | Menú completo |
| GET | `/api/mobile/addresses` | Direcciones del cliente |
| GET | `/api/mobile/orders` | Historial del cliente |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/orders/[id]` | Tracking |
| PATCH | `/api/orders/[id]` | Cancelar / avanzar estado |
| POST | `/api/reviews` | Calificar |
| GET | `/api/courier` | Dashboard del repartidor |
| POST | `/api/courier/status` | Conectar/desconectar |
| POST | `/api/courier/location` | Ubicación |
| GET | `/api/mobile/courier/earnings` | Ganancias |

Los endpoints existentes aceptan **cookie** (web) o **Bearer** (móvil). El token móvil dura 7 días y se revoca con `tokenVersion` al cerrar sesión.

> MFA: la app móvil todavía no tiene desafío TOTP. Si una cuenta tiene MFA activo, el login móvil responde `403` y debe usar la web. No se debe habilitar MFA para repartidores hasta implementar ese flujo en la app.

---

## 7. Decisiones técnicas

- **Una app, dos roles:** reduce mantenimiento y comparte autenticación, tema y componentes. Se puede dividir en dos apps si el negocio lo exige.
- **Bearer token:** evita problemas de cookies en React Native.
- **Polling cada 5 s:** suficiente para el MVP y sin infraestructura de push.
- **Google Maps por deep link:** no requiere API key ni SDK nativo; se puede reemplazar por un mapa embebido después.
- **Pago online abre el navegador:** no se integra SDK de tarjetas en la app; se delega a Mercado Pago/Transbank.
- **Direcciones:** se cargan desde la API y se guardan al pedir desde la web; la app puede reutilizarlas.
- **Sin app nativa publicada:** el código está listo para EAS Build.

---

## 8. Verificación

```bash
cd mobile
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

Resultado actual:

- TypeScript: **sin errores**.
- Expo lint: **sin errores ni warnings**.
- Export web: **exitoso**.
- Smoke web móvil: login cliente, home, local, carrito, checkout y panel repartidor, **0 errores de consola**.

Capturas reales en:

- `assets/screenshots/mobile/mobile-home.png`
- `assets/screenshots/mobile/mobile-store.png`
- `assets/screenshots/mobile/mobile-checkout.png`
- `assets/screenshots/mobile/mobile-courier.png`

Smoke reproducible:

```bash
node scripts/mobile-web-smoke.mjs
```

---

## 9. Limitaciones actuales

- Sin notificaciones push nativas; polling cada 5 s.
- Sin mapa embebido; se abre Google Maps.
- Sin pago con tarjeta dentro de la app; se abre el navegador.
- Sin registro de cliente/repartidor dentro de la app; se hace en la web.
- Sin chat cliente-repartidor.
- Sin funcionamiento offline.
- Sin build firmado para App Store/Google Play.
- Sin tests E2E nativos; smoke web y typecheck.
- Depende de que el teléfono y el servidor estén en la misma red para desarrollo.

---

## 10. Próximos pasos

1. Probar en Expo Go con un teléfono real.
2. Configurar `EXPO_PUBLIC_API_URL` para el entorno.
3. Implementar push con `expo-notifications` y un project ID de EAS.
4. Agregar mapa embebido con `react-native-maps` o MapLibre.
5. Integrar pago con WebView o SDK nativo.
6. Agregar registro de repartidor en la app.
7. Build de desarrollo con EAS y luego build de producción.
8. Publicar en TestFlight/Play Console.
