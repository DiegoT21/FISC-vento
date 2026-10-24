# FISC-vento Campo (Android, Zebra TC22r) - contrato de trabajo

App nativa minima para el TC22r. Reemplaza a la PWA en el equipo. Servidor: API Django de FISC-vento (`/api/...`), staging `http://3.149.4.52/`.
Origen del lector: se porta de la app Ubika (`C:\Users\diego\OneDrive\Desktop\Posper\RFID\rfid-trazabilidad\apps\mobile\hardware\...`, SOLO LECTURA).

## Reglas
- Cada IA trabaja SOLO en su carpeta (abajo). No editar archivos de otra. Si necesitas cambiar un contrato, dejalo escrito en `android/PETICIONES.md` y avisa en tu reporte.
- Sin Hilt/KSP: inyeccion manual. Kotlin 2.0.21, AGP 8.7.3, minSdk 33, JDK 17.
- Nada de secretos en git (`.env`, `.pem`, `secrets.properties`, claves). No pegar secretos en logs.
- No hagas merge ni push a `main`/`develop`. Commits en tu rama; Capi hace el push.
- Compilar: `cd android; .\gradlew.bat :<modulo>:assembleDebug` (o `:app:assembleDebug`). Gradle ya apunta al SDK en `local.properties`.
- Alcance de la tesis: Code 128 y lector del TC22r. NO camara, NO QR para activos.
- Excepcion: el QR de vinculacion del equipo (`fiscvento://vincular?u=<url>&c=<codigo>`) lo genera la web (Dispositivos) y lo lee el imager en el login. `FiscRepository.vincularDispositivo` hace `POST api/dispositivos/vincular/` (publico); `dispositivoVinculado()` devuelve el registro local.

## Modulos y duenos
| Carpeta | Dueno | Contenido |
|---|---|---|
| `android/app/` | Claude Code | UI Compose: login (con URL del servidor), Escaneo, ficha de activo, asociar/desasociar tag, inventario RFID (esperado vs leido), ajustes (potencia). Feedback vibracion/sonido. |
| `android/core/network/` | Codex | `RealFiscRepository` (Retrofit+OkHttp) contra la API Django. Token seguro. Tests con MockWebServer. Reemplaza `FiscRepositoryFactory`. |
| `android/hardware/` | Cursor | `ReaderGateway` real: Zebra RFID API3 (AAR en `hardware/libs/`) + DataWedge para barras. Portar solo lo necesario de Ubika (ZebraApi3RfidReader, ZebraDataWedgeBridge, ZebraDataWedgeBarcodeScanner, DeviceDetector). Reemplaza `ReaderFactory`. |
| `docs/android/` y `.github/workflows/android-apk.yml` | Gemini | Guia de instalacion/uso, seccion de tesis (4.3.1), workflow que compila el APK debug. |

## Contratos (ya escritos como codigo)
- Hardware: `android/hardware/src/main/java/com/fiscvento/hardware/Contract.kt` (`ReaderGateway`, `ScanEvent`, `ReadMode`, `ReaderStatus`). `FakeReaderGateway` para emulador.
- Red: `android/core/network/src/main/java/com/fiscvento/network/Contract.kt` (`FiscRepository`, `Activo`, `Session`, `LookupResult`). `FakeFiscRepository` para emulador.
- `:app` solo usa `ReaderFactory.create(context)` y `FiscRepositoryFactory.create(context, BuildConfig.DEFAULT_SERVER_URL)`.

## API Django (referencia, lee el codigo en `backend/apps/*`)
`POST /api/usuarios/login/`, `GET /api/usuarios/me/`, `POST /api/escaneo/escanear/ {"valor"}`, `GET/PATCH /api/activos/...` (campo `tag_rfid`), `POST /api/activos/por-editar/ {"epc"}` (tag leído sin ficha), `GET /api/ubicaciones/...`.

## Flujos
1. Login: URL del servidor (precargada) + usuario + contrasena + recordar.
2. Escaneo: el gatillo del TC22r lee barras o RFID; se busca con `lookup`; muestra la ficha. Un código de barras que no existe avisa. Un tag RFID que no existe se envía con `registrarTagPorEditar` y queda en la lista «Por editar» de la web.
3. Asociar tag: en la ficha de un activo, "Leer tag" toma el siguiente `RfidTag` y llama `asociarTag`.
4. Inventario RFID: elegir ubicacion, leer en masa (sin duplicados), comparar con `listarActivos(ubicacionId)`: OK / faltantes / extras / desconocidos.
