package com.fiscvento.hardware

import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow

/** CONTRATO FIJO: no cambiar firmas sin avisar a Capi. Ver android/CONTRATO.md */
sealed interface ScanEvent {
    data class Barcode(val value: String) : ScanEvent
    data class RfidTag(val epc: String, val rssi: Int? = null) : ScanEvent
}

enum class ReadMode { BARCODE, RFID, BOTH }

data class ReaderStatus(val ready: Boolean, val message: String)

interface ReaderGateway {
    val events: SharedFlow<ScanEvent>
    val status: StateFlow<ReaderStatus>
    fun start(mode: ReadMode)
    fun stop()
    /** Potencia RFID en dBm (5..30). Sin efecto en modo barcode. */
    fun setRfidPower(dbm: Int)
}
