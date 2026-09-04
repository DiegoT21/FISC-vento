# ADR 0001 — RFID entra al alcance junto a QR y código de barras

**Estado**: Aceptado (2026-09-03)

## Contexto

El anteproyecto de graduación solo menciona códigos QR y de barras como
tecnología de captura ("Sistema de Identificación Digital" en la sección
1.3, Definición y alcance). El mockup del frontend, sin embargo, ya incluía
un modo "lector RFID" en la pantalla de Escaneo, heredado de otro proyecto
del equipo relacionado con hardware RFID.

## Decisión

Se confirma con el equipo que **los 3 métodos de captura** (QR, código de
barras y RFID) forman parte del alcance real del sistema, no solo los dos
mencionados explícitamente en el documento.

## Consecuencias

- El modelo `Activo` incluye un campo `tag_rfid` además de `codigo` (usado
  para QR/barras) — ver `backend/apps/activos/models.py`.
- `backend/apps/escaneo/services.py` resuelve un activo tanto por `codigo`
  como por `tag_rfid`.
- La integración con hardware RFID real (lector, drivers, SDK) queda fuera
  de este repo — se apoya en el trabajo ya existente del equipo en su otro
  proyecto RFID; aquí solo se define el contrato de API que consume el tag
  ya leído.
- Si el anteproyecto formal se actualiza para reflejar esto, documentarlo
  también ahí de cara a la sustentación.
