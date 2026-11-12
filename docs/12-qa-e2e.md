# QA end-to-end — ciclo completo

> **Fecha:** 07/11/2026
> **Navegador:** Mozilla Firefox (Playwright Firefox, headless para la prueba)
> **Alcance:** cocina nueva → menú → verificación admin → pedido cliente → cocina → publicación a repartidores → repartidor más cercano → entrega con PIN → calificación → cancelación.
> **Pago:** omitido a propósito; se usó **efectivo al recibir**.

---

## 1. Resultado

**PASS.** El ciclo completo funciona de punta a punta.

- 27 rutas auditadas: todas responden **200** y tienen contenido.
- 0 errores de página.
- 1 advertencia de hidratación en desarrollo, asociada a una inyección del navegador de pruebas (`caret-color`), no a la lógica de negocio.
- 14 páginas abiertas en Firefox para revisión visual, 0 errores de consola.

---

## 2. Datos de la prueba

| Elemento | Valor |
|---|---|
| Cocina | **Sofía Cocina 92460** (Providencia) |
| Cuenta local | `sofia.92460@mesacerca.cl` / `mesacerca123` |
| Repartidor A (nuevo) | **Ángel QA 92460** (Ñuñoa) / `angel.92460@mesacerca.cl` |
| Repartidor B (control) | `courier2@mesacerca.cl` (Huechuraba) |
| Cliente | `cliente@mesacerca.cl` (Camila Pérez, Ñuñoa) |
| Pedido entregado | **MES-XZQ25E** |
| Pedido cancelado | **MES-JFNHKZ** |
| PIN usado | **3805** |
| Distancia A al local | **3,1 km** |
| Distancia B al local | **7,7 km** |

---

## 3. Flujo ejecutado

1. **Registro de cocina** en `/registro/local` con nombre, email, teléfono, comuna, dirección y tipo de cocina.
2. **Carga de menú** en `/merchant/menu`:
   - Empanada de queso QA — $3.500.
   - Pastel de choclo QA — $8.500.
   - Jugo natural QA — $2.500.
3. **Registro de repartidor** en `/registro/repartidor`; queda en revisión.
4. **Verificación admin** de cocina y repartidor en `/admin/merchants` y `/admin/couriers`.
5. **Repartidores se conectan** (A nuevo y B de control).
6. **Cliente busca la cocina**, agrega productos, elige efectivo y crea el pedido.
7. **Cocina recibe el pedido en vivo** (polling + aviso), acepta, prepara y marca listo.
8. **Cocina publica el pedido** a repartidores.
9. **Ambos repartidores ven el pedido**:
   - A: 3,1 km al local.
   - B: 7,7 km al local.
10. **A acepta primero**; el pedido desaparece de la lista de B.
11. **A retira** el pedido y el cliente ve el PIN.
12. **A entrega con PIN**; el pedido queda **Entregado** y el pago en efectivo **Pagado**.
13. **Cliente califica** con 5 estrellas.
14. **Verificación post-operación**:
    - Historial del cliente.
    - Analítica del local.
    - Ganancias del repartidor.
    - Admin: pedido entregado y pagado.
15. **Cancelación**: segundo pedido, cancelado por el cliente antes de que la cocina aceptara; admin lo refleja.

---

## 4. Hallazgos y correcciones

### 4.1 Distancia del repartidor

**Problema:** la tarjeta del repartidor mostraba la distancia de entrega (local → cliente), no la distancia del repartidor al local. Todos los repartidores veían el mismo número.

**Corrección:**
- Se agregó `distanceToStore` al modelo de datos del panel.
- La tarjeta muestra **“X km al local”** y **“Y km de entrega”**.
- La lista se ordena por cercanía al local.
- Se agregó la etiqueta **“Más cercano”** al primer pedido de cada repartidor.

### 4.2 Pago en efectivo

**Problema:** al entregar un pedido con pago en efectivo, el pedido quedaba como pagado en la orden pero el registro de pago seguía pendiente; admin lo mostraba como “Pendiente”.

