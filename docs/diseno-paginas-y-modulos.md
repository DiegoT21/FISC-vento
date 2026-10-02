# FISC-vento — Diseño: páginas, módulos y secciones

Resumen de diseño/UX del sistema: qué pantallas existen, cómo se organizan
y qué falta por diseñar. No cubre tecnología ni implementación, solo
producto/interfaz.

## Sistema de diseño actual

- **Color primario**: verde institucional (usado en la navegación activa,
  botones principales, encabezados).
- **Colores de estado** (badges con punto y borde): verde = Activo, ámbar =
  Inactivo o alerta, rojo = Inoperativo, azul = informativo. Los grises del
  sistema son la escala `slate`.
- **Iconografía**: un ícono distinto por módulo de navegación, consistente
  en todo el sidebar.
- **Layout**: barra lateral fija con logo/branding de la FISC + contenido
  principal a la derecha. Tarjetas blancas con borde suave y esquinas
  redondeadas como contenedor estándar (stat cards, tablas, paneles).
- **Sin modo oscuro ni diseño responsive/mobile todavía** — la interfaz
  está pensada para escritorio.

## Mapa de navegación por rol

| Módulo | Administrador | Custodio | Auditor |
|---|:---:|:---:|:---:|
| Panel principal | ✅ | ✅ | ✅ |
| Activos | ✅ | ✅ | ✅ |
| Escaneo Barras/RFID | ✅ | ✅ | ✅ |
| Reportes | ✅ | — | ✅ |
| Ubicaciones | ✅ | — | ✅ |
| Préstamos *(stretch)* | ✅ | ✅ | ✅ |
| Traslados *(stretch)* | ✅ | ✅ | — |
| Auditoría | ✅ | — | ✅ |
| Administración | ✅ | — | — |

Esta matriz controla la navegación (el rol viene del login real). Los
permisos los aplica la API (`usuarios/permissions.py`, probados en
`PermisosPorRolTests` y `backend/pruebas_seguridad/`); la interfaz solo
oculta lo que el rol no puede usar. Vale la pena revisar la matriz con el
asesor.

## Páginas y secciones (lo que existe hoy)

**1. Panel principal**
- Tarjetas con ícono y datos reales: Total de activos, Activos, Inactivos,
  Inoperativos, Traslados pendientes (no se muestra al Auditor) y Préstamos
  activos.
- Panel "Pendientes de atención": alertas calculadas (activos inoperativos,
  traslados esperando autorización, activos sin responsable o sin etiqueta
  RFID). Si no hay ninguna, muestra "Todo en orden".

**2. Activos**
- Buscador (descripción, código, REF, serie, marca o modelo) + filtros por
  categoría, estado, origen y ubicación, con paginación y botón para limpiar
  filtros.
- Tabla: Descripción, Código, Categoría, Ubicación, Estado. Al hacer clic en
  una fila se abre la ficha.
- Botón "Registrar activo" (Administrador y Custodio): página de formulario
  (`/dashboard/activos/nuevo`) con validación; la misma pantalla sirve para
  editar (`/activos/:id/editar`).
- **Ficha de un activo**: encabezado con nombre, código y estado, botones
  Editar (Administrador y Custodio) y Eliminar (solo Administrador), en 3
  pestañas:
  - *Información*: categoría, origen, ubicación, tag RFID, REF, número de
    serie, marca, modelo y la **etiqueta de código de barras** (imagen con
    botones Descargar e Imprimir).
  - *Historial*: línea de tiempo con las fechas reales de registro y de
    última modificación (todavía no hay historial de movimientos).
  - *Documentos*: estado vacío "próximamente" (sin backend de documentos).

**3. Escaneo**
- Selector entre modo "Código de barras" y "Lector RFID" (no hay modo QR — los activos ya usan código de barras físico, y RFID es el método nuevo que añade este proyecto).
- Campo de lectura con foco automático: sirve para lectores de mano y RFID
  que escriben como teclado y pulsan Enter. Resuelve contra
  `POST /api/escaneo/escanear/`.
- Resultado: tarjeta del activo encontrado (enlaza a su ficha) o aviso de
  que no existe. "Simular lectura" toma un activo al azar para demos.

**4. Ubicaciones**
- Departamentos (ej. TI, Dirección FISC, Docencia) con sus
  sub-ubicaciones (oficinas, salones, laboratorios) agrupadas debajo de
  cada uno, leídos de la API. El Administrador puede crear, renombrar y
  eliminar departamentos y ubicaciones.

**5. Préstamos** *(módulo stretch — prioridad baja)*
- Tabla de activos prestados a una persona, con estado Activo/Devuelto.

**6. Traslados** *(módulo stretch — prioridad media)*
- Tabla de solicitudes de movimiento entre ubicaciones, con estado
  Pendiente/Autorizado.

**7. Auditoría**
- Tabla de registro de actividad: usuario, acción realizada, sobre qué
  tabla/entidad, y fecha.

**8. Administración**
- Tabla de usuarios del sistema: nombre, usuario, rol asignado.

**9. Reportes** *(Administrador y Auditor)*
- Dona de activos por estado con porcentajes, y barras por categoría y por
  departamento (SVG, sin librerías de gráficos). Datos de
  `/api/reportes/distribucion/`.

## Pendiente de diseñar

1. **Vista comparativa "antes (Excel) vs. después (sistema)"** para la
   sustentación de la tesis — los Reportes actuales cubren estado,
   categoría y departamento, pero no esta comparación.
2. **Formularios de otras entidades** — el alta y edición de activos y la
   gestión de ubicaciones ya existen; faltan dar de alta un usuario,
   registrar un préstamo y autorizar un traslado.
3. **Historial de movimientos y documentos del activo** — hoy el Historial
   solo muestra fechas de registro/modificación y Documentos está vacío.
4. **Responsive / uso en campo** — las tablas tienen scroll horizontal, pero
   el menú lateral no se colapsa en pantallas pequeñas; la pantalla de
   Escaneo en particular necesita un diseño para celular.
