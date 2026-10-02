# Plan del trabajo de graduación y verificación contra el sistema

Fuente: `docs/trabajo-teorico/1. Trabajo Teorico - Diego y Laura.pdf` (43 páginas; el Capítulo IV, la dedicatoria y el agradecimiento están vacíos). Verificado contra el código de la rama `develop` al 2026-10-01.

Leyenda: ✅ cumplido · 🟡 parcial · ❌ no iniciado · ⚠️ contradice la decisión vigente.

## 1. Resumen

| Área | Estado |
|---|---|
| Infraestructura y despliegue (Docker, CI/CD, 2 servidores, backups) | ✅ por encima de lo prometido |
| Autenticación y roles (RF-01) | ✅ |
| Activos, ubicaciones, panel, búsqueda (RF-02/04/06) | 🟡 casi completo; faltan las fotografías |
| Escaneo (RF-05) | 🟡 backend listo; interfaz es simulada |
| Préstamos, traslados (RF-07/08) | 🟡 solo esqueleto en backend; interfaz simulada |
| Auditoría (RF-11) | 🟡 existe, pero **no cumple lo prometido** (ver §3) |
| Documentos, ingreso rápido, fotos (RF-02/03/10) | ❌ |
| Pruebas de carga y Capítulo IV (RNF-01/02, objetivo VII) | ❌ |

**Hallazgo principal:** el documento teórico se contradice a sí mismo y también contradice lo que decidimos al programar. Hay 4 decisiones que tomar antes de seguir (§2). Mientras no se tomen, cualquier avance puede quedar descartado en la sustentación.

## 2. Decisiones pendientes (bloquean el plan)

### D1 — QR: ¿sí o no?
- **El documento lo incluye** en: alcance (punto 5), objetivos II y IV, RF-05, RNF-01, 3.4, 3.7 y Tabla 2 (con un rol propio: "consultas puntuales o préstamos").
- **El código lo excluye** por la decisión `docs/decisiones/0001-rfid-en-alcance.md` ⚠️: los activos ya traen código de barras y un QR sería redundante.
- Nota: los Capítulos I y II hablan de "barras y QR" sin RFID; los Capítulos II (tablas) y III hablan de "RFID + QR + barras". El anteproyecto original no tenía RFID.
- **Opciones:** (a) quitar QR del documento y dejar barras + RFID (coincide con el código y con la realidad de las placas); (b) reincorporar QR al sistema.
- **Recomendación:** (a). Implica editar los puntos listados arriba, Tabla 2, la Ilustración 5 y la bibliografía de QR (Vargas, Lema, IBM) o reubicarla como trabajo relacionado.

### D2 — Estados del activo: ¿3 estados o 2 dimensiones?
- **Capítulos I y II / alcance:** un solo ciclo de vida con 3 estados: Activo, Inactivo, Inoperativo (objetivo, mejoras 6, Ilustración 2).
- **RF-09, Tabla 1, 3.5 y E-R:** dos dimensiones independientes: **ESTATUS** (Adicionar / Existe / Extraviado / No existe) y **ESTADO DEL BIEN** (En uso / Dañado / Baja tramitada), "alineado a la normativa UTP".
- **El código** implementa solo los 3 estados ⚠️ respecto a RF-09. El `estatus` quedó fuera.
- **Propuesta para unificarlos:** `estado` (ciclo de vida: Activo / Inactivo / Inoperativo, más "Baja tramitada" si se quiere) y `estatus` como resultado de la última verificación en una auditoría física (Existe / Extraviado / No existe / Adicionar). Así el documento no se contradice y el estatus sale naturalmente del Escaneo.
- Necesita tu confirmación y la del asesor, porque RF-09 cita normativa UTP.

### D3 — Préstamos y Traslados: ¿núcleo o extra?
- **El documento** los pone en el alcance (punto 3), en el objetivo V y en RF-07/RF-08, con campos oficiales UTP (condición del bien, motivo, firmas digitales, consecutivo, autorización de Vicerrectoría).
- **El código** los trata como *stretch* (`docs/decisiones/0002-prestamos-traslados-stretch.md`) ⚠️ y hoy son un esqueleto mínimo.
- **Recomendación:** pasarlos a núcleo. Para el tribunal, lo que está en el alcance y no se entrega pesa más que lo que se excluyó con justificación.