**Corrección:**
- Al pasar a `DELIVERED`, si el proveedor es `CASH`, se marca el pago como `PAID`.
- Se agrega el evento `PAYMENT_CONFIRMED`.
- Admin ahora muestra **Pagado** después de la entrega.

### 4.3 Timeline del pedido

**Problema:** el paso “Entregado” aparecía como “En curso” con pulso, y el historial mostraba códigos crudos (`PAYMENT_CASH_PENDING`, `PENDING_COURIER`).

**Corrección:**
- `DELIVERED`/`COMPLETED` cierran todos los pasos del timeline con check.
- Se agregaron etiquetas legibles para los eventos nuevos.
- El paso final ahora dice “Pedido entregado”.

---

## 5. Evidencia

- Capturas: `assets/screenshots/qa-e2e/92460/`
- Reporte JSON: `/tmp/opencode/qa-e2e-92460.json`
- Script reproducible: `scripts/qa-e2e.mjs`
- Auditoría de rutas: `scripts/audit-routes.mjs` → `/tmp/opencode/mesacerca-route-audit.json`

Capturas clave:

| Archivo | Qué muestra |
|---|---|
| `01-local-registrado.png` | Cocina creada |
| `02-menu-cargado.png` | Menú con 3 platos |
| `03-admin-locales.png` | Admin verifica cocina |
| `04-admin-repartidores.png` | Admin verifica repartidor |
| `09-pedido-cliente.png` | Pedido del cliente |
| `10-cocina-recibe.png` | Cocina recibe el pedido |
| `12-repartidor-a-ve-pedido.png` | A ve 3,1 km |
| `13-repartidor-b-ve-pedido.png` | B ve 7,7 km |
| `14-repartidor-a-gana.png` | A acepta |
| `15-repartidor-b-sin-pedido.png` | B ya no lo ve |
| `18b-cliente-entregado.png` | Entregado + pagado + timeline completo |
| `19-cliente-califica.png` | Calificación 5 estrellas |
| `23-admin-pedido.png` | Admin: entregado y pagado |
| `25-cliente-cancela.png` | Cancelación |
| `26-admin-cancelacion.png` | Admin refleja la cancelación |

---

## 6. Rutas auditadas

- Públicas: `/`, `/para-locales`, `/para-repartidores`, `/soporte`, `/legal/terminos`, `/legal/privacidad`, `/legal/reembolsos`, `/login`, `/register`, `/registro/local`, `/registro/repartidor`, `/store/[slug]`.
- Cliente: `/checkout`, `/orders`, `/order/[id]`.
- Local: `/merchant`, `/merchant/menu`, `/merchant/analytics`.
- Repartidor: `/courier`, `/courier/earnings`.
- Admin: `/admin`, `/admin/orders`, `/admin/merchants`, `/admin/couriers`.
- API: `/api/health`.

Todas las páginas respondieron **200** con contenido principal renderizado.

---

## 7. Cómo reproducir

```bash
# Servidor de desarrollo corriendo en localhost:3000
node scripts/qa-e2e.mjs
node scripts/audit-routes.mjs
```

El script crea una cocina y un repartidor nuevos, ejecuta el ciclo y deja evidencia en `assets/screenshots/qa-e2e/<suffix>/`.

Para limpiar los datos de prueba dejando solo la corrida de referencia:

```bash
node scripts/cleanup-qa.mjs
```

Para volver al estado base:

```bash
npm run db:reset
```

---

## 8. Límites de la prueba

- No se probó el cobro real con Mercado Pago/Transbank; el flujo usó efectivo y el modo demo de pagos.
- La prueba se ejecutó en un solo equipo y una sola instancia de base de datos.
- No se probó concurrencia de dos repartidores aceptando exactamente al mismo tiempo; se validó la prioridad por cercanía y que el primero en aceptar toma el pedido.
- No se probó geolocalización real del navegador; se usaron las coordenadas de registro de cada repartidor.
- Las notificaciones son polling cada 5 s, no push nativo.
