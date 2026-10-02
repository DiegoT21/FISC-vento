# Arquitectura — FISC-vento

## Stack (fijado por el anteproyecto)

- **Backend**: Django + Django REST Framework, PostgreSQL.
- **Frontend**: React (Vite), Tailwind CSS.
- **Identificación de activos**: código de barras (ya existente en las placas físicas) y RFID (nuevo con este proyecto). No se usa QR — ver `docs/decisiones/0001-rfid-en-alcance.md`.
- **Contenerización**: Docker / docker-compose (servicios `db`, `backend`, `frontend`).
- **Pruebas de carga**: Locust (`backend/loadtests/locustfile.py`).

## Despliegue: staging primero, producción con aprobación

- **Push a `develop`** (`pipeline.yml`): corre tests de backend y frontend, despliega a **staging** y ejecuta smoke tests (HTTP y de navegador). Aquí se detiene.
- **Promoción a producción** (`deploy-production.yml`, workflow "Promover a producción"): se acciona a mano en GitHub → Actions → *Run workflow*. Primero comprueba que el commit actual de `develop` tiene una ejecución exitosa del pipeline de staging; si no, aborta. Luego mergea `develop` en `main`, despliega por SSH y corre smoke tests.
- **Aprobación obligatoria (configuración manual, una sola vez):** en GitHub → Settings → Environments → `production`, activar *Required reviewers* y añadir a quien deba aprobar. Sin esto, el workflow manual igualmente exige que alguien lo dispare, pero no hay segunda confirmación.
- **Primera promoción tras este cambio:** el archivo nuevo aún no está en `main`, así que al correr el workflow elige la rama `develop` en *Use workflow from*. Desde esa promoción, `main` ya tiene la versión nueva.
- Antes de este cambio, un push a `develop` seguía solo hasta producción; ya no.

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
