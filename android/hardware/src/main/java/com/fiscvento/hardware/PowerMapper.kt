package com.fiscvento.hardware

/**
 * Mapea dBm (5..30) al índice de potencia del lector Zebra API3.
 * [levels] es `ReaderCapabilities.transmitPowerLevelValues` (valores en décimas de dBm).
 */
object PowerMapper {
    fun clampDbm(dbm: Int): Int = dbm.coerceIn(5, 30)

    fun indexForDbm(dbm: Int, levels: IntArray?): Int {
        val targetDbm = clampDbm(dbm)
        if (levels != null && levels.isNotEmpty()) {
            val target = targetDbm * 10
            return levels.indices.minByOrNull { kotlin.math.abs(levels[it] - target) }
                ?: levels.lastIndex
        }
        val maxIdx = 30
        return ((targetDbm - 5).coerceIn(0, 25) * maxIdx / 25.0).toInt()
    }
}
