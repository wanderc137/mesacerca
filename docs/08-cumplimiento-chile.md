# Cumplimiento legal y operativo en Chile

> **Advertencia:** este documento es una guía de trabajo, no asesoría legal. Antes de operar con clientes reales, validar con abogado, contador y autoridad sanitaria.

---

## 1. Marco general

| Norma | Materia | Aplica a |
|---|---|---|
| **Ley 21.431** | Trabajo en plataformas digitales | Repartidores |
| **Ley 21.719** | Protección de datos personales | Clientes, locales, repartidores |
| **Ley 19.496** | Protección de consumidores | Clientes |
| **Código Tributario / SII** | IVA, boletas, facturas | Plataforma, locales, repartidores |
| **Reglamento Sanitario de los Alimentos** | Inocuidad | Cocinas y transporte |
| **Ley 19.913** | Prevención de lavado de activos | Pagos, KYC |
| **Ley 20.009** | Fraude con tarjetas | Pagos |
| **Ley 19.628** | Datos personales (vigente hasta transición) | Datos |
| **Código del Trabajo** | Relación laboral | Equipo propio |

---

## 2. Ley 21.431 — plataformas digitales

### 2.1 Qué regula

La ley reconoce dos formas de trabajo en plataformas:

1. **Trabajador dependiente:** contrato de trabajo especial, con subordinación y dependencia.
2. **Trabajador independiente:** prestación de servicios sin subordinación, pero con derechos y obligaciones.

Además, establece criterios comunes:

- Información clara sobre el servicio, pago y condiciones.
- Transparencia de reglas y algoritmos que afectan el trabajo.
- Derecho a desconexión.
- Seguridad y salud.
- Seguridad social.
- Mecanismos de reclamo.
- Registro de la relación.

### 2.2 Riesgo principal

**Clasificar como independiente a alguien que en la práctica está subordinado.** Si la plataforma fija horarios, asigna pedidos obligatorios, sanciona la desconexión o controla la ejecución, un tribunal puede presumir relación laboral.

### 2.3 Cómo mitigarlo

- Contrato de prestación de servicios claro.
- Libertad real de conexión/desconexión.
- Sin exclusividad.
- Sin sanción por rechazar pedidos (más allá de prioridad de asignación).
- Tarifa transparente por servicio.
- Registro de aceptación.
- Seguro de accidentes.
- Canales de reclamo.
- Revisión legal de la clasificación.
- Si se necesita control horario, usar contrato dependiente.

### 2.4 Obligaciones operativas

- [ ] Contrato marco para repartidores.
- [ ] Anexo de tarifas y condiciones.
- [ ] Registro de identidad, licencia y antecedentes.
- [ ] Registro de aceptación de términos.
- [ ] Seguro de accidentes.
- [ ] Mecanismo de desconexión.
- [ ] Política de privacidad y tratamiento de datos.
- [ ] Canal de reclamo y apelación.
- [ ] Registro de pagos y boletas.
- [ ] Capacitación en seguridad vial y manipulación de alimentos (si aplica).

---

## 3. Ley 21.719 — protección de datos

### 3.1 Estado

La ley fue publicada en 2024 y su entrada en vigor se postergó a **2027** mediante proyecto de ley (2026). Aun así, conviene implementar privacy by design desde el MVP.

### 3.2 Principios

- **Licitud y transparencia:** informar qué datos se recogen y para qué.
- **Finalidad:** usar datos solo para el servicio.
- **Minimización:** pedir lo necesario.
- **Exactitud:** permitir corregir.
- **Retención:** no guardar para siempre.
- **Seguridad:** medidas técnicas y organizativas.
- **Responsabilidad:** poder demostrar cumplimiento.

### 3.3 Derechos de las personas

- Acceso.
- Rectificación.
- Supresión.
- Oposición.
- Portabilidad.
- Bloqueo.
- Revocación del consentimiento.

### 3.4 Obligaciones prácticas

- [ ] Política de privacidad clara.
- [ ] Consentimiento explícito para marketing.
- [ ] Registro de actividades de tratamiento.
- [ ] Medidas de seguridad (cifrado, accesos, logs).
- [ ] Procedimiento de brechas.
- [ ] Encargado de protección de datos (DPO) cuando corresponda.
- [ ] Evaluación de impacto para tratamientos de alto riesgo.
- [ ] Contratos con proveedores (encargados de tratamiento).
- [ ] Retención definida: pedidos 5 años (tributario), ubicaciones 90 días, marketing hasta revocación.

### 3.5 Datos sensibles

- No pedir datos de salud, biométricos ni origen étnico.
- Si se piden alergias, tratarlas como dato sensible y con consentimiento.
- No usar datos de ubicación para fines distintos a la entrega.

---

