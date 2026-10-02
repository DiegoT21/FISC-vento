# FISC-vento — Reglas maestras

Se cargan en **cada** sesión. Si algo aquí choca con lo que se te pide, avisa antes de actuar. Detalle por área: skills `fisc-backend-standards`, `fisc-frontend-standards` y `fisc-ui-designer` (en `.claude/skills/`).

## 1. Qué es esto

Sistema de gestión y captura de activos de la FISC (UTP, Panamá). Trabajo de graduación de Laura Saucedo y Diego Torres, 2026. Stack fijo: Django + DRF + PostgreSQL / React (Vite) + Tailwind / Docker. Arquitectura y mapa de dominios: `docs/arquitectura.md`. **Plan y trazabilidad contra el documento teórico del trabajo de graduación: `docs/plan-trabajo-grado.md`** (consúltalo antes de decidir alcance y mantenlo al día). Diseño de páginas: `docs/diseno-paginas-y-modulos.md`.

## 2. Decisiones cerradas (no re-abrir sin que el usuario lo pida)

- **Sin QR, por ahora.** Solo código de barras (el que ya traen las placas) y RFID. ADR `docs/decisiones/0001-rfid-en-alcance.md`. ⚠️ El documento teórico todavía incluye QR: la decisión final está pendiente (D1 en `docs/plan-trabajo-grado.md`). Hasta que el usuario decida, no generes ni leas QR ni añadas `qrcode`.
- **Estados de un Activo:** hoy `ACTIVO`, `INACTIVO`, `INOPERATIVO` (enum `EstadoActivo`). ⚠️ RF-09 del documento teórico pide además `ESTATUS` (Adicionar/Existe/Extraviado/No existe) y `ESTADO DEL BIEN`: decisión pendiente (D2 en `docs/plan-trabajo-grado.md`). No cambies el modelo de estados sin que el usuario decida.
- **Core:** usuarios, ubicaciones, activos, escaneo, auditoría, reportes. **Stretch (provisional):** préstamos y traslados. ⚠️ El documento teórico los incluye en el alcance (RF-07/RF-08): decisión pendiente (D3 en `docs/plan-trabajo-grado.md`). ADR 0002.
- Toda decisión de alcance nueva se registra como ADR en `docs/decisiones/` (formato de los existentes).

## 3. Idioma y tono

- **Todo en español**: textos de interfaz, mensajes de error, comentarios, docs, commits y respuestas al usuario. Dominio en español sin tildes en identificadores (`ubicacion`, `descripcion`, `Activo`, `Categoria`); el inglés queda para lo técnico genérico (`useApi`, `client`).
- **Interfaz:** trato de **tú**, directo y amable (“Intenta de nuevo”, “No tienes permiso para…”). Sin jerga técnica ni códigos al usuario: nunca “400”, “constraint” o “conjunto único”; di qué pasó y qué hacer.
- **Comentarios:** solo el *porqué* no obvio, en español, sin narrar el código. Misma densidad que el código vecino.
- **Commits:** `tipo: descripción en minúscula` (`feat`, `fix`, `docs`, `test`, `ci`, `refactor`), imperativo, en español. Cuerpo breve explicando el porqué.

## 4. Roles y permisos (regla de seguridad)

Roles: `ADMINISTRADOR`, `CUSTODIO`, `AUDITOR` (`apps/usuarios/models.py`). **El backend es la autoridad**: ocultar un botón en React es cosmético, nunca sustituye al permiso en la API. Todo endpoint nuevo declara `permission_classes` explícitas con las clases de `apps/usuarios/permissions.py`; nunca dependas solo del default `IsAuthenticated` para escrituras. Matriz vigente en `docs/diseno-paginas-y-modulos.md` y en los tests `PermisosPorRolTests`.

## 5. Definición de “terminado”

