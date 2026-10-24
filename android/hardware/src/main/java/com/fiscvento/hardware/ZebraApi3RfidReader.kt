package com.fiscvento.hardware

import android.content.Context
import android.util.Log
import com.zebra.rfid.api3.ENUM_TRANSPORT
import com.zebra.rfid.api3.HANDHELD_TRIGGER_EVENT_TYPE
import com.zebra.rfid.api3.INVENTORY_STATE
import com.zebra.rfid.api3.InvalidUsageException
import com.zebra.rfid.api3.OperationFailureException
import com.zebra.rfid.api3.RFIDReader
import com.zebra.rfid.api3.ReaderDevice
import com.zebra.rfid.api3.Readers
import com.zebra.rfid.api3.RfidEventsListener
import com.zebra.rfid.api3.RfidReadEvents
import com.zebra.rfid.api3.RfidStatusEvents
import com.zebra.rfid.api3.SESSION
import com.zebra.rfid.api3.SL_FLAG
import com.zebra.rfid.api3.START_TRIGGER_TYPE
import com.zebra.rfid.api3.STATUS_EVENT_TYPE
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE
import com.zebra.rfid.api3.TriggerInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Lector RFID nativo Zebra API3 (TC22r). Modo exclusivo: DataWedge RFID debe estar apagado.
 */
