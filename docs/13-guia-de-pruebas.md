# Guía de prueba de la plataforma MesaCerca

> **Versión:** 1.0 · **Fecha:** 07/11/2026
> **Alcance:** plataforma web/PWA completa: cliente, local, repartidor y administración.
> **Excluye:** cobro real con tarjeta (se prueba en sandbox o efectivo) y apps nativas.
> **Entorno base:** `http://localhost:3000`

---

## 1. Objetivo

Validar que el ciclo operativo completo funciona de forma coordinada:

```
Cocina se registra → carga menú → admin verifica
        ↓
Cliente pide → paga/elige efectivo → cocina recibe
        ↓
Cocina acepta → prepara → publica a repartidores
        ↓
Repartidor más cercano acepta → retira → entrega con PIN
        ↓
Cliente califica → admin y local ven el resultado
```

La guía cubre:

- Pruebas funcionales por rol.
- Flujos end-to-end.
- Pagos en modo demo, efectivo y sandbox.
- Permisos, seguridad y accesos directos.
- Responsive, PWA y accesibilidad.
- Criterios de salida y reporte de bugs.

---

## 2. Entorno de prueba

### 2.1 Requisitos

- Node.js 20+.
- Navegador Firefox (recomendado para la réplica de QA).
- Servidor de desarrollo corriendo.

### 2.2 Levantar la plataforma

```bash
cd /home/jma/Documents/Proyect/mesacerca
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abrir <http://localhost:3000>.

### 2.3 Reset de datos

Antes de una ronda formal:

```bash
npm run db:reset
```

Esto borra los datos de prueba y recarga:

- 34 locales (30 activos, 4 pendientes).
- 170 platos.
- 10 repartidores.
- 16 pedidos en distintos estados.
- Cuentas demo.

### 2.4 Navegador

- **Firefox** para la prueba manual.
- Limpiar caché/sesión entre rondas si se cambian roles: `Ctrl+Shift+Supr` o ventana privada.
- Para pruebas de PWA, usar build de producción (`npm run build && npm run start`).

---

## 3. Cuentas y datos

### 3.1 Cuentas demo

Contraseña para todas: **`mesacerca123`**

| Rol | Email | Entrada |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `/` |
| Local | `local@mesacerca.cl` | `/merchant` |
| Repartidor | `repartidor@mesacerca.cl` | `/courier` |
| Admin | `admin@mesacerca.cl` | `/admin` |

> En desarrollo, `/login` muestra botones para cargar cada cuenta. En producción esas cuentas deben eliminarse o cambiarse.

### 3.2 Datos de la corrida QA de referencia

Si no se ha ejecutado `db:reset`, pueden existir:

| Elemento | Valor |
|---|---|
| Cocina QA | `Sofía Cocina 92460` (Providencia) |
| Cuenta local QA | `sofia.92460@mesacerca.cl` / `mesacerca123` |
| Repartidor QA | `Ángel QA 92460` (Ñuñoa) / `angel.92460@mesacerca.cl` |
| Pedido entregado | `MES-XZQ25E` |
| Pedido cancelado | `MES-JFNHKZ` |
| PIN usado | `3805` |

> `npm run db:reset` elimina estos datos. La guía está escrita para funcionar con el seed base.

### 3.3 Cuentas auxiliares del seed

| Email | Rol | Uso |
|---|---|---|
| `courier1@mesacerca.cl` | Repartidor | Tiene un pedido activo; útil para probar bloqueo de conexión. |
| `courier2@mesacerca.cl` | Repartidor | Libre; útil como segundo repartidor de control. |
| `local2@mesacerca.cl` … `local34@mesacerca.cl` | Local | Locales de otras comunas. |

---

## 4. Convenciones

### 4.1 Prioridad

| Prioridad | Significado |
|---|---|
| **P0** | Bloquea el ciclo principal. Si falla, no se puede operar. |
| **P1** | Afecta una función importante, pero existe workaround. |
| **P2** | Detalle visual, texto o mejora. |

### 4.2 Severidad de bugs

| Severidad | Criterio |
|---|---|
| **Crítica** | Pérdida de pedidos, pagos o datos; acceso indebido; caída total. |
| **Alta** | Flujo principal roto sin workaround. |
| **Media** | Función secundaria rota o workaround incómodo. |
| **Baja** | Texto, alineación, copy, detalle estético. |

### 4.3 Evidencia

Para cada caso:

- Captura de pantalla.
- Código de pedido.
- Email/rol usado.
- Hora y zona horaria.
- Consola del navegador si hay error.
- Respuesta de API si aplica.

---

## 5. Preparación de la ronda

- [ ] `npm run db:reset` ejecutado.
- [ ] Servidor en `http://localhost:3000`.
- [ ] Firefox actualizado.
- [ ] Cuentas demo probadas.
- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] Se conoce el modo de pago: `mock`, `sandbox` o `production`.
- [ ] Se acordó no usar tarjetas reales.