## 4. Ley 19.496 — consumidor

### 4.1 Obligaciones

- Información veraz, suficiente y oportuna.
- Precio total visible antes de pagar.
- Condiciones de entrega y cancelación claras.
- Derecho a retracto en compras a distancia (10 días), con excepciones.
- Garantía legal.
- Atención de reclamos.
- Publicidad veraz.
- Seguridad en el consumo.

### 4.2 Aplicación al delivery

- Mostrar precio de productos, envío, servicio, propina y total.
- Informar tiempo estimado y condiciones.
- Informar política de cancelación y reembolso.
- Permitir reclamo y respuesta.
- No publicar fotos que no correspondan.
- No ocultar que un local está cerrado o un producto agotado.
- Informar alérgenos cuando el local los declare.
- Respetar el derecho a retracto cuando aplique (comida preparada suele tener excepciones; revisar caso a caso).

### 4.3 Recomendaciones

- [ ] Términos y condiciones de cliente.
- [ ] Política de cancelación y reembolso.
- [ ] Canal de reclamos y SLA.
- [ ] Registro de comunicaciones.
- [ ] Libro de reclamos digital (si aplica).
- [ ] Publicidad con precios finales.

---

## 5. Impuestos y facturación

### 5.1 IVA

- Las ventas de comida y el servicio de delivery están afectos a IVA (19%), salvo excepciones.
- La comisión de la plataforma también está afecta a IVA.
- El precio al consumidor debe incluir IVA.
- La factura debe desglosar.

### 5.2 Documentos

| Operación | Documento |
|---|---|
| Venta de comida al cliente | Boleta electrónica del local |
| Comisión de la plataforma | Factura electrónica de MesaCerca al local |
| Pago al repartidor independiente | Boleta de honorarios / factura |
| Pago a proveedores | Factura |
| Suscripción | Boleta/factura |

### 5.3 Proceso

- [ ] Definir quién emite la boleta: el local o la plataforma (modelo de mandato).
- [ ] Integrar proveedor de facturación electrónica (Bsale, Nubox, OpenFactura, SII).
- [ ] Configurar IVA y retenciones.
- [ ] Conciliar pagos vs documentos.
- [ ] Declarar F29 mensual.
- [ ] Emitir factura mensual por comisión.
- [ ] Guardar documentos 6 años.
- [ ] Patente municipal y permisos.

### 5.4 Repartidores

- Si son independientes, deben emitir boleta de honorarios.
- La plataforma puede retener impuestos según corresponda.
- Si son dependientes, se aplica contrato y cotizaciones.
- Documentar el régimen en el contrato.

---

## 6. Inocuidad alimentaria

### 6.1 Requisitos del local

- Resolución sanitaria de la SEREMI de Salud.
- Patente municipal.
- Manipulador de alimentos capacitado.
- Condiciones de higiene y almacenamiento.
- Control de temperaturas.
- Etiquetado y alérgenos.
- Trazabilidad de insumos.
- Agua potable.
- Manejo de residuos.

### 6.2 Transporte

- Mochilas térmicas limpias.
- Separación de crudos y cocidos.
- Tiempo máximo de transporte.
- Control de temperatura cuando aplique.
- Higiene del repartidor.
- No transportar alimentos junto a químicos o mascotas.

### 6.3 Verificación

- [ ] Documento sanitario vigente.
- [ ] Visita presencial a los primeros 30 locales.
- [ ] Fotos de cocina y transporte.
- [ ] Checklist de higiene.
- [ ] Auditoría periódica.
- [ ] Protocolo ante intoxicación.
- [ ] Seguro de responsabilidad civil.

**Regla:** la plataforma no cocina, pero debe verificar y exigir estándares. La confianza es parte del producto.

---

## 7. Pagos y prevención de fraude

### 7.1 Pagos

- Usar pasarela certificada PCI DSS.
- No almacenar datos de tarjeta.
- Checkout hospedado.
- Webhooks firmados.
- Conciliación diaria.
- Reembolsos auditados.
- Límites por usuario.

### 7.2 KYC/AML

- Verificar identidad de locales y repartidores.
- Validar RUT y cuenta bancaria.
- Consultar listas de sanciones.
- Monitorear operaciones inusuales.
- Reportar operaciones sospechosas a la UAF cuando corresponda.
- Guardar respaldos.

### 7.3 Fraude

- Cuentas nuevas con límites.
- Detección de direcciones duplicadas.
- Revisión de reembolsos recurrentes.
- Bloqueo temporal.
- Registro de dispositivos.
- 3D Secure cuando esté disponible.

---

## 8. Seguros

