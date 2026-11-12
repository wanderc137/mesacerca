# Diseño y experiencia

> **Referencia estética:** Binance. **Regla:** inspirarse en el lenguaje, no copiar marca, logo ni assets.
> **Objetivo:** que la plataforma se sienta seria, rápida y confiable desde el primer clic.

---

## 1. Principios de diseño

1. **Operación primero.** Cada pantalla responde: ¿qué está pasando y qué debo hacer ahora?
2. **Densidad con orden.** Más información, menos ruido. Jerarquía clara, sin decoración.
3. **Sin sorpresas.** El precio y el estado siempre están visibles.
4. **Tiempo real.** El usuario no recarga; la interfaz se actualiza.
5. **Una mano.** El repartidor usa la app mientras se mueve: botones grandes, texto claro.
6. **Confianza.** Fotos reales, verificaciones, ratings, evidencia.
7. **Accesibilidad.** Contraste, foco, tamaños, movimiento reducido.
8. **Consistencia.** Un solo sistema de tokens y componentes.

---

## 2. Identidad visual

### 2.1 Marca

- **Nombre:** MesaCerca.
- **Símbolo:** llama geométrica formada por tres trazos que también sugieren una ruta/pin.
- **Wordmark:** sans geométrica, minúsculas, tracking ajustado.
- **Uso:** amarillo sobre negro; negro sobre amarillo; monocromo.
- **Tono:** cálido, directo, sin humor forzado.

### 2.2 Paleta

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#0B0E11` | Fondo principal |
| `--surface` | `#1E2329` | Tarjetas, paneles |
| `--surface-2` | `#181D24` | Filas, inputs |
| `--surface-3` | `#2B3139` | Hover, bordes |
| `--border` | `#2B3139` | Bordes sutiles |
| `--text` | `#EAECEF` | Texto principal |
| `--text-muted` | `#848E9C` | Texto secundario |
| `--primary` | `#F0B90B` | Acción principal, marca |
| `--primary-hover` | `#F8D12F` | Hover |
| `--primary-ink` | `#0B0E11` | Texto sobre amarillo |
| `--success` | `#0ECB81` | Éxito, entregado |
| `--danger` | `#F6465D` | Error, cancelado |
| `--warning` | `#F0B90B` | Advertencia |
| `--info` | `#1E88E5` | Información |
| `--ember` | `#FF7A1A` | Acento cálido secundario |
| `--focus` | `#F0B90B` | Anillo de foco |

**Regla:** el amarillo se usa con moderación. Si todo es amarillo, nada es importante.

### 2.3 Tipografía

| Rol | Fuente | Peso | Tamaño |
|---|---|---|---|
| Display | Manrope | 700/800 | 32–48 px |
| Títulos | Manrope | 600/700 | 20–28 px |
| Cuerpo | Inter | 400/500 | 14–16 px |
| UI pequeña | Inter | 500 | 12–13 px |
| Números | JetBrains Mono | 500/700 | 14–32 px, tabular |

**Alternativa:** IBM Plex Sans + IBM Plex Mono para un tono más corporativo.

### 2.4 Espaciado y radios

- Base: 4 px.
- Escala: 4, 8, 12, 16, 24, 32, 48, 64.
- Radios: 6 px inputs, 8 px tarjetas, 12 px modales, 999 px pills.
- Bordes: 1 px `--border`.
- Sombras: `0 1px 2px rgba(0,0,0,.4)`; sin sombras difusas grandes.

### 2.5 Grid

- Desktop: 12 columnas, max 1440 px, gutter 24 px.
- Tablet: 8 columnas, gutter 16 px.
- Mobile: 4 columnas, gutter 16 px.
- Layout cliente: contenido centrado + carrito sticky.
- Layout local/admin: sidebar 240 px + contenido.
- Layout repartidor: una columna, acciones fijas abajo.

### 2.6 Iconografía

