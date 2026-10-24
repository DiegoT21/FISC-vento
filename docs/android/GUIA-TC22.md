# Guía de FISC-vento Campo para el Zebra TC22r

Esta guía explica cómo instalar y usar **FISC-vento Campo**, la app nativa de Android que reemplaza a la PWA en el Zebra TC22r. Está basada en `android/CONTRATO.md`.

> Alcance: la app lee **código de barras Code 128** (el de las placas físicas de los activos) y **etiquetas RFID**, ambos con el lector integrado del TC22r. No usa la cámara ni lee códigos QR (ver `docs/decisiones/0001-rfid-en-alcance.md`).

## 1. ¿Qué es FISC-vento Campo?

Es una app mínima que se conecta a la API de FISC-vento (`/api/...`) y permite, desde el equipo:

- Iniciar sesión contra el servidor (la URL se puede cambiar en la pantalla de login).
- Escanear un código de barras o un tag RFID con el gatillo y ver la ficha del activo.
- Asociar o desasociar un tag RFID a un activo.
- Hacer un inventario RFID por ubicación (esperado vs. leído).
- Ajustar la potencia RFID.

El RFID se lee con la API nativa de Zebra (RFID API3) y el código de barras con DataWedge. La app crea sola su perfil de DataWedge, así que no hay que configurarlo a mano. [PENDIENTE: confirmar en el equipo físico que el perfil se crea sin intervención.]

## 2. Requisitos

- Zebra TC22r con Android 13 o superior (la app usa `minSdk 33`).
- El APK debug generado por el workflow `android-apk` (artefacto `fisc-vento-campo-debug`) o compilado localmente con `cd android && ./gradlew :app:assembleDebug`. El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
- Una PC con `adb` (Android Platform Tools) si se instala por USB.
- Red con acceso al servidor de FISC-vento (staging: `http://3.149.4.52/`).

## 3. Instalar el APK en el TC22r

### Opción A: por USB con `adb` (recomendada)

1. En el TC22r, activa las **Opciones de desarrollador** (Ajustes > Acerca del teléfono > toca varias veces el número de compilación) y activa la **Depuración USB**.
2. Conecta el equipo a la PC con el cable USB y acepta el aviso de depuración en la pantalla.
3. Verifica que aparece el equipo:

   ```
   adb devices
   ```

4. Instala (o actualiza) la app:

   ```
   adb install -r app-debug.apk
   ```

   La opción `-r` reinstala conservando los datos si ya estaba instalada.

### Opción B: copiando el archivo

1. Copia `app-debug.apk` al equipo (por USB como almacenamiento, o descargándolo desde una ubicación a la que el equipo tenga acceso).
2. Abre el archivo desde el administrador de archivos del TC22r.
3. Si Android lo pide, permite la instalación desde esa fuente y confirma.

> El `adb` inalámbrico no se recomienda como método fijo porque el emparejamiento se pierde al reiniciar o cambiar de Wi-Fi. Solo hace falta el cable para instalar.

## 4. Primer uso

1. Abre **FISC-vento Campo**.
2. En la pantalla de login revisa la **URL del servidor**. Viene precargada con staging (`http://3.149.4.52/`); cámbiala si usas otro servidor.
3. Escribe usuario y contraseña. Activa **Recordar** si quieres mantener la sesión.
4. Entra. La app queda lista para escanear cuando el estado del lector indique que está listo.

## 5. Escanear código de barras y RFID con el gatillo

1. Ve a la pantalla de **Escaneo**.
2. Apunta al código de barras (Code 128) o acerca el equipo al tag RFID y aprieta el **gatillo**.
3. La app busca el valor en el servidor (`POST /api/escaneo/escanear/`, que resuelve por `codigo` o por `tag_rfid`) y muestra la **ficha del activo**.
4. Si el valor no corresponde a ningún activo, la app lo avisa.

La app da retroalimentación con vibración y sonido al leer.

## 6. Asociar un tag RFID a un activo

1. Abre la ficha del activo (por escaneo de su código de barras o desde la búsqueda).
2. Toca **Leer tag**.
3. Aprieta el gatillo cerca del tag que quieres asociar. La app toma el siguiente tag leído y lo guarda en el campo `tag_rfid` del activo.
4. Para quitar la asociación, usa **Desasociar** en la misma ficha.

Un tag solo puede estar asociado a un activo (ver "Tag duplicado" en la sección 8).

## 7. Inventario RFID

1. Entra a **Inventario** y elige la **ubicación** a inventariar.
2. Aprieta el gatillo y recorre la zona. Las lecturas se agrupan sin duplicados.
3. La app compara lo leído con los activos esperados en esa ubicación (`GET /api/activos/` filtrado por ubicación) y clasifica:
   - **OK**: activo esperado y leído.
   - **Faltantes**: esperado pero no leído.
   - **Extras**: leído y registrado en otra ubicación.
   - **Desconocidos**: tag que no pertenece a ningún activo.
4. Si necesitas más o menos alcance, ajusta la **potencia RFID** en Ajustes (5 a 30 dBm).

## 8. Solución de problemas

### No conecta al servidor (HTTP plano en staging)

Staging no tiene dominio ni HTTPS, así que va por HTTP. Android bloquea por defecto el tráfico sin cifrar, por eso la app incluye un `network_security_config` que lo permite. Si aun así falla:

- Revisa que la URL empiece con `http://` y termine con `/`.
- Comprueba que el equipo tiene red y alcanza el servidor (por ejemplo, abriendo la URL en el navegador del equipo).
- Cuando exista dominio con HTTPS, usa esa URL y se restringe el tráfico en claro.

### "Lector no listo"

- Espera unos segundos tras abrir la app; el lector se inicializa al iniciar.
- Cierra la app y vuelve a abrirla. Verifica que ninguna otra app esté usando el lector RFID.
- Revisa que el equipo tenga batería suficiente y que el modo de lectura (barras / RFID / ambos) sea el esperado.
- [PENDIENTE: documentar los mensajes de estado exactos del lector una vez probado en el equipo físico.]

### Tag duplicado

Si al asociar aparece que el tag ya está asignado, ese tag pertenece a otro activo. Desasócialo del activo anterior o usa otro tag. [PENDIENTE: confirmar el mensaje exacto que devuelve el servidor.]

### La app no se instala

- Si `adb install -r` falla por firma, desinstala la versión previa (`adb uninstall com.fiscvento.campo`) e instala de nuevo.
- Verifica que la Depuración USB esté activa y que `adb devices` muestre el equipo como `device`.

## 9. Pendientes de validación

Esta guía se redactó a partir del contrato de la app y no se ha probado en el TC22r físico. Los pasos de pantallas y mensajes deben verificarse en el equipo. [PENDIENTE: validar la guía completa en el TC22r.]