---

## 6. Pruebas por rol

### 6.1 Público

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| P-01 | Home carga | Abrir `/` | Hero, buscador, categorías, locales y cobertura visibles. | P0 |
| P-02 | Búsqueda | Buscar “sushi” | Resultados filtrados por nombre/cocina/comuna. | P0 |
| P-03 | Filtro comuna | Seleccionar “Ñuñoa” | Solo locales de Ñuñoa o mensaje de vacío. | P1 |
| P-04 | Filtro cocina | Clic en “Japonesa” | Solo locales japoneses. | P1 |
| P-05 | Página de local | Abrir un local | Portada, rating, tiempo, menú y precios. | P0 |
| P-06 | Local inexistente | Abrir `/store/no-existe` | Página 404, sin error de servidor. | P1 |
| P-07 | Legal | Abrir términos, privacidad y reembolsos | Contenido visible y navegación entre páginas. | P1 |
| P-08 | Marketing | Abrir `/para-locales` y `/para-repartidores` | Contenido y CTA de registro visibles. | P1 |
| P-09 | Soporte | Abrir `/soporte` | FAQ y canales de contacto. | P2 |
| P-10 | 404 | Abrir `/ruta-inexistente` | Página 404 con enlace al inicio. | P2 |

---

### 6.2 Cliente

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| C-01 | Login | `/login` → botón Cliente → Ingresar | Redirige al home y muestra “Camila”. | P0 |
| C-02 | Logout | Menú de usuario → Cerrar sesión | Vuelve al home como invitado. | P0 |
| C-03 | Registro | `/register` con email/teléfono nuevos | Crea cuenta y redirige al home. | P0 |
| C-04 | Registro duplicado | Repetir email o teléfono | Mensaje claro: “Ya existe…” o “teléfono ya registrado”. | P1 |
| C-05 | Menú y modificadores | Abrir local con platos personalizables | Modal con opciones, precio actualizado y notas. | P0 |
| C-06 | Carrito | Agregar 2 platos | Contador y subtotal correctos. | P0 |
| C-07 | Cantidades | Subir/bajar cantidad | Subtotal y total se recalculan. | P0 |
| C-08 | Eliminar | Quitar un plato | Desaparece y el subtotal se ajusta. | P0 |
| C-09 | Carrito multi-local | Agregar de local A y luego local B | Se reemplaza el carrito anterior con aviso. | P1 |
| C-10 | Vaciar carrito | Botón “Vaciar carrito” | Carrito vacío y estado vacío. | P1 |
| C-11 | Checkout delivery | Ir a pagar con dirección | Muestra dirección, comuna, teléfono, envío y servicio. | P0 |
| C-12 | Checkout retiro | Elegir “Retiro en local” | Envío y servicio en $0; no exige dirección. | P0 |
| C-13 | Pedido mínimo | Local con mínimo $8.000 y carrito menor | Botón de pago deshabilitado y aviso de cuánto falta. | P1 |
| C-14 | Propina | Elegir $0, $500, $1.000, $1.500 u otro | Total se actualiza; propina va al repartidor. | P1 |
| C-15 | Pago efectivo | Elegir “Efectivo al recibir” y pagar | Pedido creado como “Pedido nuevo”; pago pendiente. | P0 |
| C-16 | Pago demo | Con `PAYMENTS_MODE=mock`, elegir Mercado Pago/Transbank | Pedido pagado en modo demo, sin pasarela real. | P0 |
| C-17 | Tracking | Abrir `/order/[id]` | Timeline, mapa, estado y datos del pedido. | P0 |
| C-18 | PIN | Tras asignación de repartidor | Aparece PIN de 4 dígitos. | P0 |
| C-19 | Cancelar antes de aceptar | Pedido en `PENDING_MERCHANT` → Cancelar | Confirmación, estado “Cancelado por cliente”. | P0 |
| C-20 | Cancelar después de aceptar | Pedido aceptado | Botón de cancelar no disponible. | P1 |
| C-21 | Calificar | Pedido entregado → 5 estrellas → enviar | “Ya calificaste este pedido”. | P1 |
| C-22 | Historial | `/orders` | Pedidos con código, estado, total y fecha. | P1 |
| C-23 | Acceso sin sesión | Abrir `/checkout` o `/orders` sin login | Redirige a `/login?next=...`. | P0 |
| C-24 | Persistencia | Recargar tracking y home | Sesión y carrito se mantienen. | P1 |

