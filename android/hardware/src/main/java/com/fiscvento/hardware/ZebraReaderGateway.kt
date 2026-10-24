package com.fiscvento.hardware

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Fusiona RFID (API3) y barras (DataWedge) en [events] según [ReadMode].
 */
class ZebraReaderGateway(context: Context) : ReaderGateway {
    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val dataWedge = ZebraDataWedgeBridge(appContext)
    private val rfid = ZebraApi3RfidReader(appContext, dataWedge)
    private val barcode = ZebraBarcodeScanner(appContext)
    private val dedupe = TagDedupe()

    private val _events = MutableSharedFlow<ScanEvent>(extraBufferCapacity = 64)
    override val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

    private val _status = MutableStateFlow(ReaderStatus(ready = false, message = "Iniciando lector…"))
    override val status: StateFlow<ReaderStatus> = _status.asStateFlow()

    @Volatile
    private var mode: ReadMode = ReadMode.BOTH

    private var rfidJob: Job? = null
    private var barcodeJob: Job? = null
    private var statusJob: Job? = null
    private var started = false

    init {
        statusJob = scope.launch {
            rfid.message.collect { msg ->
                _status.value = ReaderStatus(ready = rfid.ready.value, message = msg)
            }
        }
        scope.launch {
            rfid.ready.collect { ready ->
                _status.value = ReaderStatus(ready = ready, message = rfid.message.value)
            }
        }
    }

    override fun start(mode: ReadMode) {
        this.mode = mode
        if (!started) {
            started = true
            rfid.connect()
            barcode.start()
            rfidJob = scope.launch {
                rfid.tags.collect { tag ->
                    if (this@ZebraReaderGateway.mode == ReadMode.BARCODE) return@collect
                    if (!dedupe.shouldEmit(tag.epc)) return@collect
                    _events.tryEmit(ScanEvent.RfidTag(epc = tag.epc, rssi = tag.rssi))
                }
            }
            barcodeJob = scope.launch {
                barcode.scans.collect { value ->
                    if (this@ZebraReaderGateway.mode == ReadMode.RFID) return@collect
                    _events.tryEmit(ScanEvent.Barcode(value = value))
                }
            }
        }
        applyMode(mode)
        Log.i(TAG, "start mode=$mode")
    }

    override fun stop() {
        rfid.stopInventory()
        rfid.setPreferBarcodeTrigger(true)
        Log.i(TAG, "stop")
    }

    override fun setRfidPower(dbm: Int) {
        rfid.setPowerDbm(dbm)
    }

    private fun applyMode(mode: ReadMode) {
        when (mode) {
            ReadMode.BARCODE -> {
                rfid.setPreferBarcodeTrigger(true)
                rfid.stopInventory()
                dataWedge.ensureBarcodeProfile()
            }
            ReadMode.RFID -> {
                rfid.setPreferBarcodeTrigger(false)
                // El gatillo físico inicia/para inventario vía API3.
            }
            ReadMode.BOTH -> {
                rfid.setPreferBarcodeTrigger(false)
                dataWedge.ensureBarcodeProfile()
            }
        }
    }

    companion object {
        private const val TAG = "FiscReader"
    }
}
