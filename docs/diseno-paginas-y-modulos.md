# FISC-vento — Diseño: páginas, módulos y secciones

Resumen de diseño/UX del sistema: qué pantallas existen, cómo se organizan
y qué falta por diseñar. No cubre tecnología ni implementación, solo
producto/interfaz.

## Sistema de diseño actual

- **Color primario**: verde institucional (usado en la navegación activa,
  botones principales, encabezados).
- **Colores de estado** (badges con punto y borde): verde = Activo, gris =
  Inactivo, rojo = Inoperativo, azul = informativo, ámbar = alerta. Los
  grises del sistema son la escala `slate`.
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

Esta matriz controla la navegación (el rol ya viene del login real). Ojo:
hoy solo oculta botones y enlaces en la interfaz; la API de Activos todavía
no aplica permisos por rol (`usuarios/permissions.py` los define pero no se
usan ahí). Vale la pena revisar la matriz con el asesor.

## Páginas y secciones (lo que existe hoy)

**1. Panel principal**
- 4 tarjetas de estadística con ícono (datos reales): Total de activos,
  Activos, Inactivos, Inoperativos.
- Panel "Pendientes de atención": alertas calculadas (activos inoperativos e
  inactivos). Si no hay ninguna, muestra "Todo en orden".

**2. Activos**
- Buscador (descripción, código o tag RFID) + filtros por categoría y estado,
  con paginación.
- Tabla: Descripción, Código, Categoría, Ubicación, Estado. Al hacer clic en
  una fila se abre un **drawer lateral** con el resumen y un enlace a la
  ficha completa.
- Botón "Registrar activo" (solo Administrador y Custodio): formulario
  modal con validación en cliente y errores del servidor por campo.
- **Ficha de un activo**: encabezado con nombre, código y estado, en 3
  pestañas:
  - *Información*: categoría, origen, departamento, ubicación, tag RFID y
    la **etiqueta de código de barras** (imagen con botones Descargar e
    Imprimir).
  - *Historial*: línea de tiempo con las fechas reales de registro y de
    última modificación (todavía no hay historial de movimientos).
  - *Documentos*: estado vacío "próximamente" (sin backend de documentos).
- Estados de carga (esqueletos), error con "Reintentar" y vacío.

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
  cada uno, leídos de la API. El botón "Nueva ubicación" aún no tiene
  formulario.

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
  `/api/reportes/resumen/`.

## Pendiente de diseñar

1. **Vista comparativa "antes (Excel) vs. después (sistema)"** para la
   sustentación de la tesis — los Reportes actuales cubren estado,
   categoría y departamento, pero no esta comparación.
2. **Formularios de edición y de otras entidades** — el alta de activos ya
   existe; faltan editar un activo, dar de alta una ubicación o un usuario y
   autorizar un traslado.
3. **Historial de movimientos y documentos del activo** — hoy el Historial
   solo muestra fechas de registro/modificación y Documentos está vacío.
4. **Responsive / uso en campo** — las tablas tienen scroll horizontal, pero
   el menú lateral no se colapsa en pantallas pequeñas; la pantalla de
   Escaneo en particular necesita un diseño para celular.
5. **Permisos por rol en la API** — ver nota bajo la matriz de roles.