---

### 6.3 Local

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| L-01 | Registro | `/registro/local` con datos nuevos | Crea local en estado “Pendiente”, redirige a `/merchant`. | P0 |
| L-02 | Menú con local pendiente | Ir a `/merchant/menu` | Permite cargar categorías y platos. | P1 |
| L-03 | Verificación admin | Admin → Locales → Verificar | Local pasa a “Verificado” y sus sucursales a “Activo”. | P0 |
| L-04 | Crear categoría | Menú → Nueva categoría | Categoría aparece en la lista. | P1 |
| L-05 | Crear plato | Categoría → Agregar plato | Plato visible con precio y emoji. | P0 |
| L-06 | Editar plato | “Editar plato” → cambiar nombre/precio | Cambios persistidos. | P1 |
| L-07 | Agotar plato | “Marcar agotado” | Cliente ve “Agotado” y no puede agregar. | P1 |
| L-08 | Reactivar plato | “Reactivar” | Vuelve a estar disponible. | P1 |
| L-09 | Eliminar plato | “Eliminar” | Desaparece del menú. | P1 |
| L-10 | Recibir pedido | Cliente crea pedido | Aparece en “Nuevos” en ≤5 s, con aviso sonoro/banner. | P0 |
| L-11 | Aceptar | “Aceptar” | Pasa a “Aceptado”. | P0 |
| L-12 | Rechazar | “Rechazar” | Pedido “Cancelado por local”; cliente lo ve. | P0 |
| L-13 | Preparar | “Empezar preparación” | Pasa a “En preparación”. | P0 |
| L-14 | Listo | “Marcar listo” | Pasa a “Listo”. | P0 |
| L-15 | Reparto propio | “Salió a entregar” → “Marcar entregado” | Pedido entregado sin repartidor de plataforma. | P0 |
| L-16 | Solicitar repartidor | “Solicitar repartidor” | Pasa a “Buscando repartidor”; aparece a repartidores. | P0 |
| L-17 | Retiro | Pedido pickup listo → “Cliente retiró” | Pedido entregado. | P1 |
| L-18 | Analítica | `/merchant/analytics` | GMV, pedidos, ticket, comisión y top platos. | P1 |
| L-19 | Permisos | Local abre `/courier` o `/admin` | Redirige a `/merchant`. | P0 |
| L-20 | Suspensión | Admin suspende local | Sesión inválida; local desaparece del home. | P1 |
| L-21 | Portada del local | Menú → Portada del local → Elegir imagen → Subir portada | Imagen actualizada en el panel, el home y la página del local. | P1 |
| L-22 | Validación de portada | Subir archivo que no sea imagen o que supere 5 MB | Rechazo con mensaje claro; la portada anterior no cambia. | P1 |

---

### 6.4 Repartidor

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| R-01 | Registro | `/registro/repartidor` | Cuenta creada, “Cuenta en revisión”. | P0 |
| R-02 | Verificación admin | Admin → Repartidores → Verificar | Habilita conexión. | P0 |
| R-03 | Conectar | “Conectarme” | Botón cambia a “Conectado · Desconectarme”. | P0 |
| R-04 | Desconectar | “Desconectarme” sin entrega activa | Vuelve a offline. | P1 |
| R-05 | Bloqueo con entrega | Intentar desconectar con entrega activa | API rechaza con mensaje. | P1 |
| R-06 | Ver pedidos | Pedido publicado por local | Aparece con código, local, pago y dirección. | P0 |
| R-07 | Distancia | Comparar dos repartidores | Cada uno ve “X km al local”; el más cercano aparece primero. | P0 |
| R-08 | Aceptar | “Aceptar pedido” | Pasa a “Entrega activa”; desaparece para los demás. | P0 |
| R-09 | Doble aceptación | Dos repartidores intentan aceptar | Solo uno gana; el otro recibe error o deja de verlo. | P1 |
| R-10 | Retiro | “Confirmar retiro en local” | Estado “En camino”. | P0 |
| R-11 | Entrega correcta | “Confirmar entrega” + PIN | Pedido entregado; pago efectivo pasa a pagado. | P0 |
| R-12 | PIN incorrecto | Ingresar PIN erróneo | Mensaje “PIN de entrega incorrecto”; no entrega. | P0 |
| R-13 | Ganancias | `/courier/earnings` | Pedido entregado con base, propina y total. | P1 |
| R-14 | Permisos | Repartidor abre `/merchant` o `/admin` | Redirige a `/courier`. | P0 |
| R-15 | Suspensión | Admin suspende repartidor | Sesión inválida y no puede conectarse. | P1 |

