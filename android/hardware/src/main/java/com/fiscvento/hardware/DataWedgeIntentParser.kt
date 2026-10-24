package com.fiscvento.hardware

/**
 * Extrae el código de barras de extras típicos de DataWedge (sin depender de Intent).
 */
object DataWedgeIntentParser {
    val BARCODE_KEYS = listOf(
        "com.symbol.datawedge.data_string",
        "com.motorolasolutions.emdk.datawedge.data_string",
        "data",
        "barcode_string",
        "barcode",
        "text",
    )

    const val ACTION_SCAN = "com.fiscvento.campo.BARCODE_SCAN"

    fun extractBarcode(extras: Map<String, String?>): String? {
        for (key in BARCODE_KEYS) {
            val value = extras[key]?.trim().orEmpty()
            if (value.isNotEmpty()) return value
        }
        return null
    }
}