Una tarea no está hecha hasta que:
1. Backend: hay tests nuevos y `python manage.py test` pasa (incluye `backend/pruebas_seguridad/`; no la desactives ni la silencies: si falla, hay un hueco de seguridad real o la matriz de permisos cambió); las migraciones están generadas y commiteadas.
2. Frontend: `npm run lint` sin errores nuevos y `npm run build` pasa.
3. Si tocó UI, se probó el flujo real (no solo compilar). Si no pudiste probarlo, **dilo explícitamente**.
4. Estados de carga, error y vacío cubiertos en toda pantalla que lea la API.
5. Se respetó la sección 2 y se actualizó `docs/` si cambió una decisión o la arquitectura.

## 6. Git, CI y despliegue

- **Todo cambio pasa primero por Staging, siempre.** Nunca despliegues ni promociones algo a producción que no haya pasado antes por staging. Nunca hagas push a `main` ni dispares `deploy-production.yml` a mano.
- **Cierre obligatorio de cada respuesta:** termina *siempre* con la pregunta “¿Lo subo a producción?” (indica en una línea el estado: qué está solo local, qué ya está en staging, qué ya está en producción). Preguntar no autoriza nada: solo un “sí” explícito del usuario en esa conversación habilita subir a producción, y vale únicamente para lo que se preguntó.
- **Cómo funciona el pipeline** (`.github/workflows/`):
  - Push a `develop` → `pipeline.yml`: tests → deploy a **staging** → smoke HTTP y de navegador. **Termina ahí**; ya no llega a producción.
  - Producción solo con `deploy-production.yml` ("Promover a producción"), manual (`workflow_dispatch`): verifica que el commit actual de `develop` pasó el pipeline de staging, mergea `develop` en `main`, despliega y corre smoke tests. El entorno `production` de GitHub debe exigir un revisor (ver `docs/arquitectura.md`).
- **Tu flujo:** push a `develop` solo con visto bueno del usuario → reporta el resultado de staging (tests, smoke HTTP y de navegador) antes de decir que algo está listo → pregunta “¿Lo subo a producción?”. **Nunca dispares la promoción a producción tú mismo**: la acciona el usuario desde GitHub Actions, o te la pide explícitamente.
- **No hagas push ni abras PR sin que el usuario lo pida.** Commits locales frecuentes y atómicos sí.
- Los `.sh` llevan finales **LF** (`.gitattributes`); no los conviertas.
- Pie de commit/PR: el que indique el sistema (Co-Authored-By de Claude).

## 7. Seguridad e higiene

- Nada de secretos, `.env`, dumps ni backups en el repo (`.env.example` sí). Los backups viven en el servidor.
- Credenciales de prueba solo en entornos locales y nunca repetidas en commits, docs o respuestas.
- Prohibido en datos reales: `drop`, `flush`, borrados masivos o migraciones destructivas sin confirmación explícita.
- Sin dependencias nuevas sin justificarlas; si añades una, va a `requirements/base.txt` o `package.json` y se menciona.

## 8. Trampas conocidas (entorno Windows) — léelas antes de editar

- **Codificación:** al editar con Python usa `PYTHONUTF8=1` y `open(..., encoding="utf-8")`; el default (cp1252) corrompe tildes y `ñ`. Los archivos pueden ser CRLF: normaliza al leer o tus `replace` multilínea no coincidirán.
- Git avisa “LF will be replaced by CRLF”: es normal, ignóralo.
- **No leas `frontend/src/shared/layout/Sidebar.jsx` completo** ni lo imprimas con `cat`: contiene el logo en base64 (cientos de KB). Usa `Read` con `limit`/`offset` o `grep -n`.
- **No hay Postgres local.** Para correr tests/servidor usa un settings temporal con SQLite **fuera del repo** (`from config.settings.dev import *` + `DATABASES` sqlite). CI sí usa Postgres 16; si algo depende del motor, dilo.
- Sin autenticación la API responde **403**, no 401 (SessionAuthentication va primero).
- La API pagina de 25 en 25: para selectores o vistas que necesitan todo, usa `listarTodos`.
- En PowerShell/Git Bash los separadores y rutas difieren: `PYTHONPATH` en Windows usa `;`.
