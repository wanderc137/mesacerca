# KYC real con Didit (free tier)

> Proveedor elegido: **Didit** (<https://didit.me>) por tener sandbox self-serve, API v3, webhooks, SDK React Native y un **free tier real**: $10 de crédito al mes, sin tarjeta, con KYC completo (documento + liveness + face match) a **$0.33 por verificación**. Eso da aproximadamente **30 verificaciones gratis al mes**.

---

## 1. Qué ya está implementado en MesaCerca

- `KycCase` y estados.
- `KYC_PROVIDER=didit` en `lib/kyc.ts`.
- Creación de sesión en `POST https://verification.didit.me/v3/session/`.
- Redirección al flujo hospedado de Didit.
- Callback `/kyc/return`.
- Consulta de decisión (`/v3/session/{id}/decision/`) al volver, para desarrollo sin webhook público.
- Webhook `/api/kyc/webhook` con verificación `X-Signature-V2` / `X-Signature` y timestamp.
- Revisión admin en `/admin/kyc`.
- Bloqueo de verificación de local/repartidor si `KYC_REQUIRED=true` y no hay caso `APPROVED`.

Lo único que falta son **tus credenciales de Didit**.

---

## 2. Crear la cuenta y el workflow

1. Entra a <https://business.didit.me> y crea una cuenta con un **email de trabajo real** (no `@example.com`; Didit rechaza dominios de prueba).
2. Plan **Free**: $10 de crédito/mes, sin tarjeta.
3. Crea una **Application** para MesaCerca. Usa la aplicación de **sandbox** para probar.
4. En **Workflows**, crea un workflow tipo **KYC** con:
   - **ID Verification / OCR**
   - **Liveness activa** (`ACTIVE_3D` o `FLASHING`); no uses solo `PASSIVE` para repartidores.
   - **Face Match**
   - **AML**
   - **Device & IP Analysis** para señales de emulador, root, cámara virtual, VPN y dispositivos duplicados.
   - Opcional: **NFC**, solo después de probarlo con documentos y dispositivos reales.
5. Publica el workflow y copia su **Workflow ID** (UUID). Para el workflow endurecido, ver la sección 11.

## 3. Copiar credenciales

En **Developers → API keys**:

- Copia la API key de sandbox (`sk_test_...`) como `DIDIT_API_KEY`.
- No la pongas en el frontend ni en Git.

En **Developers → Webhooks**:

- Crea un destino:
  - URL: `https://TU_DOMINIO/api/kyc/webhook`
  - Eventos: `status.updated` (y `data.updated` si quieres refresh)
  - Versión: **v3**
- Copia el **signing secret** como `DIDIT_WEBHOOK_SECRET`.

En la configuración de la Application, agrega el dominio permitido para el callback:

- `https://TU_DOMINIO` (Didit exige que el callback pertenezca a un dominio permitido).

## 4. Variables de entorno

En `.env`:

```env
KYC_PROVIDER="didit"
KYC_REQUIRED="false"          # true en producción
DIDIT_API_KEY="sk_test_..."
DIDIT_WORKFLOW_ID="uuid-del-workflow"
DIDIT_WEBHOOK_SECRET="secreto-del-destino"
# Para probar desde un teléfono en la misma WiFi, usa la IP LAN del notebook.
DIDIT_CALLBACK_URL="http://192.0.2.92:3000/kyc/return"
```

Reinicia la app:

```bash
npm run dev
```

Luego entra como local o repartidor a `/kyc` y toca **Iniciar verificación**. Debería redirigir a Didit.

## 5. Probar sin dominio público (desarrollo)

Didit necesita una URL pública para el callback y el webhook. Opciones:

1. **Cloudflare Tunnel temporal:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   Usa la URL `https://...trycloudflare.com` como `NEXT_PUBLIC_APP_URL`/`DIDIT_CALLBACK_URL` y en el webhook de Didit.
2. **Solo callback:** si no configuras webhook, al volver a `/kyc/return` MesaCerca consulta la decisión con `GET /v3/session/{id}/decision/` y actualiza el caso. Sirve para demo, pero producción debe usar webhook.

## 6. Probar en sandbox

Didit ofrece documentos y caras de prueba en su consola. No uses documentos reales en sandbox.

Flujo esperado:

1. MesaCerca crea la sesión.
2. Didit captura documento + selfie + liveness.
3. Didit redirige a `/kyc/return`.
4. MesaCerca consulta la decisión y/o recibe webhook.
5. `/admin/kyc` muestra el caso; si está `Approved`, el admin puede verificar al local/repartidor (con `KYC_REQUIRED=true`).

## 7. Pasar a producción

1. Crea una **Application live** en Didit.
2. Repite workflow, API key (`sk_live_...`), webhook y dominio permitido.
3. Cambia las variables en el secret manager.
4. `KYC_PROVIDER=didit`, `KYC_REQUIRED=true`.
5. `npm start` valida que las credenciales estén presentes.
6. Monitorea costo: cada verificación completa ~$0.33; el crédito free es $10/mes.

## 8. Privacidad y cumplimiento

- MesaCerca guarda **solo** `providerRef` (session ID), estado y score; los documentos/biometría quedan en Didit.
- Didit tiene su propia retención; configura la que corresponda.
- Agrega consentimiento explícito de verificación de identidad y biometría en los términos/UX.
- Ley 21.719: base legal, finalidad, retención y derechos del titular.
- No uses sandbox con datos reales.

## 9. Qué necesito de ti

Solo esto, puesto en `.env` o en el secret manager (no lo pegues en el chat):

- `DIDIT_API_KEY`
- `DIDIT_WORKFLOW_ID`
- `DIDIT_WEBHOOK_SECRET`
- Dominio público para callback/webhook (o un túnel temporal para la demo)

Cuando estén, reinicio, hago una verificación sandbox y reviso que el caso llegue a `/admin/kyc` y que el gate de verificación funcione.

---

## 10. Prueba real realizada en sandbox (08/11/2026)

- Key sandbox `MesaCerca Sandbox Backend` creada y validada contra Didit (`201` al crear sesión).
- Workflow `783ab686-2f34-4117-b069-30cb048f8e77` (ID + Liveness + Face Match + AML).
- Sesión creada desde MesaCerca como Cocina Tour.
- Verificación completada con datos de prueba: **Approved**.
- Resultados reportados por Didit:
  - Liveness: **99**
  - Face match: **95**
  - AML: **0 hits**
- El callback público `/kyc/return` consultó la decisión y actualizó el `KycCase` a **APPROVED** con liveness 99.
- `/admin/kyc` muestra **Aprobado · Liveness 99.0 · didit**.
- Gate probado con `KYC_REQUIRED=true`: un local sin KYC (Burger Lab) no pudo ser verificado y permaneció `PENDING`.
- El sandbox no consumió crédito live.

### Nota de seguridad
La primera API key quedó visible en una captura y fue rotada/revocada. La key nueva vive solo en `.env` (600) y no se commitea. Para producción, crear una key acotada (`sessions: write`, `decisions: read`, `workflows: read`) y preferir webhook en lugar de polling.

> El workflow usado en esta prueba es básico (`PASSIVE`, sin NFC, con varias acciones de duplicados/dispositivo en `NO_ACTION`). No es el recomendado para producción. Para endurecerlo, seguir la sección 11.

> **Webhook pendiente:** en la prueba el `DIDIT_WEBHOOK_SECRET` quedó vacío y el resultado se obtuvo por callback/polling. En producción es obligatorio configurar el destino `status.updated` y su signing secret; `npm start` falla si `KYC_PROVIDER=didit` no tiene un `DIDIT_WEBHOOK_SECRET` fuerte.

---

## 11. Endurecer el KYC antes de producción

El workflow actual de sandbox (`783ab686-2f34-4117-b069-30cb048f8e77`) tiene:

- `OCR + LIVENESS + FACE_MATCH + AML`.
- Liveness **`PASSIVE`**.
- NFC **desactivado**.
- `duplicated_user_action`, duplicados de dispositivo/email/IP/teléfono y controles de emulador/root en `NO_ACTION` o sin configurar.
- `document_ai_name_mismatch_action` en `NO_ACTION`.
- `is_editable: false` y `is_simple_workflow: true`: no se puede convertir en un workflow avanzado; hay que crear uno nuevo.

Eso alcanza para una demo, pero no para producción con repartidores. El objetivo es crear **`MesaCerca Courier Strict`** con:

| Control | Configuración recomendada |
|---|---|
| Documento | OCR + autenticidad; tampering e inyección `DECLINE`; datos inconsistentes `REVIEW`. |
| Liveness | `ACTIVE_3D` o `FLASHING`, modo estricto; no `PASSIVE`. |
| Face match | Umbral más alto y `not_computed` en `REVIEW`. |
| NFC | Opcional, con `skip_nfc_action=REVIEW` y `unverified_chip_action=DECLINE`. |
| Duplicados | Rostro/documento/dispositivo/IP/teléfono/email en `REVIEW` o `DECLINE`. |
| Dispositivo | Emulador, root, hooking, app manipulada y cámara virtual en `DECLINE`. |
| IP | VPN/proxy, automatización y dispositivo duplicado en `REVIEW`. |
| AML | Umbrales más estrictos; opcional monitoreo continuo. |

> Implementación actual en sandbox: `a08dab96-d9f6-4618-9f9e-a31babd0f1db`, publicada con `ACTIVE_3D`, `face_liveness_flash_mode=1`, umbrales 40/65, inyección/cámara virtual/captura de pantalla en `DECLINE`, emulador/root/hooking en `DECLINE` y AML 50/80. Quedan email/teléfono duplicados y NFC como mejoras posteriores.

### Opción A: crearlo o endurecerlo por API

La API key de runtime (`DIDIT_API_KEY`) puede seguir siendo de solo lectura para
workflows. Para administrar workflows, crea una key aparte:

1. Didit → **Developers → API keys → Create key**.
2. Nombre: `MesaCerca Workflow Admin`.
3. Permiso **Workflows: Write**; el resto en `None` o lectura mínima.
4. Cópiala y guárdala en `.env` como `DIDIT_WORKFLOW_API_KEY`. No reemplaces
   `DIDIT_API_KEY`, que es la que usa la app para crear sesiones.

La app necesita una key de **runtime** distinta, con `Sessions: Write` y
`Decisions: Read`, en `DIDIT_API_KEY`. La key de gestión de workflows no sirve
para crear sesiones: responde `403` en `/v3/sessions/`.

Crear un workflow nuevo:

```bash
npm run kyc:strict-workflow

# Publicarlo directamente (solo después de revisar el draft):
DIDIT_PUBLISH=true npm run kyc:strict-workflow

# Incluir NFC (probar antes; puede aumentar la revisión manual):
DIDIT_ENABLE_NFC=true npm run kyc:strict-workflow
```

Endurecer el draft que ya creaste (`MesaCerca Courier Strict`):

```bash
# Busca el draft por nombre y aplica strict flash, thresholds,
# inyección/cámara virtual, device/IP y duplicados.
npm run kyc:harden-workflow

# Si hay varios workflows con el mismo nombre:
DIDIT_TARGET_WORKFLOW_ID="uuid-del-draft" npm run kyc:harden-workflow
```

El script `kyc:harden-workflow` no toca workflows publicados salvo que uses
`DIDIT_FORCE_PATCH=true`. Después de aplicarlo, revisa el draft, usa **Test run**
y publica.

Si responde `403 This API key has no write access to workflows`, la key usada no
tiene `Workflows: Write`. La key actual de MesaCerca es de solo lectura para workflows.

### Opción B: crearlo en el panel

1. Didit Business Console → **Workflows** → **Create workflow**.
2. Elige **KYC / Simple** y agrega: OCR, Liveness, Face Match, AML y Device & IP Analysis.
3. Configura Liveness en **3D Action** o **Flashing**, con modo estricto.
4. Activa las acciones de duplicados y dispositivo en `REVIEW`/`DECLINE`; no las dejes en `NO_ACTION`.
5. Publica y copia el nuevo **Workflow ID**.
6. Actualiza `DIDIT_WORKFLOW_ID` en `.env` y reinicia.

> El editor **Simple** no expone `strict flash`, inyección de frames, cámara
> virtual ni las acciones de dispositivo. Para esos campos usa la key de gestión
> y `kyc:harden-workflow`, o un workflow Advanced.

### Después de crearlo

1. Haz una verificación sandbox completa y revisa el caso en `/admin/kyc`.
2. Comprueba que un intento con documento/cara de prueba no aprobado quede `REVIEW` o `DECLINED`.
3. Revisa la tasa de falsos rechazos; la liveness activa y los umbrales altos aumentan la fricción.
4. Solo entonces activa `KYC_REQUIRED=true` en producción.
5. Mantén revisión humana para `In Review`, re-verificación aleatoria y límites los primeros días.

**NFC:** no lo actives a ciegas. Si el flujo hospedado en web no puede leer el chip en todos los teléfonos, todos esos casos terminarán en revisión manual. Para aprovecharlo de verdad, evalúa el SDK nativo de Didit y Play Integrity/App Attest en la app Android.

**No hagas esto:** aprobar solo porque el `livenessScore` es alto, dejar duplicados/dispositivo en `NO_ACTION`, o usar `PASSIVE` como único control para repartidores que manejan efectivo.
