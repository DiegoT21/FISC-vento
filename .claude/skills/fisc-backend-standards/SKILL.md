---
name: fisc-backend-standards
description: Receta y estándares obligatorios para crear o modificar código del backend de FISC-vento (Django/DRF) — modelos, serializers, viewsets, permisos por rol, migraciones y tests. Usar siempre que se toque `backend/`, se agregue un endpoint, un campo o una regla de acceso.
---

# Backend FISC-vento — estándares

Complementa `CLAUDE.md` (que manda en caso de duda). Estructura: una app por dominio en `backend/apps/<dominio>/` con `models.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`, `migrations/`.

## Receta para una función nueva

1. **Modelo** (`models.py`)
   - Nombres en español sin tildes. Opciones como `models.TextChoices` con valores en MAYÚSCULAS y etiqueta legible (`ACTIVO = "ACTIVO", "Activo"`).
   - `help_text` en español en los campos no obvios. `verbose_name` en `Meta`. `__str__` útil.
   - FKs a catálogos con `on_delete=PROTECT`; a usuarios con `SET_NULL`. Campo único y opcional ⇒ `null=True, blank=True` (el vacío se guarda como `NULL`, nunca `""`).
   - `ordering` explícito en `Meta` (la paginación lo exige: evita `UnorderedObjectListWarning`).
2. **Migración**: `python manage.py makemigrations <app> -n <nombre_descriptivo>` y commitéala junto al modelo. Revisa que sea aditiva; una migración destructiva requiere confirmación.
3. **Serializer**
   - Expón nombres legibles de solo lectura para relaciones (`categoria_nombre = CharField(source="categoria.nombre", read_only=True)`), así la UI no hace N peticiones.
   - `read_only_fields` para campos de auditoría (`creado_en`, `actualizado_en`).
4. **ViewSet**
   - `queryset` con `select_related`/`prefetch_related` de todo lo que el serializer toca (verifícalo con `assertNumQueries`).
   - Filtros: `DjangoFilterBackend` + `SearchFilter` + `OrderingFilter` con `filterset_fields`, `search_fields`, `ordering_fields` explícitos.
   - **`permission_classes` explícitas** (ver abajo). Para reglas por acción, sobreescribe `get_permissions`.
5. **URLs**: registra en el router de la app; la ruta cuelga de `config/urls.py` como `api/<dominio>/`.
6. **Tests** (`tests.py`): modelo (restricciones, defaults, `__str__`) **y** API (lista, filtros, crear, validación, editar) **y** permisos por rol.

## Permisos por rol

Usa las clases de `apps/usuarios/permissions.py`; no escribas comprobaciones de rol sueltas en las vistas.

| Clase | Quién |
|---|---|
| `PuedeGestionarInventario` | lee todo autenticado; escriben Administrador y Custodio |
| `EscrituraSoloAdministrador` | lee todo autenticado; escribe solo Administrador |
| `SoloAdministradorYAuditor` | lee y escribe solo esos roles (Auditoría) |
| `SoloAdministradorYCustodio` | ídem (Traslados) |
| `EsAdministrador` | solo Administrador (Usuarios) |

Si la matriz cambia, actualiza clases, tests `PermisosPorRolTests` y `docs/diseno-paginas-y-modulos.md` **juntos**. Al borrar objetos protegidos (`PROTECT`), captura `ProtectedError` y responde 409/400 con mensaje claro en español; nunca dejes un 500.

## Errores y mensajes

Los mensajes de validación son en español y orientados a la persona (“Ya existe un activo con ese código”). La UI los muestra por campo; el formato DRF `{campo: [mensajes]}` y `non_field_errors` debe respetarse.

## Cómo probar aquí (Windows, sin Postgres)

```bash
# settings temporal FUERA del repo (p. ej. en el scratchpad): from config.settings.dev import *  + DATABASES sqlite
PYTHONUTF8=1 PYTHONPATH="<dir_del_settings>;." DJANGO_SETTINGS_MODULE=test_sqlite python manage.py test apps
```

Un venv en el scratchpad con `pip install -r requirements/dev.txt`. El CI usa Postgres 16: si algo es específico del motor, adviértelo.
