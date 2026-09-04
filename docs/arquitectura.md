# Arquitectura — FISC-vento

## Stack (fijado por el anteproyecto)

- **Backend**: Django + Django REST Framework, PostgreSQL.
- **Frontend**: React (Vite), Tailwind CSS.
- **Identificación de activos**: QR, código de barras y RFID.
- **Contenerización**: Docker / docker-compose (servicios `db`, `backend`, `frontend`).
- **Pruebas de carga**: Locust (`backend/loadtests/locustfile.py`).

## Apps del backend ↔ features del frontend

Cada dominio tiene el mismo nombre en ambos lados para que sea fácil ubicar
el código correspondiente:

| Dominio         | Backend (`backend/apps/`) | Frontend (`frontend/src/features/`) | Estado |
|------------------|----------------------------|----------------------------------------|--------|
| Usuarios/roles   | `usuarios`                | `administracion`                       | Core |
| Ubicaciones      | `ubicaciones`              | `ubicaciones`                          | Core |
| Activos          | `activos`                  | `activos`                              | Core |
| Escaneo (QR/barras/RFID) | `escaneo`          | `escaneo`                              | Core |
| Auditoría        | `auditoria`                | `auditoria`                            | Core |
| Reportes         | `reportes`                 | `dashboard` (consume los endpoints)    | Core |
| Préstamos        | `prestamos`                | `prestamos`                            | Stretch |
| Traslados        | `traslados`                | `traslados`                            | Stretch |

Ver `docs/decisiones/` para el porqué de las decisiones marcadas arriba.

## Pendiente de diseño (no resuelto en la estructura, sí en el modelo de datos real)

El mockup original usaba dos campos de estado distintos (`estatus`:
EXISTE/ADICIONAR/EXTRAVIADO/NO EXISTE, y `estado`: EN USO/DAÑADO) que no
mapean 1:1 al modelo limpio de tres estados del anteproyecto
(Activo/Inactivo/Inoperativo). `backend/apps/activos/models.py` implementa
por ahora solo el modelo de tres estados; la reconciliación con la idea de
`estatus` (probablemente un concepto de "último resultado de auditoría de
inventario" más que un campo del propio Activo) queda pendiente para el
Capítulo III (Diseño del Modelo de Datos) de la tesis.