---

### 6.5 Admin

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| A-01 | Dashboard | `/admin` | GMV, comisión, pedidos activos, cancelación y alertas. | P0 |
| A-02 | Pedidos | `/admin/orders` | Tabla con filtros por estado, texto y fecha. | P0 |
| A-03 | Cancelar pedido | Acción “Cancelar” en pedido activo | Estado cancelado; evento registrado. | P1 |
| A-04 | Reembolsar | Acción “Reembolsar” en pedido pagado | Llama a la pasarela si es Mercado Pago/Transbank; si falla, no marca reembolsado. Efectivo/mock quedan manuales. | P1 |
| A-05 | Verificar local | Locales → Verificar | Local activo y visible en home. | P0 |
| A-06 | Suspender local | Locales → Suspender | Local oculto; dueño no puede operar. | P1 |
| A-07 | Verificar repartidor | Repartidores → Verificar | Repartidor puede conectarse. | P0 |
| A-08 | Suspender repartidor | Repartidores → Suspender | Repartidor offline y sin acceso. | P1 |
| A-09 | Alertas | Dashboard con pedidos atascados | “Requieren atención” muestra pedidos >5/15 min. | P1 |
| A-10 | Auditoría | Acciones admin | Se registran en `AuditLog` (verificar en base). | P2 |
| A-11 | Health | `GET /api/health` | `{ ok: true, service: "mesacerca", db: "ok", timestamp }`, sin datos de pasarela. | P1 |
| A-12 | Cron | `GET /api/cron/orders` con `Authorization: Bearer $CRON_SECRET` | Expira pagos >15 min y cancela pedidos sin respuesta >5 min. Rechaza el secreto por query. | P1 |

---

### 6.6 Seguridad

| ID | Caso | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|
| S-01 | CORS | Request con `Origin: https://evil.example` | Mutaciones `403`; GET sin `Access-Control-Allow-Origin`. | P0 |
| S-02 | PIN lockout | 5 PIN incorrectos en pedido asignado | `429` y bloqueo 15 min; no se entrega. | P0 |
| S-03 | Doble aceptación | Dos repartidores aceptan el mismo pedido en paralelo | Uno `200`; el otro `409`. | P0 |
| S-04 | Privacidad de oferta | `GET /api/courier` como repartidor | Sin dirección exacta, lat/lng, instrucciones ni ítems. | P0 |
| S-05 | Privacidad post-entrega | `GET /api/orders/:id` de pedido entregado | Teléfono y ubicación del repartidor en `null`. | P1 |
| S-06 | Upload | Archivo falso, >5 MB o dimensiones excesivas | `415`/`413`; no reemplaza portada. | P1 |
| S-07 | Estado admin | Admin intenta `PATCH DELIVERED` por API | `409`; solo acciones auditadas. | P0 |
| S-08 | Rate limit | 8 logins fallidos con `X-Forwarded-For` variable | `429` tras 5; no evade con cabecera. | P0 |
| S-09 | Open redirect | Login con `next=/\evil.example` | Redirige al home, no a dominio externo. | P1 |
| S-10 | Config producción | `NODE_ENV=production` con mock/http/demo | El servidor falla al iniciar. | P0 |
| S-11 | Idempotencia | Dos `POST /api/orders` con el mismo `clientRequestId` | Ambos `200`, mismo pedido, sin `500`. | P1 |
| S-12 | Cron | Sin auth / secreto por query / header correcto | `401` / `401` / `200`. | P1 |

---