### D4 — Campos del activo que el documento exige y el modelo no tiene
RF-02 pide: **REF** (correlativo interno), **número de serie**, **marca**, **modelo**, **fotografías** y tipo (mobiliario/equipo). RNF-03 exige unicidad del número de serie. Hoy el activo tiene código, tag RFID, descripción, categoría, ubicación, responsable, origen y estado. `Pillow` ya está en `requirements/base.txt` pero no hay campo de imagen.
- Decisión: confirmar que el `codigo` actual es el número ACTIVO/Servitac y añadir los demás.

## 3. Matriz de trazabilidad: requerimientos vs. código

### Funcionales

| RF | Requerimiento | Estado | Evidencia / falta |
|---|---|---|---|
| RF-01 | Autenticación y roles | ✅ | Login por token, 3 roles, permisos por rol en la API con tests. |
| RF-02 | Registro con doble identificador y ficha completa | 🟡 | Alta y edición con código, REF, número de serie, marca, modelo, descripción, categoría, ubicación, origen, estado y RFID. **Faltan** las fotografías (hay que decidir dónde se guardan los archivos). |
| RF-03 | Ingreso rápido / alta masiva | ❌ | No existe importación (CSV/Excel) ni formulario de lote. |
| RF-04 | Departamentos y ubicaciones | ✅ | Crear, listar, renombrar y eliminar desde la interfaz; borrar algo en uso responde con un mensaje claro (409). Las categorías se pueden crear al registrar un activo, pero no editar ni borrar desde la interfaz. |
| RF-05 | Identificación híbrida | 🟡 | Backend: imagen de código de barras y búsqueda por código o RFID. La ficha del activo muestra la etiqueta de código de barras para descargar o imprimir. **Interfaz de escaneo simulada**, sin cámara ni lector. QR: ver D1. |
| RF-06 | Búsqueda y filtrado multi-criterio | ✅ | API e interfaz filtran por categoría, estado, origen y ubicación, y buscan por descripción, código, REF, serie, marca, modelo y RFID. |
| RF-07 | Préstamos | 🟡 | Modelo y API con permisos; interfaz con datos de ejemplo. Falta formulario, devolución e historial. |
| RF-08 | Traslados formales | 🟡 | Modelo mínimo (pendiente/autorizado). Faltan condición, motivo, firmas, consecutivo y autorización. Interfaz simulada. |
| RF-09 | Estatus y estado oficial | ⚠️ | Solo 3 estados (D2). |
| RF-10 | Gestión documental | ❌ | No hay modelo ni subida de archivos. La pestaña "Documentos" muestra un archivo de ejemplo falso. |
| RF-11 | Logs inalterables con valores previos y nuevos | 🟡 | Existe el registro y es de solo lectura en el admin. **Pero:** no guarda el usuario (el propio código lo marca como pendiente), no guarda valores previos/nuevos, solo cubre el modelo Activo (no traslados, préstamos ni ubicaciones) y la interfaz de Auditoría usa datos de ejemplo. |

### No funcionales

| RNF | Requerimiento | Estado | Evidencia / falta |
|---|---|---|---|
| RNF-01 | Respuesta media < 300 ms | ❌ | Sin medición. Existe un `locustfile.py` con 3 escenarios. |
| RNF-02 | ≥ 50 RPS sin degradar | ❌ | Sin medición. |
| RNF-03 | Unicidad y campos obligatorios | ✅ | Código, número de serie, REF y RFID únicos, con errores legibles. |
| RNF-04 | Docker + Compose | ✅ | Los 3 servicios corren en Compose. Hoy en modo desarrollo (`runserver`, Vite dev), mientras el documento describe Nginx y Gunicorn (3.4.2): igualar documento o despliegue. |
| RNF-05 | Diseño responsivo | ❌ | La interfaz es solo de escritorio, por decisión documentada. El documento promete móvil y tabletas. |
| RNF-06 | Seguridad (JWT/Session, SQLi, XSS, CSRF) | 🟡 | Django ORM y React cubren SQLi/XSS; la autenticación es por **token**, no JWT ni sesión como dice el documento (ajustar redacción). **Los servidores usan HTTP**, y el acceso a la cámara desde el navegador exige HTTPS. |

### Objetivos específicos

