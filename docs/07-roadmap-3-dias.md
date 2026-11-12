# Roadmap de 3 días

> **Objetivo:** un MVP demostrable de punta a punta, con 4 roles y una URL pública.
> **No es:** una empresa lista para competir a escala.
> **Regla:** si el tiempo aprieta, se recorta alcance, no calidad del flujo principal.

---

## 1. Lectura honesta

En 3 días de trabajo intensivo se puede construir:

- Una web/PWA con cliente, local, repartidor y admin.
- Un flujo completo de pedido, pago simulado, preparación, asignación, entrega y calificación.
- Tracking en tiempo real.
- Datos seed que hagan la demo creíble.
- Diseño consistente inspirado en Binance.
- Deploy y guion de demo.

No se puede construir:

- Apps nativas publicadas.
- Pagos productivos y boletas.
- KYC automático.
- Operación real con flota.
- Cumplimiento legal completo.
- Escalabilidad para 10.000 pedidos/día.

**Mensaje:** en 3 días tendrás una plataforma que se ve y se siente como un producto real. La empresa se construye después, con operación y clientes.

---

## 2. Precondiciones

Antes de la hora 0:

- [ ] Nombre y dominio decididos (o usar `mesacerca` como placeholder).
- [ ] Cuenta de Vercel/Neon o Supabase.
- [ ] Cuenta de Mercado Pago sandbox.
- [ ] Cuenta de Ably/Pusher (o usar polling).
- [ ] Cuenta de Resend.
- [ ] Repositorio Git.
- [ ] 8–10 locales y 40 platos de ejemplo (nombre, foto, precio).
- [ ] 12 repartidores de ejemplo.
- [ ] 3 comunas y direcciones de prueba.
- [ ] Confirmación de que la demo será web/PWA, no app nativa.

---

## 3. Día 1 — Fundación y experiencia cliente

**Meta:** un cliente puede descubrir un local, armar un pedido y pagar (sandbox).

| Hora | Tarea | Entregable |
|---|---|---|
| 0:00–1:00 | Scaffold Next.js 15, TypeScript, Tailwind, shadcn | App corriendo local |
| 1:00–2:00 | Tokens de diseño, layout, componentes base | Design system mínimo |
| 2:00–4:00 | Prisma + PostgreSQL + schema + migraciones | DB lista |
| 4:00–5:00 | Auth + roles + middleware | Login por email/OTP |
| 5:00–7:00 | Seed: ciudad, comunas, 8 locales, 40 platos, 12 repartidores | Datos creíbles |
| 7:00–9:00 | Home cliente: ubicación, búsqueda, categorías, locales | Home funcional |
| 9:00–11:00 | Página de local: menú, categorías, platos, modificadores | Menú funcional |
| 11:00–12:30 | Carrito + checkout UI + cálculo de precios | Checkout |
| 12:30–14:00 | Creación de pedido + Mercado Pago sandbox + webhook | Pedido pagado |
| 14:00–15:00 | Deploy + pruebas + buffer | URL pública |

**Definition of done Día 1:**

- Se puede navegar home → local → carrito → checkout → pago simulado.
- El pedido queda en DB con estado `PAID`.
- El diseño se ve consistente en desktop y mobile.

---

## 4. Día 2 — Operación local, repartidor y dispatch

**Meta:** el local recibe el pedido, lo prepara y un repartidor lo entrega.

| Hora | Tarea | Entregable |
|---|---|---|
| 0:00–2:00 | Panel local: layout, resumen, kanban de pedidos | Dashboard local |
| 2:00–3:30 | Detalle de pedido: aceptar, preparar, listo | Acciones locales |
| 3:30–4:00 | Realtime para pedidos (Ably/Pusher o polling) | Actualización en vivo |
| 4:00–5:00 | Elección de logística: propio vs freelance | Regla de negocio |
| 5:00–7:00 | PWA repartidor: conexión, oferta, aceptar, estados | App repartidor |
| 7:00–9:00 | Dispatch: candidatos, score, oferta, timeout, reasignación | Asignación |
| 9:00–10:30 | Tracking cliente: mapa, timeline, ETA | Tracking |
| 10:30–11:30 | Notificaciones in-app + push web | Avisos |
| 11:30–13:00 | Prueba de entrega: PIN + foto + geofence | Cierre de entrega |
| 13:00–14:00 | Integración end-to-end + fixes | Flujo completo |
| 14:00–15:00 | Deploy + pruebas | URL actualizada |

**Definition of done Día 2:**

- Un pedido pagado aparece en el local.
- El local acepta, prepara y marca listo.
- El pedido se asigna a un repartidor.
- El repartidor retira y entrega con PIN/foto.
- El cliente ve el estado en tiempo real.

---

## 5. Día 3 — Admin, pagos, pulido y demo

**Meta:** operación completa, métricas, diseño final y demo ensayada.

| Hora | Tarea | Entregable |
|---|---|---|
| 0:00–2:00 | Admin: resumen, pedidos, locales, repartidores | Backoffice |
| 2:00–3:30 | Disputas/cancelaciones/reembolsos básicos | Operación |
| 3:30–5:00 | Métricas: GMV, pedidos, ticket, SLA, take rate | Dashboard |
| 5:00–6:30 | Pulido visual: estados vacíos, errores, responsive | Calidad |
| 6:30–8:00 | Pruebas E2E + fixes | Estabilidad |
| 8:00–9:30 | Datos demo + guion + ensayo | Demo |
| 9:30–11:00 | Deploy final + monitoreo + documentación | Entrega |
| 11:00–12:00 | Buffer + rehearsal | Listo |

