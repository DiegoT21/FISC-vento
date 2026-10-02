---
name: fisc-ui-designer
description: Proporciona pautas de UI/UX y reglas de maquetación para el sistema de inventario y captura de activos de la FISC (UTP). Usar cuando el usuario pida diseñar, maquetar, refinar o generar componentes o vistas de la interfaz usando el tema claro y el sistema de diseño oficial fisc-*.
---

# FISC UI Designer - Sistema de Inventario y Captura de Activos

Guía y estándares de maquetación UI/UX para el sistema de inventario de activos de la Facultad de Ingeniería de Sistemas Computacionales (FISC - UTP). Esta habilidad fuerza una interfaz profesional, clara, eficiente y optimizada para el tema claro (Light Theme).

## 1. Tokens de Diseño y Paleta fisc-*

Toda la aplicación utiliza la paleta oficial derivada del sello/logo de la FISC:

| Token | Hex | Uso Típico en Interfaz |
|---|---|---|
| `fisc-50` | `#edfdf4` | Fondos de contenedor ultraclaros, hover sutil de filas |
| `fisc-100` | `#d6fae6` | Fondos de badges/tags, banners de estado |
| `fisc-200` | `#a4f4c8` | Bordes activos, acentos de selección claros |
| `fisc-300` | `#65eca1` | Indicadores y estados destacados |
| `fisc-400` | `#1ce375` | Indicador de éxito / estado activo brillante |
| `fisc-500` | `#15ac59` | Color intermedio para bordes/botones de apoyo |
| `fisc-600` | `#118846` | Botones secundarios, bordes marcados |
| `fisc-700` | `#0d6d38` | Hover de botones primarios (`hover:bg-fisc-700`) |
| `fisc-800` | `#0d6936` | Color de Marca Principal (Header, Sidebar, Botones primarios, Tabs activos) |
| `fisc-900` | `#084021` | Textos de alto contraste sobre fondos claros, iconos activos |
| `fisc-950` | `#052915` | El más oscuro; textos principales de encabezado |

## 2. Pautas Estructurales y de Maquetación (Light Theme)

### Layout General (Shell)

- Fondo de Pantalla (Body): el azul claro `#E5F2FF` que usa `AppShell.jsx` (decisión del equipo; `bg-slate-50` solo como alternativa neutra).
- Sidebar / Header Principal: `bg-fisc-800` o `bg-white border-b border-slate-200/80` con acentos `fisc-800`.
- Tarjetas y Tablas: `bg-white border border-slate-200/80 shadow-sm rounded-xl`.

### Tipografía y Jerarquía

- Pila tipográfica: `font-sans` (sistema por defecto).
- IDs, códigos de barras, etiquetas RFID y números de serie: usar estrictamente fuente monoespaciada (`font-mono text-xs text-slate-500 tracking-tight`).
- Valores numéricos de stock y precios: alineación a la derecha (`text-right font-mono font-semibold`).

### Iconografía

- Librería: `lucide-react`.
- Tamaño por defecto: `w-4 h-4` para tablas y badges; `w-5 h-5` para acciones de cabecera y botones principales.

## 3. Escala Tipográfica del Sistema

Para mantener consistencia en todo el proyecto, aplicar las siguientes clases semánticas de Tailwind:

| Nivel / Rol | Clases Tailwind | Ejemplo de Uso |
|---|---|---|
| H1 (Page Title) | `text-2xl font-bold tracking-tight text-slate-900` | Título principal de módulo (ej. Inventario General) |
| H2 (Section Header) | `text-lg font-semibold text-slate-900` | Títulos de secciones o tarjetas de resumen |
| H3 (Card / Modal Title) | `text-base font-semibold text-slate-800` | Encabezados de paneles laterales o modales |
| Body / Standard | `text-sm font-normal text-slate-700` | Celdas de tablas, descripciones, inputs |
| Caption / Muted | `text-xs font-normal text-slate-500` | Subetiquetas, metadatos, marcas de tiempo |
| Code / Tag ID | `font-mono text-xs font-medium text-fisc-900` | Tags RFID, códigos de barras, números de serie |

## 4. Patrones de Componentes UI

### A. Badge de Estado (Light Semantic Badges)

```html
<!-- Disponible / Asignado -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-fisc-100 text-fisc-900 border border-fisc-300/60">
  <span class="w-1.5 h-1.5 rounded-full bg-fisc-500"></span>
  Operativo
</span>

<!-- Mantenimiento / Pendiente -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
  En Mantenimiento
</span>
```

### B. Botones (Primary & Secondary)

```html
<!-- Botón Primario -->
<button class="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-fisc-500/20">
  <Plus className="w-4 h-4" />
  Capturar Activo
</button>

<!-- Botón Secundario -->
<button class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors">
  <Filter className="w-4 h-4 text-slate-500" />
  Filtrar
</button>
```

### C. Zona de Escaneo / Captura de Activos

```html
<div class="border-2 border-dashed border-fisc-200 bg-fisc-50/50 hover:bg-fisc-50 rounded-xl p-8 text-center transition-colors cursor-pointer">
  <div class="w-12 h-12 rounded-full bg-fisc-100 text-fisc-800 flex items-center justify-center mx-auto mb-3">
    <ScanLine className="w-6 h-6" />
  </div>
  <p class="text-sm font-medium text-slate-900">Listos para escanear código de barras / RFID</p>
  <p class="text-xs text-slate-500 mt-1">Acerca el lector o arrastra el archivo de captura masiva</p>
</div>
```

## 5. Reglas de Salida al Generar Componentes

- Usar siempre React + Tailwind CSS e iconos de `lucide-react`.
- Aplicar `fisc-800` como tono dominante de marca y `fisc-50` / `fisc-100` para estados activos/hover.
- Estructurar vistas complejas en patrón Tabla + Drawer/Slide-over lateral para detalles de activos.
- Asegurar que todos los campos de código/ID usen la clase `font-mono`.
- El sistema usa solo código de barras y RFID para identificar activos; no existe QR en ninguna parte del proyecto (ver `docs/decisiones/0001-rfid-en-alcance.md`). No generar componentes, textos ni íconos de QR.