| Obj. | Estado | Comentario |
|---|---|---|
| I Analizar flujos | ✅ | Capítulo I. |
| II Investigar captura | 🟡 | Redactado, pero habla de QR (D1). |
| III Diseñar arquitectura y modelo | 🟡 | El E-R del documento y el modelo real divergen (D2, D4). |
| IV Backend Django | 🟡 | Núcleo hecho; faltan auditoría completa, documentos, traslados/préstamos. |
| V Interfaz React web y móvil | 🟡 | Activos, ubicaciones y panel reales; escaneo, préstamos, documentos y móvil pendientes. |
| VI Docker | ✅ | Además hay CI/CD con staging y producción y backups, que el documento no menciona y conviene citar. |
| VII Pruebas de carga | ❌ | Capítulo IV vacío. |

### Metodología (Capítulos I y III)
SCRUM con sprints de 2–3 semanas y tablero Kanban en GitHub Projects/Trello: **no hay evidencia en el repositorio** (ni tablero, ni historias de usuario, ni revisiones de sprint). Si existen, hay que documentarlas; si no, crearlas, porque el documento las promete.

## 4. Plan propuesto (orden por dependencia y riesgo)

**Fase 0 — Decisiones y alineación (antes de programar más)**
1. Resolver D1–D4 con Laura y el asesor.
2. Actualizar los ADR 0001 y 0002 y `CLAUDE.md`; corregir el documento teórico en lo que cambie.

**Sprint 1 — Cerrar Activos** (RF-02, RF-04, RF-06, RNF-03) — *en curso: hecho todo salvo fotografías y `estatus`/`estado` (D2)*
- Campos REF, serie, marca, modelo, tipo; fotografías; unicidad de serie.
- `estatus` / `estado` según D2.
- Editar activos; editar y borrar ubicaciones y categorías con mensajes claros.
- Mostrar y descargar el código de barras en la ficha para imprimir la etiqueta.
- Filtros completos en la lista.

**Sprint 2 — Auditoría real** (RF-11) — va antes que los demás módulos para que todos queden registrados desde el inicio.
- Guardar el usuario (middleware), valores previos y nuevos, y cubrir todos los modelos auditados.
- Conectar la interfaz de Auditoría y la pestaña "Historial" del activo.

**Sprint 3 — Escaneo real** (RF-05, parte de RNF-05)
- Lectura por cámara y modo RFID (lector tipo teclado).
- **HTTPS en staging y producción** (requisito de la cámara).
- Diseño adaptado a móvil para esta pantalla.
- Resultado de la verificación → `estatus` (D2).

**Sprint 4 — Traslados y Préstamos** (RF-07, RF-08, si D3 = núcleo)
- Modelos completos con los campos UTP, flujo de aprobación, devoluciones e historial, interfaz y permisos.

**Sprint 5 — Documentos e ingreso rápido** (RF-10, RF-03) y administración de usuarios conectada.

**Sprint 6 — Rendimiento y Capítulo IV** (objetivo VII, RNF-01/02)
- Completar escenarios de Locust (escaneo, filtros, reportes, login), medir latencia, RPS, percentiles y consumo (`docker stats`).
- Decidir si se menciona JMeter y Prometheus: el documento los nombra y no hay nada en el repositorio.
- Comparativa Excel vs. sistema (errores y tiempo de auditoría).
- Despliegue en modo producción (Gunicorn + Nginx) para que coincida con 3.4.2.

**Transversal**: responsive donde aplique (RNF-05), pruebas, documentación y el acta de cada sprint (para la metodología).

## 5. Inconsistencias del propio documento (para corregir al editarlo)

- El índice no coincide con el contenido (el 2.3.4 existe y no está listado; hay numeraciones repetidas: dos "3.3.1", el segundo debería ser 3.3.2 y se titula "RF" en vez de "RNF").
- Tabla 1 menciona RFID y estatus UTP, mientras la introducción y el resumen hablan solo de barras/QR y de 3 estados.
- Resumen e introducción dicen que ya se evaluó el rendimiento y se obtuvieron resultados ("los resultados confirman…"); el Capítulo IV está vacío y no hay mediciones.
- Dedicatoria y agradecimiento sin texto.
- Se mencionan Apache JMeter, Prometheus y APM sin respaldo en el repositorio.
- "Dashboard con 8,687 bienes": cifra del mockup; el panel real mostrará lo que haya en la base.
