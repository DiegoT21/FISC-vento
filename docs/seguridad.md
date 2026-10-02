# Seguridad — pruebas y hallazgos

Responde al RNF-06 del documento teórico (autenticación segura, protección contra inyección SQL, XSS y CSRF) y deja evidencia verificable para el Capítulo IV.

## Pruebas automatizadas

Viven en `backend/pruebas_seguridad/` y corren con `python manage.py test`, así que el CI las ejecuta en cada push a `develop`. 60 pruebas:

| Archivo | Qué comprueba |
|---|---|
| `test_autenticacion.py` | Toda ruta de la API (descubierta automáticamente) rechaza peticiones sin token en los 5 métodos; tokens inválidos, manipulados o de usuarios desactivados; el token muere al cerrar sesión; el login no revela si un usuario existe, no se rompe con tipos de dato raros (objetos, listas, números, JSON mal formado), rechaza inyección SQL y limita los intentos repetidos por cuenta; ninguna respuesta de usuarios expone contraseñas ni permisos internos. |
| `test_autorizacion.py` | Matriz rol × recurso × método (Administrador, Custodio, Auditor × activos, categorías, ubicaciones, departamentos, préstamos, traslados, usuarios, auditoría): cada combinación debe dar exactamente lo que dice la matriz de permisos. Escalada de privilegios (crear superusuarios, cambiar el propio rol, sobrescribir campos de solo lectura) y protección CSRF. |
| `test_inyeccion.py` | Cargas SQL en búsqueda, filtros, orden, paginación e ids de ruta; entradas enormes, con tipos inesperados, con carácter nulo o que no son JSON; XSS almacenado y cabeceras de seguridad; que ningún error revele trazas ni detalles internos. |
| `test_configuracion.py` | Producción: sin `DEBUG`, hosts y CORS cerrados, cookies seguras, HTTPS y HSTS, y **se niega a arrancar sin una clave secreta fuerte**; `check --deploy` de Django sin avisos críticos. Común: middleware de seguridad, hash de contraseñas, validadores, límite de intentos de login configurado. |
| `test_repositorio.py` | Sin `.env`, llaves ni copias de base de datos versionadas; sin secretos incrustados (AWS, claves privadas, tokens de GitHub/Slack/Google); workflows sin credenciales en claro; el frontend sin `dangerouslySetInnerHTML`, `innerHTML`, `eval` ni tokens en consola. |

Al agregar un recurso nuevo a la API: las pruebas de autenticación lo cubren solas (descubren las rutas), pero hay que añadirlo a la lista `RECURSOS` de `test_autorizacion.py` con sus roles permitidos.

## Qué se encontró y se corrigió

| Hallazgo | Antes | Ahora |
|---|---|---|
| Login con un objeto, lista o número en `email`/`password` | Error 500 | Responde 400 |
| Login sin límite de intentos | Fuerza bruta ilimitada sobre una cuenta | 10 intentos por minuto por IP y cuenta, luego 429 |
| Producción sin `DJANGO_SECRET_KEY` | Arrancaba con una clave pública de desarrollo (sesiones y tokens firmados falsificables) | Se niega a arrancar si falta o tiene menos de 50 caracteres |
| Pillow 10.4 (dependencia de los códigos de barras) | 17 vulnerabilidades conocidas | Pillow 12.3: `pip-audit` sin hallazgos; `npm audit` también limpio |

Las pruebas se validaron "rompiendo a propósito" el código: dar permiso de escritura al Auditor hizo fallar 12 comprobaciones, y quitar el límite de intentos hizo fallar la suya.

## Pendiente de verificar en los servidores (no se puede ver desde el repositorio)

Prioridad alta, porque los servidores son lo que expone el sistema:

1. **Qué configuración usan staging y producción.** `.env.example` indica `config.settings.dev` (con `DEBUG=True`, `ALLOWED_HOSTS=*` y CORS abierto) y los smoke tests acceden por `http://`, algo incompatible con `config.settings.prod` (que fuerza HTTPS). Es probable que ambos servidores corran con ajustes de desarrollo. Revisar `backend/.env` en cada uno (sin pegar valores secretos aquí).
2. **Clave secreta real** definida en `DJANGO_SECRET_KEY`.
3. **Puertos expuestos.** `docker-compose.yml` publica PostgreSQL (`5432`) en el host, con contraseña por defecto `fiscvento`. Comprobar en los grupos de seguridad de AWS que `5432` **no** es accesible desde internet.
4. **Panel de administración de Django** (`:8000/admin/`) alcanzable desde internet; limitarlo por IP o ponerlo detrás de una VPN.
5. **HTTPS.** Todo viaja en claro (credenciales y token); además la cámara del navegador exige HTTPS (sprint de Escaneo).
6. **Servidores de desarrollo.** El despliegue usa `runserver` y el servidor de desarrollo de Vite; no están pensados para exposición pública (RNF-04 del documento describe Gunicorn y Nginx).

## Limitaciones conocidas

- El token de sesión se guarda en `localStorage`: ante un XSS, un atacante podría leerlo. No hay XSS conocido (React escapa el contenido y las pruebas vigilan las APIs peligrosas), pero conviene migrar a cookie `HttpOnly` si se añade contenido enriquecido.
- Los tokens no caducan; solo mueren al cerrar sesión o desactivar al usuario.
- El límite de intentos usa la caché del proceso: con varios workers cada uno cuenta por separado.
- Las pruebas corren con SQLite en local y con PostgreSQL en el CI; no se probó contra PostgreSQL localmente.
- No se hizo una prueba de penetración sobre los servidores desplegados; solo pruebas automatizadas sobre el código.