- Lucide, stroke 1.5 px.
- Tamaños: 16, 20, 24.
- No mezclar familias.
- Iconos de estado: círculo, check, reloj, moto, bolsa.

### 2.7 Movimiento

- 150 ms para hover/focus.
- 200 ms para modales/drawers.
- `ease-out`.
- Respetar `prefers-reduced-motion`.
- Sin animaciones de carga infinitas; usar skeletons.

---

## 3. Componentes base

### 3.1 Botones

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| Primary | `--primary` | `--primary-ink` | Pagar, aceptar, entregar |
| Secondary | `--surface` | `--text` | Acciones secundarias |
| Ghost | transparente | `--text-muted` | Cancelar, volver |
| Danger | `--danger` | blanco | Cancelar pedido, reportar |
| Success | `--success` | negro | Confirmar entrega |

- Altura: 40 px (md), 48 px (lg), 32 px (sm).
- Radio: 6 px.
- Focus ring visible.
- Loading con spinner + texto.

### 3.2 Inputs

- Fondo `--surface-2`.
- Borde `--border`; focus `--primary`.
- Label arriba, helper abajo.
- Error en `--danger`.
- Moneda CLP con separador de miles.
- Teléfono con prefijo +56.
- Dirección con autocompletado.

### 3.3 Tarjetas

- Fondo `--surface`.
- Borde `--border`.
- Padding 16–24 px.
- Título 14–16 px, subtítulo muted.
- Acción alineada a la derecha.
- Hover sutil.

### 3.4 Tablas

- Header sticky.
- Filas 48–56 px.
- Zebra opcional.
- Columnas numéricas a la derecha, mono.
- Acciones en menú de tres puntos.
- Empty state con acción.

### 3.5 Badges

- `Pedido nuevo` amarillo.
- `En preparación` azul.
- `Listo` verde.
- `En reparto` violeta.
- `Entregado` verde suave.
- `Cancelado` rojo.
- `Pendiente` gris.

### 3.6 Timeline

- Vertical en mobile, horizontal en desktop.
- Paso completado: check verde.
- Paso actual: pulso amarillo.
- Paso pendiente: gris.
- Hora y actor.

### 3.7 Mapas

- Tema oscuro.
- Marcador local: amarillo.
- Marcador cliente: verde.
- Marcador repartidor: blanco con borde amarillo.
- Ruta: línea amarilla punteada.
- Controles grandes, sin saturación.

### 3.8 Gráficos

- Líneas finas, sin gradientes.
- Colores: amarillo, verde, rojo, gris.
- Tooltip oscuro.
- Ejes discretos.
- Números tabulares.

---

## 4. Layouts por rol

### 4.1 Cliente (web/PWA)