## 7. Flujos end-to-end

### E2E-01 — Ciclo completo con repartidor

**Objetivo:** validar todo el recorrido operativo.

1. **Crear cocina**
   - `/registro/local`.
   - Nombre, email y teléfono únicos.
   - Comuna: Providencia.
   - Cocina: Chilena.
   - Resultado: `/merchant`, estado Pendiente.

2. **Cargar menú**
   - `/merchant/menu`.
   - Crear 3 platos (2 en Recomendados, 1 en Bebidas).
   - Resultado: platos visibles.

3. **Verificar cocina y repartidor**
   - Admin → Locales → Verificar.
   - Admin → Repartidores → Verificar a un repartidor nuevo en Ñuñoa.
   - Resultado: ambos “Verificados”.

4. **Conectar repartidores**
   - Repartidor A (nuevo, Ñuñoa): Conectarme.
   - Repartidor B (`courier2@mesacerca.cl`, Huechuraba): Conectarme.
   - Resultado: ambos “Conectados”.

5. **Pedido cliente**
   - Cliente busca la cocina por nombre.
   - Agrega 2 productos.
   - Checkout: delivery, dirección en Ñuñoa, **Efectivo al recibir**, sin propina.
   - Resultado: pedido `PENDING_MERCHANT`, pago pendiente, código `MES-XXXXXX`.

6. **Cocina recibe**
   - `/merchant`.
   - Esperar ≤5 s.
   - Resultado: tarjeta en “Nuevos”, aviso sonoro/banner.

7. **Cocina opera**
   - Aceptar → Empezar preparación → Marcar listo → Solicitar repartidor.
   - Resultado: “Buscando repartidor”.

8. **Publicación a repartidores**
   - A y B ven el pedido.
   - A debe mostrar **menor distancia al local** que B.
   - Resultado: A ~3 km, B ~7–8 km.

9. **Aceptación**
   - A presiona “Aceptar pedido”.
   - Resultado: A entra a “Entrega activa”; B deja de verlo tras ≤10 s.

10. **Entrega**
    - A: “Confirmar retiro en local”.
    - Cliente: ve PIN de 4 dígitos.
    - A: “Confirmar entrega” + PIN.
    - Resultado: pedido **Entregado**, pago efectivo **Pagado**.

11. **Calificación**
    - Cliente: 5 estrellas + comentario.
    - Resultado: “Ya calificaste este pedido”.

12. **Post-operación**
    - Cliente `/orders`: pedido entregado.
    - Local `/merchant/analytics`: pedido y GMV.
    - Repartidor `/courier/earnings`: pedido y pago.
    - Admin `/admin/orders`: entregado y pagado.

**Criterio de éxito:** todos los pasos sin errores de consola y con estados coherentes.

---

### E2E-02 — Retiro en local

1. Cliente elige “Retiro en local”.
2. Cocina acepta, prepara y marca listo.
3. Cocina presiona “Cliente retiró”.
4. Resultado: pedido entregado, sin repartidor y sin costo de envío.

---

### E2E-03 — Reparto propio

1. Cliente pide delivery.
2. Cocina acepta, prepara y marca listo.
3. Cocina elige “Salió a entregar” (no solicita repartidor).
4. Cocina marca “Entregado”.
5. Resultado: pedido entregado; no aparece a repartidores; comisión del local corresponde al plan.

---

### E2E-04 — Cancelación por cliente

1. Cliente crea pedido con efectivo.
2. Sin que la cocina acepte, cliente pulsa “Cancelar pedido” y confirma.
3. Resultado: “Cancelado por cliente”, pago “Cancelado”/sin cobro.
4. Admin lo ve en `/admin/orders`.
5. Cocina no lo recibe como pedido activo.

---

### E2E-05 — Rechazo por local

1. Cliente crea pedido.
2. Cocina pulsa “Rechazar”.
3. Resultado: “Cancelado por local”; cliente lo ve en tracking.
4. Si el pago estaba aprobado, admin puede reembolsar.

---

## 8. Pagos

### 8.1 Modos

| Modo | Configuración | Uso |
|---|---|---|
| **mock** | `PAYMENTS_MODE="mock"` | Demo local; no cobra. |
| **sandbox** | `PAYMENTS_MODE="sandbox"` + credenciales | Pruebas con tarjetas de prueba. |
| **production** | `PAYMENTS_MODE="production"` + credenciales | Cobro real; solo con autorización. |