| Riesgo | Cobertura | Quién |
|---|---|---|
| Accidente del repartidor | Seguro de accidentes personales | Plataforma |
| Responsabilidad civil | Daños a terceros | Plataforma/local |
| Contaminación alimentaria | Responsabilidad civil | Local/plataforma |
| Cibernético | Brechas y fraudes | Plataforma |
| Vehículo | Seguro automotriz | Repartidor |
| Incendio/local | Seguro comercial | Local |

**MVP:** al menos seguro de accidentes para repartidores y responsabilidad civil. No operar sin esto.

---

## 9. Contratos y documentos

### 9.1 Cliente

- Términos y condiciones.
- Política de privacidad.
- Política de cookies.
- Política de cancelación/reembolso.
- Reglas de uso.

### 9.2 Local

- Contrato de adhesión.
- Anexo de comisiones y planes.
- Política de menú, precios y disponibilidad.
- Estándares de higiene y tiempos.
- Política de cancelación.
- Autorización de tratamiento de datos.
- Facturación.

### 9.3 Repartidor

- Contrato de prestación de servicios (independiente) o contrato de trabajo (dependiente).
- Anexo de tarifas.
- Política de seguridad vial.
- Código de conducta.
- Autorización de datos y ubicación.
- Seguro.
- Boleta de honorarios.

### 9.4 Proveedores

- Contrato de encargado de tratamiento.
- SLA.
- Seguridad.
- Confidencialidad.
- Continuidad.

---

## 10. Checklist antes del piloto

### Producto y operación

- [ ] Términos y condiciones publicados.
- [ ] Política de privacidad y cookies.
- [ ] Política de cancelación y reembolso.
- [ ] Canal de reclamos.
- [ ] Verificación de locales.
- [ ] Verificación de repartidores.
- [ ] Seguro de repartidores.
- [ ] Protocolo de intoxicación.
- [ ] Protocolo de accidente.
- [ ] Soporte humano.

### Legal y tributario

- [ ] Constitución de sociedad.
- [ ] RUT y régimen tributario.
- [ ] Patente municipal.
- [ ] Contrato de locales.
- [ ] Contrato de repartidores.
- [ ] Revisión Ley 21.431.
- [ ] Revisión Ley 19.496.
- [ ] Revisión Ley 21.719.
- [ ] Proveedor de facturación.
- [ ] Contador.

### Datos y seguridad

- [ ] Registro de tratamiento.
- [ ] Consentimientos.
- [ ] Cifrado.
- [ ] Backups.
- [ ] Control de accesos.
- [ ] Plan de brechas.
- [ ] Retención.
- [ ] DPO cuando corresponda.

### Pagos

- [ ] Pasarela certificada.
- [ ] Conciliación.
- [ ] KYC.
- [ ] Antifraude.
- [ ] Reembolsos.
- [ ] Liquidaciones.

---

## 11. Riesgos legales específicos

| Riesgo | Consecuencia | Mitigación |
|---|---|---|
| Reclasificación laboral | Multas, cotizaciones, indemnizaciones | Contrato y operación independiente real |
| Datos sin consentimiento | Multas, daño reputacional | Privacy by design |
| Publicidad engañosa | SERNAC, multas | Precios y fotos reales |
| Comida en mal estado | Responsabilidad civil, clausura | Verificación y trazabilidad |
| Fraude con tarjetas | Pérdidas, contracargos | PCI, 3D Secure, antifraude |
| Boleta no emitida | Multas SII | Facturación integrada |
| Accidente de repartidor | Responsabilidad | Seguro |
| Cláusulas abusivas | Nulidad, multas | Revisión legal |

---

## 12. Postura recomendada

1. **No lanzar con clientes reales hasta tener contratos, seguros y proveedor de pagos.**
2. **No prometer “0% comisión para siempre”.** Prometer un plan claro y sostenible.
3. **No ocultar que se es nuevo.** La transparencia reduce el riesgo reputacional.
4. **No operar con locales sin resolución sanitaria.**
5. **No pagar a repartidores sin contrato ni boleta.**
6. **No guardar datos que no se necesitan.**
7. **No usar la ubicación para marketing sin consentimiento.**
8. **No copiar términos de otra plataforma.** Redactar y revisar.

---

## 13. Recursos

- Ley 21.431: <https://www.bcn.cl/leychile/navegar?idNorma=1174626>
- Ley 21.719: <https://www.bcn.cl/leychile/navegar?idNorma=1209272>
- Ley 19.496: <https://www.bcn.cl/leychile/navegar?idNorma=61438>
- SII: <https://www.sii.cl/>
- SEREMI de Salud: <https://www.minsal.cl/>
- SERNAC: <https://www.sernac.cl/>
- UAF: <https://www.uaf.cl/>
- Agencia de Protección de Datos (en implementación)

> Verificar siempre la versión vigente y las modificaciones posteriores a la fecha de este documento.
