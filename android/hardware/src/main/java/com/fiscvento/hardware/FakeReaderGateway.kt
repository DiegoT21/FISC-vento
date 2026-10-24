package com.fiscvento.hardware

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow

/** Lector simulado para emulador / equipos no Zebra. [emit] inyecta un evento a mano. */
class FakeReaderGateway(
    ready: Boolean = true,
    message: String = "Lector simulado",
) : ReaderGateway {
    private val _events = MutableSharedFlow<ScanEvent>(extraBufferCapacity = 64)
    private val _status = MutableStateFlow(ReaderStatus(ready = ready, message = message))
    override val events: SharedFlow<ScanEvent> = _events
    override val status: StateFlow<ReaderStatus> = _status
    override fun start(mode: ReadMode) {}
    override fun stop() {}
    override fun setRfidPower(dbm: Int) {}
    fun emit(event: ScanEvent) {
        _events.tryEmit(event)
    }
}
