# Arquitectura — FISC-vento

## Stack (fijado por el anteproyecto)

- **Backend**: Django + Django REST Framework, PostgreSQL.
- **Frontend**: React (Vite), Tailwind CSS.
- **Identificación de activos**: código de barras (ya existente en las placas físicas) y RFID (nuevo con este proyecto). No se usa QR — ver `docs/decisiones/0001-rfid-en-alcance.md`.
- **Contenerización**: Docker / docker-compose (servicios `db`, `backend`, `frontend`). En local es modo desarrollo; staging y producción usan Nginx y Gunicorn (`docker-compose.prod.yml`).
- **Pruebas de carga**: Locust (`backend/loadtests/locustfile.py`).

## Despliegue: staging primero, producción con aprobación

- **Push a `develop`** (`pipeline.yml`): corre tests de backend y frontend, despliega a **staging** y ejecuta smoke tests (HTTP y de navegador). Aquí se detiene.
- **Promoción a producción** (`deploy-production.yml`, workflow "Promover a producción"): se acciona a mano en GitHub → Actions → *Run workflow*. Primero comprueba que el commit actual de `develop` tiene una ejecución exitosa del pipeline de staging; si no, aborta. Luego mergea `develop` en `main`, despliega por SSH y corre smoke tests.
- **Aprobación obligatoria (configuración manual, una sola vez):** en GitHub → Settings → Environments → `production`, activar *Required reviewers* y añadir a quien deba aprobar. Sin esto, el workflow manual igualmente exige que alguien lo dispare, pero no hay segunda confirmación.
- **Primera promoción tras este cambio:** el archivo nuevo aún no está en `main`, así que al correr el workflow elige la rama `develop` en *Use workflow from*. Desde esa promoción, `main` ya tiene la versión nueva.
- Antes de este cambio, un push a `develop` seguía solo hasta producción; ya no.

## Modo desarrollo y modo producción

| | Local (`docker-compose.yml`) | Servidores (`docker-compose.prod.yml`) |
|---|---|---|
| Frontend | Vite, puerto 5173, código montado en vivo | Build de Vite servido por Nginx |
| Backend | `runserver` en el puerto 8000 | Gunicorn, sin puerto publicado |
| Settings | `config.settings.dev` (`DEBUG` encendido) | `config.settings.prod` (`DJANGO_DEBUG=0`) |
| Base de datos | Postgres publicado en 5432 | Postgres solo en la red de Compose |
| API | el navegador llama a `VITE_API_BASE_URL` (`:8000`) | el navegador llama a `/api` en el mismo origen y Nginx hace de proxy |

Los dos compose comparten el nombre de proyecto `fisc-vento` y el volumen `postgres_data`, así que la base que ya está en el servidor se conserva al pasar al modo producción. No cambies ese `name`.

Nginx (imagen del servicio `frontend`) hace esto:

- `/` y el resto de rutas de la interfaz: archivos del build, con `try_files` hacia `index.html` para que recargar `/dashboard` no dé 404.
- `/api/` y `/admin`: proxy a Gunicorn (`backend:8000`), reenviando `Host` y `X-Forwarded-Proto`.
- `/static/`: lo que `collectstatic` dejó en un volumen compartido (CSS del admin).
- `/.well-known/acme-challenge/`: vacío hasta que se pida un certificado.

Puertos publicados en el servidor: **80** y **5173**. Los dos entran a la misma Nginx. El 5173 no es el servidor de Vite: el grupo de seguridad de AWS ya lo abre, y así la URL que ya usa el equipo sigue viva. Gunicorn y Postgres no se publican.

El workflow, antes de levantar los contenedores, corre `scripts/preparar_env_produccion.sh` con la IP del secret (`STAGING_HOST` o `PROD_HOST`). Ese script solo toca `backend/.env` en el servidor (no está en git):

- si `DJANGO_SECRET_KEY` falta o es la de ejemplo (`change-me`, menos de 50 caracteres), genera una y la guarda ahí, con permisos `600`;
- si `DJANGO_ALLOWED_HOSTS` sigue siendo el de desarrollo, lo deja en esa IP más `localhost`;
- pone `DJANGO_SECURE_SSL=0` si nadie lo definió, porque sin certificado una redirección a HTTPS dejaría el sitio inaccesible.

`DJANGO_SETTINGS_MODULE` y `DJANGO_DEBUG` no dependen de ese archivo: el compose de producción los fuerza.

### Qué hacer en los servidores (Diego)

1. Abrir **TCP 80** en el grupo de seguridad de staging y de producción. El 5173 puede quedar. Cuando el smoke deje de imprimir el aviso del puerto 80, la URL sin puerto ya responde.
2. Después de comprobar que el sitio carga, se pueden cerrar **8000** (ya no escucha) y **5432** (Postgres deja de publicarse). Los backups siguen entrando con `docker compose exec`.
3. No copies la clave nueva al repo ni a un chat. Vive solo en `backend/.env` de cada servidor. Si se borra ese archivo, el próximo despliegue genera otra y se invalidan sesiones y tokens.
4. El cron de `scripts/backup_db.sh` no hay que reescribirlo: si el stack de producción está arriba, el script usa `docker-compose.prod.yml`.

