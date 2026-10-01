# Arquitectura — FISC-vento

## Stack (fijado por el anteproyecto)

- **Backend**: Django + Django REST Framework, PostgreSQL.
- **Frontend**: React (Vite), Tailwind CSS.
- **Identificación de activos**: código de barras (ya existente en las placas físicas) y RFID (nuevo con este proyecto). No se usa QR — ver `docs/decisiones/0001-rfid-en-alcance.md`.
- **Contenerización**: Docker / docker-compose (servicios `db`, `backend`, `frontend`).
- **Pruebas de carga**: Locust (`backend/loadtests/locustfile.py`).

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
| Reportes         | `reportes`                 | `dashboard` (consume los endpoints)    | Core |
| Préstamos        | `prestamos`                | `prestamos`                            | Stretch |
| Traslados        | `traslados`                | `traslados`                            | Stretch |

Ver `docs/decisiones/` para el porqué de las decisiones marcadas arriba.

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
| `fisc-50` | `#edfdf4` | Fondos muy claros (nav activa, chip de rol) |
| `fisc-100` | `#d6fae6` | Texto claro sobre fondo verde oscuro |
| `fisc-200` | `#a4f4c8` | Texto secundario sobre fondo verde oscuro |
| `fisc-300` | `#65eca1` | Acentos claros (indicador "en línea") |
| `fisc-400`–`fisc-600` | `#1ce375`–`#118846` | Reservados, sin uso todavía |
| `fisc-700` | `#0d6d38` | Íconos/círculos secundarios (Login) |
| `fisc-800` | `#0d6936` | **Color primario** — botones, nav activa, enlaces, el verde real del logo |
| `fisc-900` | `#084021` | Hover de botones, degradados, fondo oscuro del Login |
| `fisc-950` | `#052915` | Reservado, sin uso todavía |

**Colores de estado** (badges y stat cards, en `shared/components/Badge.jsx`
y `StatCard.jsx`) — paleta estándar de Tailwind, independiente del verde de
marca porque comunican significado (bien/mal/alerta), no identidad:

| Tono | Significado | Clases |
|---|---|---|
| `good` | EN USO, EXISTE | `emerald-50` / `emerald-700` |
| `bad` | DAÑADO, EXTRAVIADO | `red-50` / `red-700` |
| `warn` | Alertas | `amber-50` / `amber-700` |
| `info` | ADICIONAR, Pendiente | `sky-50` / `sky-700` |
| `neutral` | Default | `gray-100` / `gray-700` |

## Pendiente de diseño (no resuelto en la estructura, sí en el modelo de datos real)

El mockup original usaba dos campos de estado distintos (`estatus`:
EXISTE/ADICIONAR/EXTRAVIADO/NO EXISTE, y `estado`: EN USO/DAÑADO) que no
mapean 1:1 al modelo limpio de tres estados del anteproyecto
(Activo/Inactivo/Inoperativo). `backend/apps/activos/models.py` implementa
por ahora solo el modelo de tres estados; la reconciliación con la idea de
`estatus` (probablemente un concepto de "último resultado de auditoría de
inventario" más que un campo del propio Activo) queda pendiente para el
Capítulo III (Diseño del Modelo de Datos) de la tesis.
