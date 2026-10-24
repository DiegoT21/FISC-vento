# Notas del módulo `:hardware`

## Qué se prueba en JVM (sin equipo)

- Normalización de EPC (`EpcNormalizer`)
- Mapeo dBm → índice de potencia (`PowerMapper`)
- Dedupe de EPC consecutivos (`TagDedupe`)
- Parseo de extras de DataWedge (`DataWedgeIntentParser`)

Comando: `.\gradlew.bat :hardware:testDebugUnitTest`

## Qué requiere el TC22r físico (sin automatizar aquí)

- Conexión real a RFID API3 (`SERVICE_USB`, `RFIDReader.connect`)
- Gatillo físico: press/release → inventario on/off
- Liberación del radio frente a 123RFID / demos Zebra
- Creación del perfil DataWedge `FiscVento` (Code 128 + QR → intent `com.fiscvento.campo.BARCODE_SCAN`)
- Lectura del QR de vinculación con el imager del TC22r (ver más abajo): **sin probar en el equipo**
- Gatillo inferior (gun) para barras con API3 ya conectado (limitación Zebra del USB compartido)
- `setRfidPower` aplicado al hardware y medido en campo
- Reintentos / timeout cuando otra app tiene el radio

## Empaquetado del SDK Zebra

AGP 8 no permite dependencia directa de un `.aar` local dentro de un módulo library.
Se extrajeron `rfidapi3-classes.jar` + `rfidserviceapi.jar` (y el asset `RegionsList_FXP20.json`)
desde `libs/rfidapi3lib-2.0.5.292.aar`, que se conserva como referencia.

## Comportamiento esperado en dispositivo

1. `ReaderFactory.create` en Zebra → `ZebraReaderGateway`; en emulador/otro → `FakeReaderGateway` con mensaje claro.
2. Al `start`: libera RFID de DataWedge, conecta API3, asegura perfil de barras.
3. Modo `RFID` / `BOTH`: gatillo handheld inicia/para inventario.
4. Modo `BARCODE`: API3 suelta el gatillo para el imager; barras por DataWedge.

## QR de vinculación (solo para registrar el equipo)

`ZebraDataWedgeBridge.setBarcodeConfig` activa `decoder_qrcode = true` además de `decoder_code128 = true`
en el perfil `FiscVento`. El QR llega por el mismo camino que cualquier código (`ScanEvent.Barcode`);
quien lo interpreta es `:app` (`VinculacionQr.parse`, en `:core:network`). Code 128 de los activos no cambia.
El QR no se usa para activos: la tesis sigue limitada a Code 128 y al lector del TC22r.

Pendiente de verificar en el TC22r: que el perfil acepte `decoder_qrcode` en su versión de DataWedge y que el
imager lea el QR desde una pantalla (brillo alto, QR de ~7 cm). Si no lo lee, la app acepta pegar o teclear
el código que la web muestra bajo el QR.
