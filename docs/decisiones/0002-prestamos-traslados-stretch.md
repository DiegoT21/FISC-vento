# ADR 0002 — Préstamos y Traslados como stretch goals

**Estado**: Aceptado (2026-09-03)

## Contexto

El mockup original incluye pantallas de "Préstamos" (activos prestados a
una persona) y "Traslados" (solicitudes de movimiento entre ubicaciones,
con estados Pendiente/Autorizado). Ninguno de los dos aparece explícito en
la sección "Alcance" del anteproyecto. Traslados sí está implícito en el
planteamiento del problema (dificultad para rastrear el movimiento de
equipos entre salones/laboratorios); Préstamos no tiene un respaldo tan
directo en el documento.

## Decisión

Ambos módulos se dejan con su estructura lista (app Django + feature
frontend) pero **no se priorizan** hasta que los 6 módulos core estén
sólidos: usuarios, ubicaciones, activos, escaneo, auditoría, reportes. Si
sobra tiempo de sprint, **Traslados tiene prioridad sobre Préstamos** por
estar más cerca del problema planteado.

## Consecuencias

- `backend/apps/prestamos/` y `backend/apps/traslados/` existen y están
  registradas en `INSTALLED_APPS`, con un modelo mínimo cada una, pero no
  se expande su funcionalidad hasta que el core esté completo.
- `frontend/src/features/prestamos/` y `.../traslados/` idem — quedan
  relocalizadas del mockup pero sin nuevo desarrollo hasta nueva orden.
- Revisar esta decisión durante la planificación de sprints (backlog de
  Scrum) conforme avance el cronograma jul–dic.
