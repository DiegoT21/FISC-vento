# 4.3.1 Integración del lector de tipo teclado y del lector Zebra

> Borrador. Los datos que requieren pruebas reales están marcados como [PENDIENTE: ...].

En esta sección describo cómo integré la captura de identificadores en el equipo de campo, el Zebra TC22r, con el sistema FISC-vento. Primero explico por qué opté por una aplicación nativa y no por una aplicación web progresiva, luego la tecnología que usé para cada tipo de identificador, y finalmente la arquitectura de la aplicación y los flujos de escaneo, asociación e inventario.

Conforme al alcance definido en la decisión de arquitectura 0001, el sistema utiliza únicamente dos métodos de captura: el código de barras Code 128, que ya está impreso en las placas físicas de los activos, y las etiquetas RFID que se añaden con este proyecto. No implementé la lectura de códigos QR ni el escaneo mediante la cámara del dispositivo.

## Motivación para una aplicación nativa

En una primera etapa publiqué FISC-vento como aplicación web progresiva (PWA) instalada en el TC22r. En ese esquema, el lector integrado funciona en modo teclado: DataWedge convierte cada lectura en pulsaciones de teclas que llegan al campo de texto de la página. Este modo es suficiente para el código de barras, pero tiene limitaciones para el RFID. Una página web no puede recibir la salida por intents de DataWedge, ni acceder al gatillo físico, ni controlar la potencia de lectura, ni obtener la intensidad de señal de cada etiqueta, ni realizar lecturas masivas sin duplicados. Además, para que una PWA funcione en el equipo se requiere un origen seguro (HTTPS), y el entorno de pruebas se sirve por HTTP, lo que obligó a usar una bandera de Chrome para tratar el origen como seguro.

Por estas razones decidí desarrollar una aplicación nativa de Android, llamada FISC-vento Campo, que se comunica directamente con la API de FISC-vento. La aplicación nativa accede a la API del lector de Zebra, no depende de una configuración manual de DataWedge en cada equipo y permite una lectura RFID completa. La interfaz web de FISC-vento se mantiene para el uso administrativo desde un computador.

## Tecnologías de captura

### RFID: Zebra RFID API3

Para la lectura de etiquetas RFID utilicé la API nativa de Zebra, RFID API3, incluida en la aplicación como una biblioteca (`rfidapi3lib`). Esta API permite iniciar y detener el inventario, ajustar la potencia de transmisión de la antena, recibir cada etiqueta leída con su código EPC y, cuando está disponible, su indicador de intensidad de señal (RSSI). La implementación del lector la adapté a partir de una aplicación previa del equipo, desarrollada para el mismo modelo de dispositivo. [PENDIENTE: indicar la versión exacta de la biblioteca y del firmware del TC22r usados en las pruebas.]

### Código de barras: DataWedge

Para el código de barras Code 128 utilicé DataWedge, el servicio de Zebra que administra el escáner integrado. La aplicación crea por código su propio perfil de DataWedge y recibe las lecturas mediante intents, de modo que no se requiere configurar el equipo manualmente. Con esto, ambas fuentes de lectura, barras y RFID, se presentan a la aplicación como un único flujo de eventos.

## Arquitectura de la aplicación

Diseñé la aplicación en tres módulos con responsabilidades separadas, de manera que cada uno se pueda desarrollar y probar de forma independiente:

1. **Módulo de aplicación (`app`).** Contiene la interfaz de usuario, construida con Jetpack Compose: inicio de sesión con la dirección del servidor, pantalla de escaneo, ficha del activo, asociación de etiquetas, inventario RFID y ajustes. Este módulo solo depende de las interfaces de los otros dos.
2. **Módulo de red (`core:network`).** Implementa el acceso a la API de FISC-vento mediante Retrofit y OkHttp, el manejo seguro del token de sesión y las operaciones de búsqueda, listado y asociación de etiquetas. Define la interfaz `FiscRepository`.
3. **Módulo de hardware (`hardware`).** Encapsula el lector del TC22r. Define la interfaz `ReaderGateway`, que expone un flujo de eventos de lectura (código de barras o etiqueta RFID), el estado del lector y el control de potencia, y la implementa con la API3 de Zebra y DataWedge.

Cada módulo define su contrato como código y cuenta con una implementación simulada (`FakeFiscRepository` y `FakeReaderGateway`), lo que permite desarrollar la interfaz y ejecutar pruebas sin depender del equipo físico ni del servidor. La inyección de dependencias la realicé de forma manual, sin bibliotecas adicionales, para mantener la aplicación pequeña.

La aplicación se comunica con el backend en Django mediante los endpoints de inicio de sesión (`/api/usuarios/login/`), consulta del usuario (`/api/usuarios/me/`), escaneo (`/api/escaneo/escanear/`), activos (`/api/activos/`, con el campo `tag_rfid`) y ubicaciones (`/api/ubicaciones/`). El servidor resuelve un valor escaneado buscando primero por el código del activo (código de barras) y luego por su etiqueta RFID.

## Flujos de uso

### Escaneo

Al accionar el gatillo, el módulo de hardware emite un evento con el valor leído. La aplicación consulta al servidor y, si encuentra el activo, muestra su ficha; si no existe, informa que el valor no está registrado.

### Asociación de una etiqueta a un activo

Desde la ficha de un activo, el usuario solicita leer una etiqueta. La aplicación toma el siguiente evento RFID, con su código EPC, y lo envía al servidor para guardarlo en el campo `tag_rfid` del activo. También se puede quitar la asociación desde la misma ficha.

### Inventario RFID

El usuario elige una ubicación y recorre la zona con el gatillo accionado. La aplicación acumula las etiquetas leídas sin duplicados y las compara con los activos esperados en esa ubicación, obtenidos del servidor. El resultado se clasifica en activos correctos, faltantes, extras y etiquetas desconocidas.

## Consideraciones de conectividad

El entorno de pruebas se sirve por HTTP, sin certificado. Android bloquea el tráfico sin cifrar por defecto, por lo que configuré la aplicación con una política de seguridad de red que lo permite para este entorno. Esta decisión es temporal; al disponer de un dominio con HTTPS, la política se restringe. [PENDIENTE: registrar la fecha y el dominio cuando se migre a HTTPS.]

## Verificación

La verificación automática del proyecto consiste en la compilación de la aplicación y la ejecución de las pruebas unitarias de los módulos de red y de hardware mediante un flujo de integración continua. [PENDIENTE: resultados de las pruebas unitarias y de la compilación en integración continua.] Las pruebas de lectura con el equipo físico, incluyendo la tasa de lectura de etiquetas RFID, el alcance según la potencia y los tiempos de respuesta, aún no se han realizado. [PENDIENTE: resultados de las pruebas con el TC22r (lecturas de Code 128 y RFID, alcance, tiempos).]