**Definition of done Día 3:**

- 4 roles funcionando.
- Demo de 7 minutos sin errores.
- URL pública estable.
- README con credenciales demo.
- Métricas visibles en admin.

---

## 6. Entregables

### 6.1 URLs

| Rol | URL |
|---|---|
| Cliente | `/` |
| Local | `/panel` |
| Repartidor | `/repartidor` |
| Admin | `/admin` |

### 6.2 Cuentas demo

| Rol | Email | Password |
|---|---|---|
| Cliente | `cliente@mesacerca.cl` | `demo1234` |
| Local | `local@mesacerca.cl` | `demo1234` |
| Repartidor | `repartidor@mesacerca.cl` | `demo1234` |
| Admin | `admin@mesacerca.cl` | `demo1234` |

> Cambiar en producción. No usar estas credenciales en un entorno público real.

### 6.3 Datos seed

- 1 ciudad: Santiago.
- 3 comunas: Ñuñoa, Providencia, Santiago Centro.
- 8 locales: cocina chilena, peruana, japonesa, pizza, saludable, cafetería, postres, vegana.
- 40 platos con fotos, descripciones y precios.
- 12 repartidores con ubicaciones.
- 20 pedidos en distintos estados.
- 5 reseñas.

### 6.4 Documentación

- `README.md` con setup y demo.
- `.env.example`.
- Script de seed.
- Script de reset.
- Guion de demo.
- Limitaciones conocidas.

---

## 7. Guion de demo (7 minutos)

### Minuto 0–1: contexto

> “MesaCerca es la infraestructura digital de la cocina local. Comisión desde 12%, logística híbrida y datos para el local.”

### Minuto 1–2: cliente

- Abrir home.
- Elegir “La Cocina de la Abuela”.
- Agregar un plato, modificadores, propina.
- Mostrar desglose de precios.
- Pagar con sandbox.

### Minuto 2–3: local

- Abrir panel del local.
- Mostrar pedido nuevo en vivo.
- Aceptar, preparar, marcar listo.
- Elegir “reparto MesaCerca”.

### Minuto 3–4: repartidor

- Abrir PWA del repartidor.
- Recibir oferta con pago y distancia.
- Aceptar, navegar, confirmar retiro.
- Entregar con PIN/foto.

### Minuto 4–5: cliente tracking

- Volver al cliente.
- Mostrar mapa, timeline y ETA.
- Confirmar entrega.
- Calificar.

### Minuto 5–6: admin

- Abrir admin.
- Mostrar GMV, pedidos, SLA, take rate.
- Abrir el pedido y su timeline.
- Mostrar una disputa resuelta.

### Minuto 6–7: cierre

> “Esto es el MVP. En 30 días lo ponemos en 3 comunas con 30 cocinas y 50 repartidores. La diferencia con Rappi: comisión publicada, logística híbrida y el local dueño de su cliente.”

---

## 8. Qué se simula en la demo

| Elemento | Simulación | Producción |
|---|---|---|
| Pago | Mercado Pago sandbox / botón demo | Webpay/Mercado Pago |
| KYC | Datos precargados | Verificación real |
| Boleta | No emitida | SII |
| Mapas | OSM/MapLibre | Google/Mapbox |
| Notificaciones | In-app + push web | FCM/WhatsApp |
| Repartidores | Seed | Registro real |
| Seguros | No | Póliza |
| Soporte | Admin manual | Mesa de ayuda |
| Apps | PWA | Expo/React Native |

**Regla:** decirlo en la demo. La honestidad genera más confianza que aparentar producción.

---

## 9. Riesgos del plan

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Scope creep | Alta | Congelar alcance del MVP |
| Problemas de pagos | Media | Sandbox + fallback “pagar en efectivo” |
| Realtime inestable | Media | Polling cada 10 s |
| Mapas lentos | Media | Cache de tiles + ubicaciones seed |
| Diseño inconsistente | Media | Tokens y componentes base primero |
| Falta de datos | Baja | Seed realista |
| Tiempo insuficiente | Alta | Priorizar flujo end-to-end sobre features |
| Deploy falla | Media | Deploy desde el Día 1, no al final |
| Credenciales | Baja | `.env` y `.gitignore` |

---

## 10. Post-MVP

### Semana 2

- Pagos reales.
- Verificación de locales.
- Emails transaccionales.
- Analítica de local.
- Corrección de bugs.

### Mes 2

- Apps Expo (cliente/repartidor).
- Push nativo.
- Chat enmascarado.
- Cupones.
- Programa de referidos.
- Multi-zona.

### Mes 3

- Batching.
- Conciliación financiera.
- Observabilidad completa.
- Soporte con SLA.
- Seguros.
- Boleta electrónica.

### Mes 6

- Segunda ciudad.
- Publicidad self-service.
- API/white-label.
- Fintech.

---

## 11. Regla de oro

> **Si un feature no ayuda a que el flujo “pedir → preparar → entregar → cobrar” funcione, no entra en los 3 días.**

El resto es ruido.
