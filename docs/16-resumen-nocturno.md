# Resumen nocturno — MesaCerca

> **Cierre:** 08/11/2026, 02:05 (America/Santiago).
> **Resultado:** plataforma verificada dos veces en flujos reales, seguridad endurecida, datos de prueba limpios y todo corriendo.

---

## 1. Lo que quedó funcionando

| Servicio | URL | Estado |
|---|---|---|
| Web + API | <http://localhost:3000> | 200 |
| App móvil web (Expo) | <http://localhost:8081> | 200 |
| Expo Go LAN | `exp://192.0.2.92:8082` | 200 |
| Expo Go ADB (Huawei) | `exp://127.0.0.1:8083` | Activo |
| Huawei Y9 | `85LNW19522001349` | Conectado, app abierta |

Build de producción, lint web, TypeScript y lint móvil: **PASS**.
Export web de la app móvil: **PASS**.

---

## 2. Pruebas con dispositivos reales

### Ronda 1 — cliente móvil web + repartidor nativo

Pedido **MES-4LHZBK**: cliente pidió en Pizza Brava, local aceptó/preparó/publicó, Huawei nativo aceptó, retiró y entregó con PIN; cliente calificó 5 estrellas; admin verificó **Entregado** y **Pagado**. 0 errores de consola.

### Ronda 2 — cliente nativo + repartidor móvil web

Pedido **MES-2HPUSQ**: cliente nativo en Huawei pidió en Pizza Brava; local web publicó; repartidor móvil web aceptó, retiró y entregó con PIN `4457`; admin verificó estado y pago. Calificación registrada.

### Ronda extra — repartidor nativo

Pedido **MES-MZGQV7**: aceptar → retirar → PIN `7942` → entregado → efectivo pagado → ganancias del repartidor actualizadas.

### Ronda 3 — dos teléfonos nativos (mañana del 08/11)

Pedido **MES-X4982B**: Samsung A10 como repartidor nativo (Matías Silva) y Huawei Y9 como cliente nativo. El Samsung aceptó a 2.4 km, retiró y entregó con PIN `3955`; el pedido quedó **Entregado/Pagado** y el admin lo verificó. Matías acumuló 3 entregas y $5.700. Detalle en `docs/15-qa-dispositivos.md`.

Detalle completo y matriz de seguridad: `docs/15-qa-dispositivos.md`.

---

## 3. Seguridad verificada

- Acceso sin token: 401.
- Aislamiento por rol y por recurso (IDOR): 403.
- Logout y suspensión revocan tokens: 401.
- Rate limit de login: 429 tras 5 intentos.
- Aceptación fuera de 15 km: 409.
- PIN incorrecto: 400 y pedido no entregado.
- Doble aceptación: segundo repartidor rechazado.
- Idempotencia: mismo `clientRequestId` devuelve el mismo pedido.
- Headers de seguridad y CORS: presentes.
- Health sin datos de pasarela.

---

## 4. Datos finales

| Entidad | Cantidad |
|---|---|
| Pedidos | 20 (16 seed + 4 QA) |
| Locales | 35 (34 seed + Cocina Tour) |
| Merchants | 33 |
| Repartidores | 10 |
| Usuarios | 45 |

Cuentas demo (contraseña `mesacerca123`): `cliente@mesacerca.cl`, `local@mesacerca.cl`, `repartidor@mesacerca.cl`, `admin@mesacerca.cl`.

Limpieza reproducible: `node scripts/cleanup-test-data.mjs`.

---

## 5. Qué falta para producción

1. **GitHub:** el repositorio privado `wanderc137/mesacerca` todavía no se creó porque no hay sesión autenticada de `gh` y los códigos de dispositivo anteriores expiraron. Todo está commiteado localmente y listo para `scripts/push-github.sh`.
2. **Samsung A10:** quedó operativo como app nativa con Expo Go y se usó como repartidor en la ronda 3. No expone ADB, así que la evidencia visual se tomó desde el Huawei y el admin web.
3. **Pagos reales:** Mercado Pago/Transbank siguen en modo mock/sandbox; no hay credenciales productivas.
4. **APK/IPA:** la app corre en Expo Go; falta build EAS y publicación en tiendas.
5. **Push nativo:** la app usa polling cada 5 s; no hay notificaciones push.
6. **Producción:** PostgreSQL, KYC, boleta electrónica, seguros, dominio y revisión legal.

---

## 6. Cómo retomar

```bash
cd /home/jma/Documents/Proyect/mesacerca
npm run dev -- --hostname 0.0.0.0
cd mobile && npx expo start --web --port 8081
```

Para publicar en GitHub cuando haya sesión:

```bash
gh auth login
./scripts/push-github.sh
```

El script crea el repo privado y hace push de la rama principal.
