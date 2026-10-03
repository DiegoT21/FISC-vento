---
name: fisc-frontend-standards
description: Receta y estándares obligatorios para crear o modificar código del frontend de FISC-vento (React/Vite) — módulos de API, hooks, páginas, formularios, rutas, roles y estados de carga/error/vacío. Usar siempre que se toque `frontend/src/` o se conecte una pantalla a la API. El aspecto visual lo rige `fisc-ui-designer`.
---

# Frontend FISC-vento — estándares

Complementa `CLAUDE.md`. Estructura: `src/features/<dominio>/` (mismo nombre que la app del backend), `src/shared/{api,hooks,components,layout,utils}`, `src/routes/router.jsx`. El aspecto (colores `fisc-*`, tipografía, componentes) está en el skill `fisc-ui-designer`.

## Conectar una pantalla a la API

1. **Endpoint**: debe existir en `shared/api/endpoints.js` (`ENDPOINTS.X`).
2. **Módulo de API** `shared/api/<dominio>.js`: funciones con nombre en español (`listarActivos`, `obtenerActivo`, `crearActivo`) sobre `get/post/put/del` de `client.js`. **Nunca** `fetch` directo en componentes. Las listas completas (selectores) usan `listarTodos` (la API pagina de 25 en 25).
3. **Datos**: `useApi(fn, deps)` devuelve `{ data, error, cargando }` y descarta respuestas viejas. Búsquedas con *debounce* (~300 ms) y reinicio a página 1 al cambiar filtros.
4. **Mocks**: `src/mocks/*` solo para módulos aún no conectados. Al conectar uno, deja de importarlo; no mezcles datos reales y de ejemplo en una misma vista, y no dejes contenido de ejemplo que parezca real (márcalo o quítalo).
5. **Ruta**: registrar en `routes/router.jsx`; las rutas fijas (`activos/nuevo`) van **antes** de las dinámicas (`activos/:id`).

## Todo componente que lee la API cubre 4 estados

Cargando · error (mensaje en español, sin códigos, acción de reintento) · vacío (con la acción siguiente, p. ej. “Crea el primero con …”) · con datos. Distingue 404 (“no encontrado”) de fallo de red.

## Formularios

- Controlados; campos con `*` para obligatorios; `required`/`maxLength` coherentes con el modelo.
- Opcional + único en backend ⇒ envía `null`, no `""`. Convierte ids de selectores con `Number()`.
- Errores del servidor: `err.status` y `err.data` (formato DRF `{campo: [msgs]}`); muéstralos **bajo cada campo** y `non_field_errors` aparte. Traduce los técnicos a lenguaje llano. 403 ⇒ “No tienes permiso…”.
- Evita doble envío (`guardando`) y no navegues hasta que el servidor responda 2xx.

## Roles en la UI

`useRole()` devuelve el rol en Título-Caso (`"Administrador"`, `"Custodio"`, `"Auditor"`). Úsalo para **ocultar** acciones no permitidas, sabiendo que es solo cosmético: la autoridad es la API (`CLAUDE.md` §4). La visibilidad del menú está en `Sidebar.jsx` (`roles:`).

## Valores del dominio

Etiquetas legibles y tonos de `Badge` viven en `shared/utils/estado.js` (`ESTADO_ACTIVO`, `ORIGEN_ACTIVO`, `estadoTone`). No dupliques literales como “INOPERATIVO” en componentes: agrégalos ahí. Sin QR, nunca.

## Calidad

- Código y comentarios en español; sin comentarios que narren lo obvio.
- `npm run lint` sin errores nuevos y `npm run build` verde antes de dar algo por terminado.
- Archivos `.jsx` pueden estar en CRLF: al editar por script, normaliza y usa UTF-8.
- **No leas `shared/layout/Sidebar.jsx` completo** (logo base64 enorme): `Read` con `limit` o `grep -n`.
- Probar en el navegador el flujo real; sin Postgres, backend con SQLite temporal fuera del repo y `VITE_API_BASE_URL=http://localhost:8000`.