### HTTPS (cuando exista un dominio)

Hoy no hay dominio y la cámara del navegador no funciona en `http://IP` (solo en `localhost` o bajo HTTPS). La config ya está; no se activa sola.

1. Un registro DNS `A` del dominio hacia la IP del servidor, y **TCP 443** abierto en el grupo de seguridad.
2. Pedir el certificado (Let's Encrypt) contra el Nginx que ya está corriendo. Hay que cambiar el dominio y el correo:

   ```bash
   sudo docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot \
     certonly --webroot -w /var/www/certbot \
     --email correo@ejemplo.com --agree-tos --no-eff-email \
     -d app.fisc.example
   ```

3. En el servidor, copiar `frontend/nginx/ssl.conf.example` a `frontend/nginx/ssl.conf` (ese archivo está en `.gitignore`) y reemplazar `app.fisc.example` por el dominio, en `server_name` y en las dos rutas `ssl_certificate`.
4. En `backend/.env` de ese servidor: `DJANGO_SECURE_SSL=1`, `DJANGO_ALLOWED_HOSTS=el.dominio`, `DJANGO_CSRF_TRUSTED_ORIGINS=https://el.dominio` y `DJANGO_CORS_ALLOWED_ORIGINS=https://el.dominio`. El script de despliegue no pisa estos valores si ya no son los de desarrollo.
5. Levantar el override, que publica el 443, monta el volumen de los certificados y hace que el puerto 80 redirija a HTTPS (el reto de renovación sigue en `/.well-known/`):

   ```bash
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.https.yml up -d
   ```

6. Renovar (cron, una vez al día basta). Let's Encrypt avisa solo cuando falta menos de un mes:

   ```bash
   sudo docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot renew
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.https.yml exec frontend nginx -s reload
   ```

Los `.pem` quedan en el volumen Docker `letsencrypt`. No se copian al repositorio. Sin `ssl.conf` y sin ese volumen, no uses `docker-compose.https.yml`: Docker crearía una carpeta donde espera el archivo y Nginx no arrancaría.

Los smoke tests siguen pidiendo `http://`. `curl` sigue la redirección, así que con el certificado válido el chequeo termina en HTTPS y en 200. Si el 443 no está abierto, el smoke falla: es la señal de que falta ese puerto.

## Backups de base de datos

`scripts/backup_db.sh` hace un `pg_dump` comprimido del contenedor `db` y
rota backups más viejos que 7 días (configurable con `RETENCION_DIAS`).
Corre por cron, una vez al día, de forma independiente en cada servidor
(staging y producción tienen sus propios backups, no se comparten). Los
dumps quedan en `~/FISC-vento/backups/` en el propio servidor — nunca se
suben al repo. Para restaurar uno: `scripts/restore_db.sh <archivo>`.

## Apps del backend ↔ features del frontend

Cada dominio tiene el mismo nombre en ambos lados para que sea fácil ubicar
el código correspondiente:

| Dominio         | Backend (`backend/apps/`) | Frontend (`frontend/src/features/`) | Estado |
|------------------|----------------------------|----------------------------------------|--------|
| Usuarios/roles   | `usuarios`                | `administracion`                       | Core |
| Ubicaciones      | `ubicaciones`              | `ubicaciones`                          | Core |
| Activos          | `activos`                  | `activos`                              | Core |
| Escaneo (barras/RFID) | `escaneo`          | `escaneo`                              | Core |
| Auditoría        | `auditoria`                | `auditoria`                            | Core |
| Reportes         | `reportes`                 | `reportes` (gráficas) y `dashboard` (Panel) | Core |
| Préstamos        | `prestamos`                | `prestamos`                            | Stretch |
| Traslados        | `traslados`                | `traslados`                            | Stretch |

Ver `docs/decisiones/` para el porqué de las decisiones marcadas arriba.

## Capa de datos del frontend

El frontend habla con la API a través de `frontend/src/shared/api/`:
`client.js` (fetch + token; los errores llevan `status` y `data` con el
cuerpo de DRF), `endpoints.js` (mapa de rutas), `listarTodos.js` (sigue la
paginación para selectores) y un archivo por recurso (`activos.js`,
`ubicaciones.js`, `reportes.js`, `escaneo.js`). Las pantallas cargan datos
con el hook `useApi` (`shared/hooks/useApi.js`, expone `{ data, error,
cargando }`), y `shared/utils/errores.js` traduce los errores a mensajes
para la persona.

Endpoints que consume hoy:

| Pantalla | Endpoint |
|---|---|
| Activos (lista, ficha, alta, edición, borrado) | `/api/activos/` (filtros `categoria`, `estado`, `ubicacion`, `origen`; búsqueda por código, descripción, REF, serie, marca, modelo y `tag_rfid`) |
| Categorías (selector y alta al registrar un activo) | `/api/activos/categorias/` |
| Escaneo | `POST /api/escaneo/escanear/` (`{ "valor": ... }`, resuelve por `codigo` o `tag_rfid`) |
| Etiqueta de código de barras (ficha del activo) | `GET /api/escaneo/activos/<id>/barras/` (PNG; requiere token, por eso se pide como Blob) |
| Panel principal | `GET /api/reportes/resumen/` (conteos por estado, pendientes, traslados y préstamos) |
| Reportes | `GET /api/reportes/distribucion/` (activos por estado, departamento y categoría; solo Administrador y Auditor) |
| Ubicaciones | `/api/ubicaciones/` y `/api/ubicaciones/departamentos/` |

Usuarios, Auditoría, Préstamos y Traslados siguen leyendo de
`frontend/src/mocks/` (Préstamos y Traslados por el ADR 0002).

## Sistema de diseño — paleta de colores

**Verde institucional (`fisc-*`)**: definido en `frontend/tailwind.config.js`,
es el color de marca único del sistema. `fisc-800` (`#0d6936`) se extrajo
por pixeles directamente del sello oficial de la FISC (el logo embebido en
`frontend/src/shared/layout/Sidebar.jsx`), no es un verde elegido a ojo.
Antes de unificarlo convivían 3 verdes sin coincidir entre sí (el
`green-800` por defecto de Tailwind, `#0c5942` del Login, `#005A36` del
sidebar) — ahora todo el frontend usa esta única escala:

| Token | Hex | Uso típico |
|---|---|---|
| `fisc-50` | `#edfdf4` | Fondos muy claros (nav activa, tarjeta de rol, hover de filas, zona de escaneo) |
| `fisc-100` | `#d6fae6` | Fondo de badges "bueno", íconos de tarjetas, texto claro sobre verde oscuro |
| `fisc-200` | `#a4f4c8` | Borde de la zona de escaneo, texto secundario sobre verde oscuro |
| `fisc-300` | `#65eca1` | Bordes de badges/resultados, indicador "en línea" |
| `fisc-500`, `fisc-600` | `#15ac59`, `#118846` | Punto de los badges "bueno", anillos de foco, íconos de ubicación (`fisc-400` sigue reservado) |
| `fisc-700` | `#0d6d38` | Íconos/círculos secundarios (Login) |
| `fisc-800` | `#0d6936` | **Color primario** — botones, nav activa, enlaces, el verde real del logo |
| `fisc-900` | `#084021` | Texto de badges "bueno" y de códigos/IDs, degradados, fondo oscuro del Login |
| `fisc-950` | `#052915` | Reservado, sin uso todavía |

**Colores de estado** (badges y stat cards, en `shared/components/Badge.jsx`
y `StatCard.jsx`) — los badges llevan un punto de color y borde. Excepto
`good`, usan la paleta estándar de Tailwind, independiente del verde de
marca porque comunican significado (bien/mal/alerta), no identidad. `good`
usa el verde `fisc` para que "Activo" se vea igual que el resto de la marca.
El mapeo de estado a tono está en `shared/utils/estado.js`:

| Tono | Significado | Clases |
|---|---|---|
| `good` | Activo | `fisc-100` / `fisc-900` (punto `fisc-500`) |
| `warn` | Inactivo, alertas | `amber-50` / `amber-800` |
| `bad` | Inoperativo | `red-50` / `red-700` |
| `info` | Informativo (p. ej. traslado pendiente) | `sky-50` / `sky-700` |
| `neutral` | Default | `slate-100` / `slate-700` |

Los grises neutros del sistema son la escala `slate-*` (no `gray-*`), según
la skill `fisc-ui-designer`. El fondo de pantalla es el azul claro
`#E5F2FF` (decisión del equipo, ver `AppShell.jsx`), no `slate-50`.

## Pendiente de diseño (no resuelto en la estructura, sí en el modelo de datos real)

El mockup original usaba dos campos de estado distintos (`estatus`:
EXISTE/ADICIONAR/EXTRAVIADO/NO EXISTE, y `estado`: EN USO/DAÑADO) que no
mapean 1:1 al modelo limpio de tres estados del anteproyecto
(Activo/Inactivo/Inoperativo). `backend/apps/activos/models.py` implementa
por ahora solo el modelo de tres estados, y la interfaz ya solo muestra
esos tres (se quitó la columna `estatus` del mockup); la reconciliación con la idea de
`estatus` (probablemente un concepto de "último resultado de auditoría de
inventario" más que un campo del propio Activo) queda pendiente para el
Capítulo III (Diseño del Modelo de Datos) de la tesis.
