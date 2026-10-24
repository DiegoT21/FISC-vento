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
- Creación del perfil DataWedge `FiscVento` (Code 128 → intent `com.fiscvento.campo.BARCODE_SCAN`)
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