### 8.2 Pruebas

| ID | Caso | Resultado esperado |
|---|---|---|
| PAY-01 | Efectivo | Pedido pendiente de pago; al entregar pasa a Pagado. |
| PAY-02 | Mock Mercado Pago | Pedido pagado sin salir a pasarela; proveedor `MOCK`. |
| PAY-03 | Mock Transbank | Pedido pagado sin salir a pasarela; proveedor `MOCK`. |
| PAY-04 | Mercado Pago sandbox | Redirección a Checkout Pro; webhook confirma pago. |
| PAY-05 | Transbank integración | Redirección a Webpay; retorno confirma pago. |
| PAY-06 | Pago rechazado | Pedido queda pendiente/fallido; se puede reintentar. |
| PAY-07 | Webhook duplicado | No duplica el pago ni el evento. |
| PAY-08 | Reembolso admin | Pedido y pago pasan a Reembolsado. |

> **No usar tarjetas reales.** Usar tarjetas de prueba de Mercado Pago/Transbank.

### 8.3 Configuración

```env
PAYMENTS_MODE="mock"          # desarrollo
# PAYMENTS_MODE="sandbox"     # pruebas de pasarela
# PAYMENTS_MODE="production"  # cobro real
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
TRANSBANK_COMMERCE_CODE=""
TRANSBANK_API_KEY=""
TRANSBANK_ENVIRONMENT="integration"
```

---

## 9. Notificaciones y tiempo real

| ID | Caso | Resultado esperado |
|---|---|---|
| N-01 | Pedido nuevo en cocina | Aparece en ≤5 s; banner y sonido. |
| N-02 | Cocina acepta | Cliente ve cambio en ≤5 s. |
| N-03 | Pedido listo | Repartidores lo ven en ≤5 s. |
| N-04 | Repartidor asignado | Cliente ve repartidor y PIN. |
| N-05 | Pedido entregado | Cliente ve “Entregado” en ≤5 s. |
| N-06 | Dos pestañas | Ambas se actualizan; no duplican acciones. |

> La plataforma usa **polling cada 5 s**, no WebSockets ni push nativo.

---

## 10. Seguridad y permisos

| ID | Caso | Resultado esperado |
|---|---|---|
| S-01 | Cliente abre `/merchant` | Redirige a `/` o login. |
| S-02 | Cliente abre `/admin` | Redirige a `/`. |
| S-03 | Local abre `/courier` | Redirige a `/merchant`. |
| S-04 | Repartidor abre `/admin` | Redirige a `/courier`. |
| S-05 | Sin sesión abre `/orders` | Redirige a login con `next`. |
| S-06 | Sin sesión llama API de pedidos | 401. |
| S-07 | Cliente A intenta abrir pedido de cliente B | 404/403. |
| S-08 | Usuario suspendido recarga | Sesión inválida. |
| S-09 | Local suspendido no aparece en home | 0 resultados. |
| S-10 | Repartidor no verificado intenta aceptar | 403. |
| S-11 | Webhook sin firma (producción) | 401. |
| S-12 | PIN incorrecto | 400, pedido no entregado. |

---

## 11. Responsive, PWA y accesibilidad

### 11.1 Responsive

| ID | Viewport | Resultado |
|---|---|---|
| RWD-01 | 390×844 (móvil) | Header, menú, carrito y checkout usables. |
| RWD-02 | 768×1024 (tablet) | Grillas de 2 columnas; sin overflow. |
| RWD-03 | 1440×900 (desktop) | Sidebar y tableros completos. |
| RWD-04 | Zoom 200% | Texto legible; sin cortes críticos. |

### 11.2 PWA

- [ ] `manifest.webmanifest` responde.
- [ ] Icono y nombre correctos.
- [ ] En build de producción se registra `sw.js`.
- [ ] La app se puede instalar.
- [ ] No se promete funcionamiento offline (el service worker no cachea pedidos).

### 11.3 Accesibilidad

- [ ] Navegación con Tab y Enter.
- [ ] Foco visible en botones e inputs.
- [ ] Labels asociados a campos.
- [ ] Contraste AA en textos principales.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Botones táctiles ≥44×44 px en móvil.
- [ ] No se usa color como único indicador de estado.

**Limitación conocida:** las imágenes de platos son fondos CSS sin texto alternativo. Es una brecha P2.

