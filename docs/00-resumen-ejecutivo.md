# Resumen ejecutivo

## 1. La oportunidad

El delivery de comida en Chile es un mercado de **~US$2.000 millones al año** que sigue creciendo a tasas de dos dígitos. Sin embargo, está concentrado en tres plataformas —Uber Eats, PedidosYa y Rappi— y arrastra una tensión estructural: **las comisiones de 25–30% + IVA asfixian el margen de los locales pequeños**, mientras los repartidores compiten por pedidos y los clientes pagan tarifas que no siempre entienden.

Esa tensión es la puerta de entrada:

- Los restaurantes buscan **canales propios** y alternativas con comisiones más bajas.
- Las cocinerías de barrio y emprendimientos gastronómicos no tienen herramientas digitales serias.
- Los repartidores quieren **ingresos claros, flexibilidad y trato justo**.
- Los clientes de 45–66 años son el segmento que más creció en 2025 y exigen calidad, información y consistencia.
- La autoridad de competencia (FNE) está fiscalizando cláusulas de precio y exclusividad; el mercado se está abriendo.

## 2. La tesis

> Una plataforma de pedidos local, con **comisión baja y transparente**, **logística híbrida** (reparto propio del local o freelance) y **datos del cliente para el local**, puede ganar espacio donde Rappi y PedidosYa son percibidos como caros y opacos.

No competimos por tener “más restaurantes”. Competimos por **ser el canal que más le conviene al local pequeño** y el que mejor trata al repartidor.

## 3. El producto

Cuatro experiencias, un solo sistema:

| Rol | Qué necesita | Qué le damos |
|---|---|---|
| **Cliente** | Descubrir, pedir, pagar, seguir | Web/PWA y app con menú, carrito, checkout, tracking en tiempo real y precios claros |
| **Cocinería** | Vender, operar, cobrar | Onboarding, menú, pedidos en vivo, reparto propio o freelance, analítica y pagos semanales |
| **Repartidor** | Trabajar, ganar, cobrar | App con conexión, ofertas, ruta, prueba de entrega y liquidaciones transparentes |
| **Administración** | Controlar, verificar, resolver | Backoffice con locales, repartidores, pedidos, disputas, tarifas y finanzas |

## 4. Modelo de negocio

Tres planes de local, sin letra chica:

| Plan | Comisión | Logística | Para quién |
|---|---:|---|---|
| **Cocina** | 12% + IVA | Reparto propio del local | Locales con repartidor propio |
| **Híbrido** | 17% + IVA | Propio o freelance | Locales que quieren flexibilidad |
| **Full** | 22% + IVA | Red MesaCerca | Locales sin logística |

Más ingresos por:

- Tarifa de servicio al cliente (6–8%, informada antes de pagar).
- Margen logístico (delivery fee menos costo del repartidor).
- Suscripción **MesaCerca+** (envíos gratis sobre monto mínimo).
- Publicidad etiquetada para locales.
- Analítica y servicios financieros en fases posteriores.

**Ejemplo ilustrativo** (ticket CLP 15.000, plan Híbrido):

| Concepto | CLP |
|---|---:|
| Comisión 17% | 2.550 |
| Tarifa de servicio 6% | 900 |
| Margen logístico | 450 |
| Costo de pago | -635 |
| Soporte/reembolsos | -300 |
| **Contribución por pedido** | **~2.965** |

Con CAC de CLP 4.000 y 3,5 pedidos/mes, el payback ocurre en el primer mes. Para el local, la comisión de 17% + IVA versus 29% + IVA de Rappi representa **~CLP 2.143 de ahorro por pedido**.

## 5. Diferenciación

1. **Comisión baja y transparente**, sin cláusulas de precio mínimo ni exclusividad.
2. **Logística híbrida:** el local decide si entrega él o usa la red freelance.
3. **El local es dueño de su cliente:** puede exportar datos y comunicarse con su base.
4. **Repartidor primero:** tarifa clara, propinas 100% para él, liquidación semanal.
5. **Estética y operación serias:** dashboard Binance-like, no una app juguete.

## 6. MVP de 3 días

Un flujo completo y demostrable:

```
Cliente elige local → arma pedido → paga (sandbox)
        ↓
Local recibe la orden en vivo → acepta → prepara → marca “listo”
        ↓
Local elige: reparto propio o solicitar repartidor
        ↓
Repartidor recibe oferta → acepta → retira → entrega con PIN/foto
        ↓
Cliente sigue el estado → califica
        ↓
Admin ve pedidos, locales, repartidores y métricas
```

**Entregable:** URL pública, 4 roles, datos seed, tracking en tiempo real, diseño responsive/PWA y guion de demo.

**No entra en 3 días:** pagos productivos, KYC, boleta electrónica, apps en stores, seguros, operación 24/7, multi-ciudad.

## 7. Lectura honesta

En 3 días se puede construir un **MVP demostrable y una base técnica seria**. No se puede construir una empresa de delivery lista para competir a escala: eso requiere operación, flota, locales, soporte, cumplimiento y capital. La diferencia entre un demo y un negocio es la ejecución operativa; el software es la parte que sí podemos resolver rápido.

## 8. Próximos hitos

| Horizonte | Hito |
|---|---|
| Día 3 | MVP demo end-to-end con 4 roles y deploy |
| Día 30 | Piloto cerrado con 10 cocinerías y 20 repartidores en 1 comuna |
| Día 60 | 100 pedidos/día, pagos reales, verificación y soporte |
| Día 90 | 300 pedidos/día, 3 comunas, suscripción y publicidad |
| Mes 6 | Segunda ciudad y modelo de unit economics validado |
