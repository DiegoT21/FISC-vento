---
name: fisc-promover-produccion
description: Explica paso a paso cómo aprobar y subir cambios a producción en FISC-vento (workflow "Promover a producción", entorno `production`, Review deployments). Usar cuando alguien pregunte cómo aprobar un cambio, subir a producción, desplegar, "aprobar yo misma/o", o por qué no le aparece el botón de aprobar o de Run workflow.
---

# Promover a producción — guía para quien pregunta

Quien pregunta suele ser Laura o Diego, sin experiencia en CI. Responde en español, tuteando, con pasos numerados y sin jerga. **Tú no ejecutas la promoción**: la hace la persona desde GitHub (regla de `CLAUDE.md` sección 6). Tu trabajo es guiarla y comprobar que es seguro hacerlo.

## 1. Comprueba primero que hay algo listo

Staging debe estar en verde para el commit actual de `develop`: pestaña **Actions** → "Pipeline (develop -> staging)" → el último run debe terminar en ✅ (tests, deploy y smoke tests). Si no hay `gh`, se puede consultar la API pública: `https://api.github.com/repos/DiegoT21/FISC-vento/actions/runs?branch=develop&per_page=3`. Si está rojo o en curso, dile que espere o corrija; no hay nada que promover todavía.

## 2. Pasos para quien promueve

1. Entrar a https://github.com/DiegoT21/FISC-vento → pestaña **Actions**.
2. En la barra izquierda, clic en **Promover a producción**.
3. Botón **Run workflow** (arriba a la derecha de la lista). Dejar la rama `main` (si el workflow se cambió hace poco y `main` aún no lo tiene, elegir `develop`). En "¿Qué se está desplegando?" escribir un motivo corto. Pulsar el botón verde **Run workflow**.
4. Aparece una ejecución nueva; abrirla. El job `promover-y-desplegar` queda en amarillo: "Waiting for review".
5. Botón **Review deployments** → marcar la casilla `production` → (comentario opcional) → **Approve and deploy**.
6. Esperar. El workflow verifica staging, mergea `develop` en `main`, despliega por SSH y corre smoke tests. Verde ✅ = producción actualizada. Si falla, no reintentar a ciegas: avisar a Diego con el nombre del paso que falló.

Captura de referencia de una ejecución ya aprobada: `docs/img/produccion-aprobada-en-ejecucion.png`. Guía completa: `docs/guia-colaboracion.md`.

## 3. Si no le aparece algo

| Problema | Causa probable | Quién lo arregla |
|---|---|---|
| No aparece **Run workflow** | Sin permiso Write en el repo, o no aceptó la invitación | Diego: Settings → Collaborators |
| No aparece **Review deployments** | No está en *Required reviewers* del entorno `production` | Diego: Settings → Environments → `production` |
| Aborta con "NO tiene una ejecución exitosa" | El commit de `develop` no pasó staging | Esperar o corregir staging |
| Falla despliegue o smoke test | Problema en el servidor o en el cambio | Avisar a Diego; no relanzar sin diagnosticar |

Esas dos configuraciones se hacen en la web de GitHub; no puedes hacerlas tú ni por comando.