---

## 12. Rendimiento

| ID | Caso | Objetivo |
|---|---|---|
| PERF-01 | Home en producción | < 2,5 s en 4G. |
| PERF-02 | API de pedidos | p95 < 400 ms. |
| PERF-03 | Tracking | Actualización < 5 s. |
| PERF-04 | 100 pedidos/hora | Sin errores 5xx. |
| PERF-05 | Build | `npm run build` sin errores. |

> El servidor de desarrollo no es representativo. Medir con `npm run build && npm run start`.

---

## 13. Pruebas automatizadas

### 13.1 Comandos

```bash
# Servidor corriendo en localhost:3000
node scripts/smoke.mjs             # login + flujo cliente de los 4 roles
node scripts/smoke-register.mjs    # registro cliente/local/repartidor
node scripts/qa-e2e.mjs            # ciclo completo con cocina y repartidor nuevos
node scripts/audit-routes.mjs      # 27 rutas: status, contenido y errores
node scripts/cleanup-qa.mjs        # limpia corridas QA antiguas
```

### 13.2 Requisitos

```bash
npm install -D playwright
npx playwright install firefox
```

### 13.3 Evidencia

- `assets/screenshots/qa-e2e/<suffix>/`
- `/tmp/opencode/qa-e2e-<suffix>.json`
- `/tmp/opencode/mesacerca-route-audit.json`

### 13.4 Interpretación

- `qa-e2e.mjs` crea datos reales; no ejecutar en producción.
- `audit-routes.mjs` espera 27 rutas; si se agregan páginas, actualizar la lista.
- La advertencia de hidratación de Firefox/Playwright no es un fallo funcional.

---

## 14. Criterios de salida

La plataforma se considera **apta para piloto** si:

- [ ] 100% de casos **P0** pasan.
- [ ] ≥95% de casos **P1** pasan.
- [ ] No hay bugs **críticos** ni **altos** abiertos.
- [ ] E2E-01, E2E-02, E2E-03 y E2E-04 pasan.
- [ ] Pago efectivo y mock pasan; sandbox validado si se va a cobrar.
- [ ] 27 rutas responden 200.
- [ ] `npm run build` y `npm run lint` pasan.
- [ ] Admin puede verificar locales y repartidores.
- [ ] Cancelación y reembolso funcionan.
- [ ] No hay datos demo en producción.

**No es apta para producción** hasta completar:

- PostgreSQL, KYC, boleta electrónica, seguros, notificaciones, revisión legal, dominio y credenciales de pago.

---

## 15. Registro de resultados

| ID | Caso | Resultado | Evidencia | Notas |
|---|---|---|---|---|
| P-01 | Home | PASS/FAIL | captura | |
| C-15 | Pago efectivo | PASS/FAIL | captura | |
| L-16 | Solicitar repartidor | PASS/FAIL | captura | |
| R-11 | Entrega con PIN | PASS/FAIL | captura | |
| A-05 | Verificar local | PASS/FAIL | captura | |
| E2E-01 | Ciclo completo | PASS/FAIL | captura | |

---

## 16. Reporte de bug

```md
## [ID] Título breve

- **Severidad:** Crítica / Alta / Media / Baja
- **Prioridad:** P0 / P1 / P2
- **Rol:** Cliente / Local / Repartidor / Admin
- **Ambiente:** localhost / sandbox / producción
- **Pedido:** MES-XXXXXX
- **Fecha/hora:**
- **Navegador:**

### Pasos
1.
2.
3.

### Esperado


### Actual


### Evidencia
- Captura:
- Consola:
- API:

### Notas
```

---

## 17. Limitaciones conocidas

- PostgreSQL con TLS en desarrollo y producción; producción requiere backups/PITR.
- Pagos en **mock** por defecto; faltan credenciales productivas.
- Sin KYC automático; verificación manual.
- Sin boleta electrónica ni conciliación SII.
- Sin notificaciones push nativas ni WhatsApp.
- Sin chat cliente-repartidor.
- Sin apps nativas.
- Sin recuperación de contraseña ni verificación de email.
- Sin rate limiting ni WAF.
- Sin tests de carga.
- Sin seguro de repartidores.
- Cobertura limitada a Santiago (34 comunas en selector).
- Mapas con tiles públicos de Esri; revisar términos para producción.
- PWA mínima; no cachea pedidos offline.
- Imágenes de platos como fondo CSS sin alt.

