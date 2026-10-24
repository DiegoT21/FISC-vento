package com.fiscvento.campo.inventario

import com.fiscvento.network.Activo

/**
 * Compara tags leídos contra los activos esperados en una ubicación.
 * Clase pura (sin Android) para poder testearla en JVM.
 */
object InventarioComparer {

    fun comparar(
        epcsLeidos: Set<String>,
        esperadosEnUbicacion: List<Activo>,
        catalogoCompleto: List<Activo> = esperadosEnUbicacion,
    ): ResultadoInventario {
        val esperadoIds = esperadosEnUbicacion.map { it.id }.toSet()
        val porTag = catalogoCompleto
            .mapNotNull { a -> a.tagRfid?.let { tag -> tag to a } }
            .toMap()

        val ok = mutableListOf<Activo>()
        val extras = mutableListOf<Activo>()
        val desconocidos = mutableListOf<String>()
        val encontradosIds = mutableSetOf<Int>()

        for (epc in epcsLeidos) {
            val activo = porTag[epc]
            when {
                activo == null -> desconocidos += epc
                activo.id in esperadoIds -> {
                    ok += activo
                    encontradosIds += activo.id
                }
                else -> extras += activo
            }
        }

        val faltantes = esperadosEnUbicacion.filter { it.id !in encontradosIds }

        return ResultadoInventario(
            ok = ok,
            faltantes = faltantes,
            extras = extras,
            desconocidos = desconocidos,
        )
    }
}

data class ResultadoInventario(
    val ok: List<Activo>,
    val faltantes: List<Activo>,
    val extras: List<Activo>,
    val desconocidos: List<String>,
) {
    val totalLeidos: Int
        get() = ok.size + extras.size + desconocidos.size

    fun resumenTexto(ubicacionNombre: String): String = buildString {
        appendLine("Inventario RFID — $ubicacionNombre")
        appendLine("Leídos únicos: $totalLeidos")
        appendLine("OK: ${ok.size}")
        appendLine("Faltantes: ${faltantes.size}")
        appendLine("Extras (otra ubicación): ${extras.size}")
        appendLine("Desconocidos: ${desconocidos.size}")
        appendLine()
        if (ok.isNotEmpty()) {
            appendLine("— OK —")
            ok.forEach { appendLine("${it.codigo} | ${it.descripcion} | ${it.tagRfid}") }
            appendLine()
        }
        if (faltantes.isNotEmpty()) {
            appendLine("— Faltantes —")
            faltantes.forEach {
                appendLine("${it.codigo} | ${it.descripcion} | tag=${it.tagRfid ?: "sin tag"}")
            }
            appendLine()
        }
        if (extras.isNotEmpty()) {
            appendLine("— Extras —")
            extras.forEach {
                appendLine("${it.codigo} | ${it.descripcion} | ${it.ubicacion} | ${it.tagRfid}")
            }
            appendLine()
        }
        if (desconocidos.isNotEmpty()) {
            appendLine("— Desconocidos —")
            desconocidos.forEach { appendLine(it) }
        }
    }
}