```
┌─────────────────────────────────────────────┐
│ Logo  Ubicación ▾   Buscar...   Pedidos  👤 │
├─────────────────────────────────────────────┤
│ Hero: "Comida local, a tu puerta"           │
│ Categorías: 🍕 🍣 🥗 🍔 🍰 ☕               │
│                                             │
│ Cerca de ti                          Ver → │
│ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ Local  │ │ Local  │ │ Local  │           │
│ └────────┘ └────────┘ └────────┘           │
│                                             │
│ Promocionados (etiquetados)                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Local destacado                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Mobile:** header compacto, bottom nav (Inicio, Buscar, Pedidos, Perfil), carrito sticky.

### 4.2 Local (dashboard)

```
┌──────────┬──────────────────────────────────┐
│ Logo     │ Pedidos en vivo        🔔  👤    │
│          ├──────────────────────────────────┤
│ Resumen  │ KPI  KPI  KPI  KPI               │
│ Pedidos  ├──────────────────────────────────┤
│ Menú     │ Nuevos │ Preparando │ Listos     │
│ Finanzas │ ┌─────┐│ ┌─────┐   │ ┌─────┐   │
│ Ajustes  │ │Card ││ │Card │   │ │Card │   │
│          │ └─────┘│ └─────┘   │ └─────┘   │
└──────────┴──────────────────────────────────┘
```

**Kanban de pedidos:** columnas `Nuevo`, `Preparando`, `Listo`, `En reparto`. Cada tarjeta muestra código, cliente, items, total, tiempo y acción principal.

### 4.3 Repartidor (PWA)

```
┌─────────────────────────────┐
│  ● Conectado       $12.400  │
│                             │
│  ┌───────────────────────┐  │
│  │  OFERTA               │  │
│  │  Local: La Cocina     │  │
│  │  2,3 km · 18 min      │  │
│  │  $2.450 + propina     │  │
│  │  [Aceptar]  [Rechazar]│  │
│  └───────────────────────┘  │
│                             │
│  Mapa                       │
│                             │
│  [Inicio] [Ganancias] [👤]  │
└─────────────────────────────┘
```

**Regla:** la oferta ocupa la pantalla; el botón de aceptar es grande y está a la altura del pulgar.

### 4.4 Admin

```
┌──────────┬──────────────────────────────────┐
│ Logo     │ Operación en vivo                │
│ Resumen  │ ┌─────┬─────┬─────┬─────┐        │
│ Pedidos  │ │ GMV │ Ped │ SLA │ Canc│        │
│ Locales  │ └─────┴─────┴─────┴─────┘        │
│ Repart.  │ Tabla de pedidos + filtros       │
│ Finanzas │ Mapa de calor de zonas           │
│ Ajustes  │ Alertas                          │
└──────────┴──────────────────────────────────┘
```

---

## 5. Pantallas

### 5.1 Cliente

| Pantalla | Contenido | Acción principal |
|---|---|---|
| Home | Ubicación, búsqueda, categorías, locales, promos | Elegir local |
| Local | Cover, rating, tiempo, envío, menú, fotos | Agregar plato |
| Plato | Foto, descripción, modificadores, cantidad | Agregar al carrito |
| Carrito | Items, cantidades, notas, subtotal | Ir a checkout |
| Checkout | Dirección, entrega/retiro, horario, pago, propina, desglose | Pagar |
| Confirmación | Código, resumen, ETA | Ver tracking |
| Tracking | Mapa, timeline, repartidor, soporte | Contactar |
| Historial | Pedidos, estados, repetir, calificar | Repetir |
| Perfil | Datos, direcciones, pagos, MesaCerca+ | Guardar |

### 5.2 Local

| Pantalla | Contenido | Acción principal |
|---|---|---|
| Onboarding | Datos, documentos, local, horarios, logística | Enviar verificación |
| Resumen | KPIs, pedidos del día, alertas | Ver pedidos |
| Pedidos | Kanban + detalle + historial | Aceptar/preparar/listo |
| Detalle pedido | Items, cliente, notas, timeline, courier | Avanzar estado |
| Menú | Categorías, platos, modificadores, stock | Editar |
| Finanzas | Ventas, comisión, pagos, facturas | Descargar |
| Analítica | Ventas, AOV, top platos, tiempos | Filtrar |
| Ajustes | Horarios, zonas, modos, pausas | Guardar |

### 5.3 Repartidor

| Pantalla | Contenido | Acción principal |
|---|---|---|
| Onboarding | Identidad, vehículo, documentos, banco | Enviar |
| Inicio | Conexión, ganancias, zona, incentivos | Conectarse |
| Oferta | Local, distancia, pago, ETA, countdown | Aceptar |
| Entrega activa | Mapa, pasos, contacto, soporte | Confirmar |
| Prueba | PIN, foto, geofence, notas | Entregar |
| Ganancias | Hoy, semana, detalle, liquidaciones | Ver detalle |
| Perfil | Datos, documentos, rating, soporte | Editar |

### 5.4 Admin

| Pantalla | Contenido | Acción principal |
|---|---|---|
| Resumen | GMV, pedidos, take rate, SLA, alertas | Filtrar |
| Pedidos | Tabla, filtros, timeline, mapa | Resolver |
| Locales | Verificación, estado, plan, métricas | Aprobar/suspender |
| Repartidores | Verificación, estado, documentos | Aprobar/suspender |
| Disputas | Casos, evidencia, mensajes | Resolver |
| Finanzas | Pagos, liquidaciones, conciliación | Exportar |
| Configuración | Zonas, tarifas, comisiones, promos | Guardar |
| Auditoría | Acciones admin | Revisar |

---

## 6. Microcopy

### 6.1 Cliente

- “Tu pedido está en camino.”
- “El local está preparando tu comida.”
- “Llega entre 19:25 y 19:40.”
- “¿Algo salió mal? Cuéntanos.”
- “Precio final. Sin sorpresas.”
- “Tu propina va completa al repartidor.”

### 6.2 Local

- “Tienes un pedido nuevo.”
- “Acepta en los próximos 3 minutos.”
- “Marca como listo cuando esté empacado.”
- “¿Quién entrega? Tú o la red MesaCerca.”
- “Tu liquidación de esta semana está lista.”

### 6.3 Repartidor

- “Nueva oferta: 2,3 km, $2.450.”
- “Acepta antes de que expire.”
- “Confirma el retiro con el código.”
- “Entrega con PIN o foto.”
- “Tu propina es 100% tuya.”

### 6.4 Errores

- “No pudimos procesar el pago. Intenta de nuevo.”
- “El local cerró justo ahora. Te mostramos alternativas.”
- “No hay repartidores disponibles. El local puede entregar o te devolvemos el dinero.”
- “Tu sesión expiró. Vuelve a ingresar.”

**Regla:** decir qué pasó, por qué y qué hacer. Nunca solo “Error”.

---

## 7. Accesibilidad

- Contraste mínimo 4.5:1 en texto; 3:1 en UI.
- Foco visible en todos los interactivos.
- Navegación por teclado.
- Labels asociados a inputs.
- No usar color como único indicador.
- Texto escalable a 200%.
- `prefers-reduced-motion`.
- Descripciones alt en imágenes.
- Botones con área táctil ≥44×44 px.

---

## 8. Do / Don't

| Do | Don't |
|---|---|
| Usar amarillo para la acción principal | Pintar todo de amarillo |
| Mostrar el desglose de precios | Esconder cargos |
| Usar skeletons | Spinners infinitos |
| Mostrar estado y siguiente paso | Pantallas sin acción |
| Números tabulares | Números que bailan |
| Iconos lineales | Mezclar estilos |
| Espacio en blanco (oscuro) | Saturación |
| Mensajes humanos | Texto robot |

---

## 9. Inspiración Binance (no copia)

| Elemento | Binance | MesaCerca |
|---|---|---|
| Fondo | Negro/grafito | `#0B0E11` |
| Acento | Amarillo | `#F0B90B` |
| Layout | Dashboard denso | Sidebar + cards + tablas |
| Tipografía | BinancePlex | Manrope/Inter |
| Datos | Números grandes | KPIs y precios tabulares |
| Tarjetas | Bordes sutiles | Igual |
| Logo | Rombo | Llama geométrica |
| Tono | Financiero, serio | Gastronómico, serio |

**No usar:** logo, nombre, tipografía propietaria, capturas, iconos registrados ni layouts idénticos. La referencia es el **lenguaje visual**, no la marca.

---

## 10. Entregables de diseño

- Tokens en `globals.css` / `tailwind.config.ts`.
- Componentes base en `components/ui`.
- Mockups de las 4 experiencias.
- Prototipo navegable (Figma o HTML).
- Guía de marca de 1 página.
- Assets: logo SVG, favicon, og-image.
- Checklist de accesibilidad.

**Prioridad:** primero los flujos críticos (pedido, operación, entrega), después el detalle visual.
