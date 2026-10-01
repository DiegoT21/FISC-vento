# FISC-vento — Diseño: páginas, módulos y secciones

Resumen de diseño/UX del sistema: qué pantallas existen, cómo se organizan
y qué falta por diseñar. No cubre tecnología ni implementación, solo
producto/interfaz.

## Sistema de diseño actual

- **Color primario**: verde institucional (usado en la navegación activa,
  botones principales, encabezados).
- **Colores de estado** (badges/etiquetas): verde = estado positivo (EN
  USO, EXISTE), rojo = estado crítico (DAÑADO, EXTRAVIADO/NO EXISTE), azul
  = informativo (ADICIONAR, Pendiente), ámbar = alerta, gris = neutral.
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
| Ubicaciones | ✅ | — | ✅ |
| Préstamos *(stretch)* | ✅ | ✅ | ✅ |
| Traslados *(stretch)* | ✅ | ✅ | — |
| Auditoría | ✅ | — | ✅ |
| Administración | ✅ | — | — |

Esta matriz es la del mockup actual — vale la pena revisarla con el asesor,
ya que hoy el rol se elige manualmente (modo demo), no viene de un login
real.

## Páginas y secciones (lo que existe hoy)

**1. Panel principal**
- 5 tarjetas de estadística: Total de activos, En uso, Dañados, Traslados
  pendientes, Préstamos activos.
- Panel "Pendientes de atención": lista de alertas con su etiqueta de
  estado (ej. activos sin estatus definido, activo extraviado, traslado
  esperando autorización).
- Sin gráficas — solo números y texto.

**2. Activos**
- Buscador (por descripción o código) + filtro por categoría.
- Tabla: Descripción, código, Ubicación, Estatus, Estado.
- Botón "Registrar activo" (visual, sin flujo de formulario todavía).
- **Detalle de un activo**: encabezado con nombre, referencia y badges de
  estatus/estado, organizado en 3 pestañas:
  - *Información*: categoría, origen, ubicación, identificador RFID.
  - *Historial*: pestaña presente en la navegación, sin contenido diseñado
    aún.
  - *Documentos*: idem, sin contenido diseñado aún.

**3. Escaneo**
- Selector entre modo "Código de barras" y "Lector RFID" (no hay modo QR — los activos ya usan código de barras físico, y RFID es el método nuevo que añade este proyecto).
- Vista de cámara (simulada).
- Botón "Simular lectura" que resuelve un activo de ejemplo.

**4. Ubicaciones**
- Departamentos (ej. TI, Dirección FISC, Docencia) con sus
  sub-ubicaciones (oficinas, salones, laboratorios) agrupadas debajo de
  cada uno.

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

## Pendiente de diseñar

1. **Reportes con gráficas** — es un requisito del proyecto ("generación
   de reportes detallados") y hoy no existe ninguna pantalla ni sección
   con visualizaciones. Falta diseñar: una vista de Reportes (o ampliar el
   Panel principal) con al menos un gráfico por estado del inventario
   (Activo/Inactivo/Inoperativo) y uno por ubicación/departamento, más una
   vista comparativa "antes (Excel) vs. después (sistema)" para la
   sustentación de la tesis.
2. **Pantalla de inicio de sesión** — hoy el rol activo se elige en un
   selector de modo demo; falta diseñar la pantalla de login real y cómo
   se ve el sistema para un usuario recién autenticado.
3. **Formularios de alta/edición** — "Registrar activo", dar de alta una
   ubicación o usuario, autorizar un traslado: existen los botones/acciones
   pero no el formulario ni el flujo paso a paso.
4. **Contenido de las pestañas Historial y Documentos** en el detalle de
   Activo — están en la navegación pero vacías; falta decidir qué
   información muestran y cómo se ve.
5. **Visualización del código de barras generado** — no hay un lugar en
   la interfaz (lista o detalle de un activo) donde se vea/descargue la
   imagen del código para imprimir la etiqueta.
6. **Responsive / uso en campo** — si el escaneo se va a usar desde el
   celular dentro de un laboratorio u oficina, esa pantalla en particular
   necesita un diseño adaptado a pantallas pequeñas; el resto del sistema
   puede seguir siendo de escritorio.
