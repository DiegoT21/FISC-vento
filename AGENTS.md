# FISC-vento — guía para agentes (Codex, Antigravity, Cursor)

Resumen. Las reglas completas (idioma, roles, definición de terminado, seguridad) están en `CLAUDE.md`.

## Stack
- Backend: Django + DRF + PostgreSQL (`backend/`). Docker Compose.
- Frontend (`frontend/`): React 19 + Vite 8 + Tailwind 3.4, JS/JSX (sin TS), react-router 7, lucide-react. Alias `@` → `frontend/src`.
- UI: shadcn/ui (estilo new-york, Tailwind v3) en `frontend/src/components/ui`; `cn()` en `frontend/src/lib/utils.js`.

## Comandos
- Frontend: `npm ci`, `npm run lint` (oxlint, sin errores nuevos), `npm run build`.
- Backend: `python manage.py test` (sin Postgres local: settings SQLite temporal fuera del repo, ver `CLAUDE.md` §8).
- Nuevo componente shadcn: `cd frontend && npx shadcn@latest add <nombre>` (MCP `shadcn` en `.mcp.json` / `.cursor/mcp.json`).

## Git
- Rama propia desde `develop` por tarea y PR hacia `develop`. Nunca push ni PR a `main`; nunca dispares el deploy a producción.
- Commits en español: `tipo: descripción en minúscula`.
- Toca solo tu área asignada. Nada de secretos, `.env` ni `.pem`.

## UI (obligatorio)
1. Primero `.claude/skills/fisc-ui-designer/SKILL.md`: paleta `fisc-*`, primario `fisc-800`, hover `fisc-700`.
2. Reutiliza `frontend/src/components/ui` antes de crear componentes; `primary`/`ring` ya equivalen a `fisc-800`, neutros slate.
3. Revisa con `.agents/skills/web-design-guidelines` (accesibilidad, rendimiento, táctil). Guía de shadcn: `.agents/skills/shadcn`.
4. Objetivos táctiles ≥ 44 px (`min-h-11 min-w-11`) en todo lo que se use desde la pistola TC22r.
5. Librerías pesadas (gráficas, etc.) con `React.lazy`; nada pesado en el bundle inicial.
6. Animación solo con Motion vía `LazyMotion` + `domAnimation` y `m.*` (no `motion.*`); respeta `prefers-reduced-motion`.
7. Transiciones entre páginas: prefiere `viewTransition` de react-router.
8. No cargues `design-taste-frontend` (muy pesado) salvo que te lo pidan.
9. Textos en español, trato de tú, sin jerga técnica; estados de carga, error y vacío siempre.
