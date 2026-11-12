# Decisiones de arranque

> **Actualización 07/11/2026:** el dueño confirmó MesaCerca, Santiago completo, MVP para clientes reales, Mercado Pago + Transbank y web/PWA primero. Las decisiones de abajo quedan como registro; las pendientes son de producción, no de producto.

---

## 1. Defaults recomendados

| # | Decisión | Default recomendado | Por qué |
|---|---|---|---|
| 1 | **Nombre** | MesaCerca (provisional) | Corto, cálido, gastronómico, no atado a “delivery” |
| 2 | **Mercado piloto** | Santiago: Ñuñoa, Providencia, Santiago Centro | Densidad, hábito de delivery, distancias cortas |
| 3 | **Alcance 3 días** | MVP demo end-to-end + deploy | Demostrable y vendible; no prometer producción |
| 4 | **Canal** | Web responsive + PWA | Rápido; apps nativas en fase 2 |
| 5 | **Pagos** | Mercado Pago sandbox | Integración rápida; producción después |
| 6 | **Stack** | Next.js + PostgreSQL + Prisma + Tailwind/shadcn | Velocidad y ecosistema |
| 7 | **Realtime** | Ably/Pusher (o polling de respaldo) | Evita operar WebSockets |
| 8 | **Mapas** | MapLibre + OSM + OSRM | Costo cero en MVP |
| 9 | **Comisión** | Cocina 12%, Híbrido 17%, Full 22% + IVA | Competitiva y sostenible |
| 10 | **Logística** | Híbrida: propio + freelance | Diferenciador central |
| 11 | **Repartidores** | Independientes con contrato y seguro | Ley 21.431 |
| 12 | **Idioma** | Español Chile | Mercado local |

---

## 2. Decisiones confirmadas

1. **Nombre:** MesaCerca.
2. **Mercado:** Santiago completo.
3. **Alcance:** MVP para clientes reales.
4. **Pagos:** Mercado Pago + Transbank + efectivo.
5. **Canal:** web/PWA primero, apps nativas después.

Pendientes de producción: dominio, credenciales de pago, PostgreSQL, KYC, boleta electrónica, seguros y revisión legal.

---

## 3. Qué pasa después

### Inmediato (Día 1)

- Scaffold del proyecto.
- Modelo de datos.
- Seed de 8 locales y 40 platos.
- Home + menú + carrito + checkout.

### Día 2

- Panel local.
- PWA repartidor.
- Dispatch.
- Tracking.

### Día 3

- Admin.
- Pagos sandbox.
- Tests.
- Deploy.
- Demo.

---

## 4. Lo que no se decide ahora

- Marca definitiva y registro.
- Sociedad y aspectos tributarios.
- Oficina/operación física.
- Contratación de equipo.
- Presupuesto de marketing.
- Expansión a otras ciudades.

Se resuelven antes del piloto real, no antes del MVP.

---

## 5. Regla

> **Ninguna decisión de marca o legal debe retrasar el flujo “pedir → preparar → entregar”.**
>
> El nombre se puede cambiar. El código y la operación, no.