class ZebraApi3RfidReader(
    private val context: Context,
    private val dataWedge: ZebraDataWedgeBridge,
) : Readers.RFIDReaderEventHandler {

    data class TagRead(val epc: String, val rssi: Int?)

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _tags = MutableSharedFlow<TagRead>(extraBufferCapacity = 128)
    val tags: SharedFlow<TagRead> = _tags.asSharedFlow()

    private val _ready = MutableStateFlow(false)
    val ready: StateFlow<Boolean> = _ready.asStateFlow()

    private val _message = MutableStateFlow("Conectando lector RFID…")
    val message: StateFlow<String> = _message.asStateFlow()

    @Volatile private var readers: Readers? = null
    @Volatile private var reader: RFIDReader? = null
    @Volatile private var eventHandler: EventHandler? = null
    @Volatile private var inventoryDesired = false
    @Volatile private var inventoryActive = false
    @Volatile private var connectAllowed = false
    @Volatile private var connectGeneration = 0
    @Volatile private var preferBarcodeTrigger = false
    @Volatile private var powerDbm = 22

    private var inventoryWatchJob: Job? = null

    val isConnected: Boolean
        get() = reader?.isConnected == true

    fun setPreferBarcodeTrigger(prefer: Boolean) {
        if (preferBarcodeTrigger == prefer) return
        preferBarcodeTrigger = prefer
        runCatching { reader?.Events?.setHandheldEvent(!prefer) }
        if (prefer && inventoryActive) {
            scope.launch {
                inventoryDesired = false
                stopInventoryLocked()
            }
        }
    }

    fun connect() {
        if (!DeviceDetector.isZebraDevice()) {
            _ready.value = false
            _message.value = "API3 solo aplica en equipos Zebra."
            return
        }
        connectAllowed = true
        if (_ready.value && isConnected) {
            scope.launch { applyPowerLocked(reader ?: return@launch, powerDbm) }
            return
        }
        val gen = ++connectGeneration
        _ready.value = false
        _message.value = "Conectando lector del equipo…"
        scope.launch {
            dataWedge.releaseRfidForNative()
            ZebraRadioClaim.releaseCompetitors(context)
            delay(1_800)
            if (gen != connectGeneration || !connectAllowed) return@launch
            var ok = false
            repeat(3) { attempt ->
                if (gen != connectGeneration || !connectAllowed) return@launch
                if (attempt > 0) {
                    _message.value = "Reintentando RFID (${attempt + 1}/3)…"
                    disconnectLocked()
                    ZebraRadioClaim.releaseCompetitors(context)
                    delay(1_200L * attempt)
                }
                ok = connectInternal()
                if (ok) return@repeat
            }
            if (gen != connectGeneration || !connectAllowed) {
                if (ok) disconnectLocked()
                return@launch
            }
            if (ok) {
                _ready.value = true
                _message.value = "Lector RFID listo · ${reader?.hostName ?: android.os.Build.MODEL}"
                applyPowerLocked(reader!!, powerDbm)
                dataWedge.ensureBarcodeProfile()
                if (inventoryDesired) startInventoryLocked(force = true)
            } else {
                _ready.value = false
                _message.value =
                    "RFID ocupado o no disponible. Cierra apps RFID de Zebra y reinicia el equipo."
            }
        }
    }

    fun disconnect() {
        connectAllowed = false
        connectGeneration++
        inventoryDesired = false
        stopInventoryWatch()
        scope.launch {
            stopInventoryLocked()
            disconnectLocked()
            _ready.value = false
            _message.value = "Desconectado"
        }
    }

    fun startInventory() {
        inventoryDesired = true
        ensureInventoryWatch()
        scope.launch {
            if (!isConnected) {
                connect()
                var waited = 0
                while (!isConnected && waited < 12_000 && inventoryDesired) {
                    delay(250)
                    waited += 250
                }
            }
            if (!isConnected) return@launch
            startInventoryLocked(force = true)
        }
    }

    fun stopInventory() {
        inventoryDesired = false
        stopInventoryWatch()
        scope.launch { stopInventoryLocked() }
    }

    fun setPowerDbm(dbm: Int) {
        powerDbm = PowerMapper.clampDbm(dbm)
        val r = reader ?: return
        if (!r.isConnected) return
        scope.launch {
            runCatching { applyPowerLocked(r, powerDbm) }
                .onFailure { Log.w(TAG, "setPowerDbm", it) }
        }
    }

    override fun RFIDReaderAppeared(device: ReaderDevice?) {
        if (connectAllowed && !isConnected) connect()
    }

    override fun RFIDReaderDisappeared(device: ReaderDevice?) {
        if (device?.name == reader?.hostName) {
            val want = inventoryDesired
            inventoryActive = false
            reader = null
            _ready.value = false
            _message.value = "Lector desconectado — reconectando…"
            inventoryDesired = want
            if (connectAllowed) connect()
        }
    }

    private fun ensureInventoryWatch() {
        if (inventoryWatchJob?.isActive == true) return
        inventoryWatchJob = scope.launch {
            while (isActive && inventoryDesired) {
                delay(2_000)
                if (!inventoryDesired || !isConnected) continue
                if (!inventoryActive) startInventoryLocked(force = true)
            }
        }
    }

    private fun stopInventoryWatch() {
        inventoryWatchJob?.cancel()
        inventoryWatchJob = null
    }

    private fun connectInternal(): Boolean {
        synchronized(this) {
            try {
                if (reader?.isConnected == true) return true
                val found = discoverReader() ?: run {
                    _message.value = "No hay lector RFID API3 disponible"
                    return false
                }
                reader = found
                val r = found
                if (!r.isConnected) {
                    try {
                        r.connect()
                    } catch (e: OperationFailureException) {
                        val msg = "${e.vendorMessage} ${e.results}"
                        when {
                            msg.contains("RFID_READER_REGION_NOT_CONFIGURED", ignoreCase = true) -> {
                                configureRegion(r)
                                r.connect()
                            }
                            msg.contains("timeout", ignoreCase = true) ||
                                msg.contains("RFID_API_COMMAND_TIMEOUT", ignoreCase = true) -> {
                                runCatching { r.disconnect() }
                                reader = null
                                _message.value = "RFID no respondió (timeout)."
                                return false
                            }
                            else -> {
                                _message.value = "RFID no disponible: ${e.vendorMessage}"
                                return false
                            }
                        }
                    }
                }
                if (!r.isConnected) {
                    _message.value = "RFID no quedó conectado"
                    return false
                }
                configureReader(r)
                return true
            } catch (e: Exception) {
                Log.e(TAG, "connectInternal", e)
                _message.value = "Error RFID: ${e.message}"
                return false
            }
        }
    }

    private fun discoverReader(): RFIDReader? {
        // TC22r enumera en SERVICE_USB; SERIAL suele devolver 0.
        val transports = listOf(
            ENUM_TRANSPORT.SERVICE_USB,
            ENUM_TRANSPORT.SERVICE_SERIAL,
        )
        for (transport in transports) {
            try {
                readers?.let { old -> runCatching { old.Dispose() } }
                readers = null
                val instance = Readers(context, transport).also { readers = it }
                Readers.attach(this)
                val list = instance.GetAvailableRFIDReaderList()
                Log.d(TAG, "transport=$transport readers=${list?.size ?: 0}")
                if (!list.isNullOrEmpty()) {
                    val device = list.first()
                    Log.i(TAG, "Usando ${device.name} vía $transport")
                    return device.getRFIDReader()
                }
            } catch (e: InvalidUsageException) {
                Log.w(TAG, "discover $transport: ${e.info}")
            } catch (e: Exception) {
                Log.w(TAG, "discover $transport", e)
            }
        }
        return null
    }

    private fun configureRegion(r: RFIDReader) {
        try {
            val regCfg = r.Config.regulatoryConfig
            val regions = r.ReaderCapabilities.SupportedRegions
            if (regions.length() <= 0) return
            // Preferir USA/FCC (Panamá) si existe; si no, la primera.
            var info = regions.getRegionInfo(0)
            for (i in 0 until regions.length()) {
                val candidate = regions.getRegionInfo(i)
                val name = candidate.name.orEmpty()
                val code = candidate.regionCode.orEmpty()
                if (name.contains("USA", true) || code.contains("USA", true) ||
                    name.contains("FCC", true)
                ) {
                    info = candidate
                    break
                }
            }
            regCfg.setRegion(info.regionCode)
            regCfg.setIsHoppingOn(info.isHoppingConfigurable)
            regCfg.setEnabledChannels(info.supportedChannels)
            regCfg.setStandardName(info.name)
            r.Config.regulatoryConfig = regCfg
        } catch (e: Exception) {
            Log.w(TAG, "configureRegion", e)
        }
    }

    private fun configureReader(r: RFIDReader) {
        val triggerInfo = TriggerInfo()
        triggerInfo.StartTrigger.triggerType = START_TRIGGER_TYPE.START_TRIGGER_TYPE_IMMEDIATE
        triggerInfo.StopTrigger.triggerType = STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE
        val handler = eventHandler ?: EventHandler().also { eventHandler = it }
        r.Events.addEventsListener(handler)
        r.Events.setHandheldEvent(!preferBarcodeTrigger)
        r.Events.setTagReadEvent(true)
        r.Events.setAttachTagDataWithReadEvent(false)
        runCatching { r.Events.setInventoryStartEvent(true) }
        runCatching { r.Events.setInventoryStopEvent(true) }
        r.Config.setStartTrigger(triggerInfo.StartTrigger)
        r.Config.setStopTrigger(triggerInfo.StopTrigger)
        try {
            val singulation = r.Config.Antennas.getSingulationControl(1)
            singulation.session = SESSION.SESSION_S0
            singulation.Action.setInventoryState(INVENTORY_STATE.INVENTORY_STATE_A)
            singulation.Action.setSLFlag(SL_FLAG.SL_ALL)
            r.Config.Antennas.setSingulationControl(1, singulation)
        } catch (e: Exception) {
            Log.w(TAG, "singulation", e)
        }
        runCatching { r.Actions.PreFilters.deleteAll() }
        runCatching { r.Config.setUniqueTagReport(false) }
    }

    private fun applyPowerLocked(r: RFIDReader, dbm: Int) {
        val levels = r.ReaderCapabilities.transmitPowerLevelValues
        val index = PowerMapper.indexForDbm(dbm, levels)
        val config = r.Config.Antennas.getAntennaRfConfig(1)
            ?: throw IllegalStateException("AntennaRfConfig(1) es null")
        config.setTransmitPowerIndex(index)
        r.Config.Antennas.setAntennaRfConfig(1, config)
        Log.i(TAG, "Potencia index=$index (~${dbm} dBm)")
    }

    private fun startInventoryLocked(force: Boolean = false) {
        val r = reader ?: return
        if (!r.isConnected) return
        try {
            if (inventoryActive && force) {
                runCatching { r.Actions.Inventory.stop() }
                inventoryActive = false
            }
            if (inventoryActive) return
            r.Actions.Inventory.perform()
            inventoryActive = true
        } catch (e: Exception) {
            Log.w(TAG, "Inventory.perform", e)
            inventoryActive = false
        }
    }

    private fun stopInventoryLocked() {
        val r = reader ?: return
        try {
            if (r.isConnected) r.Actions.Inventory.stop()
        } catch (e: Exception) {
            Log.w(TAG, "Inventory.stop", e)
        } finally {
            inventoryActive = false
        }
    }

    private fun disconnectLocked() {
        try {
            val r = reader
            val handler = eventHandler
            if (r != null && handler != null) {
                runCatching { r.Events.removeEventsListener(handler) }
            }
            if (r?.isConnected == true) r.disconnect()
        } catch (e: Exception) {
            Log.w(TAG, "disconnectLocked", e)
        }
        reader = null
        runCatching { readers?.Dispose() }
        readers = null
        eventHandler = null
        inventoryActive = false
    }

    private inner class EventHandler : RfidEventsListener {
        override fun eventReadNotify(e: RfidReadEvents?) {
            val r = reader ?: return
            try {
                val myTags = r.Actions.getReadTags(100) ?: return
                for (tag in myTags) {
                    val id = tag.tagID?.trim().orEmpty()
                    if (id.length < 8) continue
                    val epc = EpcNormalizer.normalize(id)
                    if (epc.isEmpty()) continue
                    val rssi = runCatching { tag.peakRSSI.toInt() }.getOrNull()
                    _tags.tryEmit(TagRead(epc = epc, rssi = rssi))
                }
            } catch (ex: Exception) {
                Log.w(TAG, "eventReadNotify", ex)
            }
        }

        override fun eventStatusNotify(statusEvents: RfidStatusEvents?) {
            try {
                val type = statusEvents?.StatusEventData?.statusEventType ?: return
                when {
                    type == STATUS_EVENT_TYPE.HANDHELD_TRIGGER_EVENT -> {
                        if (preferBarcodeTrigger) return
                        val handheld =
                            statusEvents.StatusEventData?.HandheldTriggerEventData?.handheldEvent
                                ?: return
                        when (handheld) {
                            HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_PRESSED -> {
                                inventoryDesired = true
                                ensureInventoryWatch()
                                scope.launch { startInventoryLocked(force = true) }
                            }
                            HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_RELEASED -> {
                                inventoryDesired = false
                                stopInventoryWatch()
                                scope.launch { stopInventoryLocked() }
                            }
                            else -> Unit
                        }
                    }
                    type.toString().contains("INVENTORY_START", ignoreCase = true) -> {
                        inventoryActive = true
                    }
                    type.toString().contains("INVENTORY_STOP", ignoreCase = true) -> {
                        inventoryActive = false
                        if (inventoryDesired) {
                            scope.launch {
                                delay(50)
                                if (inventoryDesired) startInventoryLocked(force = true)
                            }
                        }
                    }
                }
            } catch (t: Throwable) {
                Log.e(TAG, "eventStatusNotify", t)
            }
        }
    }

    companion object {
        private const val TAG = "FiscApi3"
    }
}
