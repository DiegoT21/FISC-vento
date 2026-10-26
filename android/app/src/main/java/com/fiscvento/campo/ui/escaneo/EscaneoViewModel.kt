package com.fiscvento.campo.ui.escaneo

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fiscvento.campo.feedback.ScanFeedback
import com.fiscvento.hardware.ReadMode
import com.fiscvento.hardware.ReaderGateway
import com.fiscvento.hardware.ScanEvent
import com.fiscvento.network.Activo
import com.fiscvento.network.EstadoTagPorEditar
import com.fiscvento.network.FiscRepository
import com.fiscvento.network.LookupResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EscaneoUiState(
    val busqueda: Boolean = false,
    val activo: Activo? = null,
    val noEncontradoValor: String? = null,
    val error: String? = null,
    val mensaje: String? = null,
    val esperandoTag: Boolean = false,
    val confirmandoQuitarTag: Boolean = false,
    val mostrarEntradaManual: Boolean = false,
    val valorManual: String = "",
    val lectorListo: Boolean = false,
    val lectorMensaje: String = "",
)

class EscaneoViewModel(
    private val repo: FiscRepository,
    private val reader: ReaderGateway,
    private val feedback: ScanFeedback,
) : ViewModel() {

    private val _ui = MutableStateFlow(EscaneoUiState())
    val ui: StateFlow<EscaneoUiState> = _ui.asStateFlow()

    private var eventsJob: Job? = null
    private var statusJob: Job? = null
    private var lookupJob: Job? = null
    private var pantallaActiva = false
    private val tagsEnviados = mutableSetOf<String>()

    fun onResume() {
        pantallaActiva = true
        reader.start(ReadMode.BOTH)
        if (eventsJob == null) {
            eventsJob = viewModelScope.launch {
                reader.events.collect { event ->
                    if (pantallaActiva) onScanEvent(event)
                }
            }
        }
        if (statusJob == null) {
            statusJob = viewModelScope.launch {
                reader.status.collect { st ->
                    _ui.update { it.copy(lectorListo = st.ready, lectorMensaje = st.message) }
                }
            }
        }
    }

    fun onPause() {
        pantallaActiva = false
        reader.stop()
    }

    private fun onScanEvent(event: ScanEvent) {
        when (event) {
            is ScanEvent.Barcode -> {
                if (!_ui.value.esperandoTag) buscar(event.value)
            }
            is ScanEvent.RfidTag -> {
                if (_ui.value.esperandoTag) {
                    asociarTagLeido(event.epc)
                } else {
                    buscar(event.epc, esRfid = true)
                }
            }
        }
    }

    fun buscar(valor: String, esRfid: Boolean = false) {
        val limpio = valor.trim()
        if (limpio.isEmpty()) return
        lookupJob?.cancel()
        lookupJob = viewModelScope.launch {
            _ui.update {
                it.copy(
                    busqueda = true,
                    error = null,
                    mensaje = null,
                    noEncontradoValor = null,
                    confirmandoQuitarTag = false,
                )
            }
            repo.lookup(limpio).fold(
                onSuccess = { result ->
                    when (result) {
                        is LookupResult.Found -> {
                            feedback.success()
                            _ui.update {
                                it.copy(
                                    busqueda = false,
                                    activo = result.activo,
                                    noEncontradoValor = null,
                                    mostrarEntradaManual = false,
                                    valorManual = "",
                                )
                            }
                        }
                        LookupResult.NotFound -> {
                            if (esRfid) {
                                enviarTagPorEditar(limpio)
                            } else {
                                feedback.notFound()
                                _ui.update {
                                    it.copy(
                                        busqueda = false,
                                        activo = null,
                                        noEncontradoValor = limpio,
                                    )
                                }
                            }
                        }
                    }
                },
                onFailure = { e ->
                    feedback.notFound()
                    _ui.update {
                        it.copy(
                            busqueda = false,
                            error = e.message ?: "No se pudo consultar el activo. Intenta de nuevo.",
                        )
                    }
                },
            )
        }
    }

    private suspend fun enviarTagPorEditar(epc: String) {
        if (epc in tagsEnviados) {
            feedback.success()
            _ui.update {
                it.copy(
                    busqueda = false,
                    activo = null,
                    noEncontradoValor = null,
                    mensaje = "Ese tag ya está en Por editar.",
                )
            }
            return
        }
        repo.registrarTagPorEditar(epc).fold(
            onSuccess = { registro ->
                tagsEnviados += epc
                val texto = when (registro.estado) {
                    EstadoTagPorEditar.NUEVO -> "Tag enviado. Aparece en Por editar en la web."
                    EstadoTagPorEditar.PENDIENTE -> "Ese tag ya está en Por editar."
                    EstadoTagPorEditar.REGISTRADO -> "Ese tag ya tiene ficha."
                }
                feedback.success()
                _ui.update {
                    it.copy(
                        busqueda = false,
                        activo = null,
                        noEncontradoValor = null,
                        mensaje = texto,
                    )
                }
            },
            onFailure = { e ->
                feedback.notFound()
                _ui.update {
                    it.copy(
                        busqueda = false,
                        error = e.message ?: "No se pudo enviar el tag a Por editar.",
                    )
                }
            },
        )
    }

    fun toggleEntradaManual() {
        _ui.update {
            it.copy(
                mostrarEntradaManual = !it.mostrarEntradaManual,
                valorManual = if (it.mostrarEntradaManual) "" else it.valorManual,
            )
        }
    }

    fun onValorManual(v: String) = _ui.update { it.copy(valorManual = v) }

    fun buscarManual() {
        buscar(_ui.value.valorManual)
    }

    fun iniciarAsociarTag() {
        if (_ui.value.activo == null) return
        _ui.update {
            it.copy(
                esperandoTag = true,
                mensaje = "Acerca el tag RFID al lector…",
                error = null,
                confirmandoQuitarTag = false,
            )
        }
    }

    fun cancelarAsociarTag() {
        _ui.update { it.copy(esperandoTag = false, mensaje = null) }
    }

    private fun asociarTagLeido(epc: String) {
        val activo = _ui.value.activo ?: return
        viewModelScope.launch {
            _ui.update { it.copy(busqueda = true, esperandoTag = false, mensaje = null) }
            repo.asociarTag(activo.id, epc).fold(
                onSuccess = { actualizado ->
                    feedback.success()
                    _ui.update {
                        it.copy(
                            busqueda = false,
                            activo = actualizado,
                            mensaje = "Tag asociado correctamente.",
                            error = null,
                        )
                    }
                },
                onFailure = { e ->
                    feedback.notFound()
                    _ui.update {
                        it.copy(
                            busqueda = false,
                            error = e.message ?: "No se pudo asociar el tag.",
                        )
                    }
                },
            )
        }
    }

    fun pedirConfirmarQuitarTag() {
        _ui.update { it.copy(confirmandoQuitarTag = true, error = null, mensaje = null) }
    }

    fun cancelarQuitarTag() {
        _ui.update { it.copy(confirmandoQuitarTag = false) }
    }

    fun confirmarQuitarTag() {
        val activo = _ui.value.activo ?: return
        viewModelScope.launch {
            _ui.update { it.copy(busqueda = true, confirmandoQuitarTag = false) }
            repo.desasociarTag(activo.id).fold(
                onSuccess = { actualizado ->
                    _ui.update {
                        it.copy(
                            busqueda = false,
                            activo = actualizado,
                            mensaje = "Tag quitado del activo.",
                            error = null,
                        )
                    }
                },
                onFailure = { e ->
                    _ui.update {
                        it.copy(
                            busqueda = false,
                            error = e.message ?: "No se pudo quitar el tag.",
                        )
                    }
                },
            )
        }
    }

    fun limpiarAviso() {
        _ui.update { it.copy(error = null, mensaje = null, noEncontradoValor = null) }
    }

    override fun onCleared() {
        reader.stop()
        super.onCleared()
    }
}