---

## 18. Anexos

### 18.1 Rutas

| Ruta | Rol | Esperado |
|---|---|---|
| `/` | Público | Home |
| `/store/[slug]` | Público | Menú |
| `/login` | Público | Login |
| `/register` | Público | Registro cliente |
| `/registro/local` | Público | Registro local |
| `/registro/repartidor` | Público | Registro repartidor |
| `/checkout` | Cliente | Checkout |
| `/orders` | Cliente | Historial |
| `/order/[id]` | Cliente/Local/Repartidor/Admin | Tracking |
| `/merchant` | Local | Panel |
| `/merchant/menu` | Local | Menú |
| `/merchant/analytics` | Local | Analítica |
| `/courier` | Repartidor | Ruta |
| `/courier/earnings` | Repartidor | Ganancias |
| `/admin` | Admin | Resumen |
| `/admin/orders` | Admin | Pedidos |
| `/admin/merchants` | Admin | Locales |
| `/admin/couriers` | Admin | Repartidores |
| `/api/health` | Público | Health |
| `/api/cron/orders` | Sistema | Cron |

### 18.2 Máquina de estados

```
PENDING_PAYMENT
  → PENDING_MERCHANT (pago confirmado)
  → EXPIRED (cron 15 min)

PENDING_MERCHANT
  → ACCEPTED (local)
  → CANCELLED_BY_MERCHANT (local)
  → CANCELLED_BY_CUSTOMER (cliente)

ACCEPTED → PREPARING (local)
PREPARING → READY (local)

READY
  → PENDING_COURIER (local)
  → OUT_FOR_DELIVERY (reparto propio)
  → DELIVERED (retiro)

PENDING_COURIER
  → COURIER_ASSIGNED (repartidor)
  → OUT_FOR_DELIVERY (local)

COURIER_ASSIGNED → PICKED_UP (repartidor)
PICKED_UP → DELIVERED (repartidor)
OUT_FOR_DELIVERY → DELIVERED (local)

DELIVERED
  → REVIEWED (cliente)
  → REFUNDED (admin)
```

### 18.3 Comandos útiles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:reset
npm run db:seed
npm run db:studio
node scripts/qa-e2e.mjs
node scripts/audit-routes.mjs
node scripts/cleanup-qa.mjs
```

### 18.4 App móvil

La app Expo/React Native está en `mobile/`. Runbook: `docs/14-app-movil.md`.

| ID | Caso | Resultado esperado |
|---|---|---|
| M-01 | Login cliente | Entra al home móvil con tabs Inicio/Pedidos/Cuenta. |
| M-02 | Home | Búsqueda, comunas, cocinas y tarjetas visibles. |
| M-03 | Local y carrito | Menú, modificadores, agregar y subtotal correcto. |
| M-04 | Checkout efectivo | Pedido creado y tracking abierto. |
| M-05 | Tracking | Timeline, PIN, repartidor y cancelación si aplica. |
| M-06 | Login repartidor | Entra a tabs Mi ruta/Ganancias/Cuenta. |
| M-07 | Conexión | Botón Conectarme cambia a Conectado. |
| M-08 | Pedidos disponibles | Distancia al local, pago y botón Aceptar. |
| M-09 | Retiro | Confirmar retiro cambia a En camino. |
| M-10 | Entrega | PIN correcto marca Entregado; PIN incorrecto falla. |
| M-11 | Ganancias | La entrega aparece en el detalle de 30 días. |

Comandos:

```bash
cd mobile
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

### 18.5 Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL con TLS (`sslmode=verify-full`) |
| `AUTH_SECRET` | Firma de sesión |
| `NEXT_PUBLIC_APP_URL` | URL pública |
| `NEXT_PUBLIC_DEMO_MODE` | Cuentas demo en login |
| `PAYMENTS_MODE` | `mock`, `sandbox`, `production` |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | Firma webhook |
| `TRANSBANK_COMMERCE_CODE` | Transbank |
| `TRANSBANK_API_KEY` | Transbank |
| `TRANSBANK_ENVIRONMENT` | `integration`/`production` |
| `CRON_SECRET` | Protección del cron |

---

> **Regla de oro:** si un pedido no puede completar el ciclo “crear → aceptar → preparar → publicar → aceptar reparto → retirar → entregar → calificar”, la plataforma no está lista para el piloto.
