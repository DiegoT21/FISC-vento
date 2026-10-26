package com.fiscvento.hardware

/**
 * Descarta el mismo EPC si llega otra vez dentro de [windowMs].
 * Solo compara con la lectura anterior (no historial largo).
 */
class TagDedupe(private val windowMs: Long = DEFAULT_WINDOW_MS) {
    private var lastEpc: String? = null
    private var lastAtMs: Long = 0L

    fun shouldEmit(epc: String, nowMs: Long = System.currentTimeMillis()): Boolean {
        if (epc.isBlank()) return false
        val prev = lastEpc
        if (prev != null && prev == epc && nowMs - lastAtMs < windowMs) {
            return false
        }
        lastEpc = epc
        lastAtMs = nowMs
        return true
    }

    fun reset() {
        lastEpc = null
        lastAtMs = 0L
    }

    companion object {
        const val DEFAULT_WINDOW_MS = 400L
    }
}
