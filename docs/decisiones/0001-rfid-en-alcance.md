# ADR 0001 — RFID y código de barras (sin QR)

**Estado**: Aceptado (2026-09-03), revisado (2026-09-30)

## Contexto

El anteproyecto de graduación solo menciona códigos QR y de barras como
tecnología de captura ("Sistema de Identificación Digital" en la sección
1.3, Definición y alcance). El mockup del frontend, sin embargo, ya incluía
un modo "lector RFID" en la pantalla de Escaneo, heredado de otro proyecto
del equipo relacionado con hardware RFID.

En una primera revisión (2026-09-03) se había decidido sumar RFID a los dos
métodos del anteproyecto (QR + barras + RFID). Al definir mejor el flujo
real de la FISC, el equipo confirmó que **los activos ya están etiquetados
con código de barras** desde antes de este proyecto — no tiene sentido
generar o imprimir además un código QR redundante para el mismo bien. RFID
sí se suma porque resuelve un problema real que ni QR ni barras resuelven
bien: identificación sin línea de vista directa y lectura masiva.

## Decisión

El sistema usa **únicamente 2 métodos de captura: código de barras
(el que ya existe en las placas físicas) y RFID (el que se añade con este
proyecto)**. No se implementa generación ni lectura de códigos QR en
ninguna parte del sistema.

## Consecuencias

- El modelo `Activo` tiene `codigo` (código de barras existente) y
  `tag_rfid` (la etiqueta RFID nueva) — ver `backend/apps/activos/models.py`.
- `backend/apps/escaneo/services.py` solo genera imágenes de código de
  barras (`generar_codigo_barras`, con `python-barcode`); no existe
  `generar_qr` ni la dependencia `qrcode`.
- `buscar_por_codigo` resuelve un Activo por `codigo` (barras) o por
  `tag_rfid` (RFID) — sin cambios respecto a la decisión anterior.
- El módulo de Escaneo del frontend (`frontend/src/features/escaneo`) tiene
  2 modos: "Código de barras" y "RFID" — ya no existe un modo/opción de QR.
- La integración con hardware RFID real (lector, drivers, SDK) queda fuera
  de este repo — se apoya en el trabajo ya existente del equipo en su otro
  proyecto RFID; aquí solo se define el contrato de API que consume el tag
  ya leído.
- Si el anteproyecto formal se actualiza para reflejar esto, documentarlo
  también ahí de cara a la sustentación.
