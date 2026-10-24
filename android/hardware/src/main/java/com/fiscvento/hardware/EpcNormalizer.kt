package com.fiscvento.hardware

/** Normaliza EPC a hex mayúsculas (sin prefijos PC/CRC cuando se detectan). */
object EpcNormalizer {
    fun normalize(raw: String): String {
        val first = raw.trim()
            .uppercase()
            .split(',', ' ', ';', '\t', '\n', '\r')
            .firstOrNull { it.isNotBlank() }
            .orEmpty()
        val hex = first.filter { it in '0'..'9' || it in 'A'..'F' }
        if (hex.isEmpty()) return ""

        // Gen2: lecturas comunes = PC(4) + EPC(24) [+ CRC(4)]. Unificar a EPC-96.
        return when {
            hex.length == 32 -> hex.substring(4, 28)
            hex.length == 28 -> hex.substring(4)
            hex.length > 24 && hex.length % 4 == 0 -> hex.takeLast(24)
            else -> hex
        }
    }
}
