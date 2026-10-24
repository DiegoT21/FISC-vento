package com.fiscvento.campo.ui.inventario

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fiscvento.campo.inventario.InventarioComparer
import com.fiscvento.campo.inventario.ResultadoInventario
import com.fiscvento.hardware.ReadMode
import com.fiscvento.hardware.ReaderGateway
import com.fiscvento.hardware.ScanEvent
import com.fiscvento.network.Activo
import com.fiscvento.network.FiscRepository
import com.fiscvento.network.Ubicacion
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class InventarioUiState(
    val ubicaciones: List<Ubicacion> = emptyList(),
    val ubicacionSeleccionada: Ubicacion? = null,
    val cargandoUbicaciones: Boolean = false,
    val leyendo: Boolean = false,
    val epcs: Set<String> = emptySet(),
    val esperados: List<Activo> = emptyList(),
    val catalogo: List<Activo> = emptyList(),
    val catalogoCompleto: Boolean = false,
    val resultado: ResultadoInventario? = null,
    val error: String? = null,
)

class InventarioViewModel(
    private val repo: FiscRepository,
    private val reader: ReaderGateway,
) : ViewModel() {

    private val _ui = MutableStateFlow(InventarioUiState())
    val ui: StateFlow<InventarioUiState> = _ui.asStateFlow()

    private var eventsJob: Job? = null
    private var pantallaActiva = true
    private val tagsEnviados = mutableSetOf<String>()

    init {
        cargarUbicaciones()
    }

    fun cargarUbicaciones() {
        viewModelScope.launch {
            _ui.update { it.copy(cargandoUbicaciones = true, error = null) }
            repo.listarUbicaciones().fold(
                onSuccess = { lista ->
                    _ui.update {
                        it.copy(
                            cargandoUbicaciones = false,
                            ubicaciones = lista,
                            ubicacionSeleccionada = it.ubicacionSeleccionada
                                ?: lista.firstOrNull(),
                        )
                    }
                    _ui.value.ubicacionSeleccionada?.let { cargarEsperados(it.id) }
                },
                onFailure = { e ->
                    _ui.update {
                        it.copy(
                            cargandoUbicaciones = false,
                            error = e.message ?: "No se pudieron cargar las ubicaciones.",
                        )
                    }
                },
            )
        }
    }

    fun seleccionarUbicacion(ubicacion: Ubicacion) {
        if (_ui.value.leyendo) return
        _ui.update {
            it.copy(
                ubicacionSeleccionada = ubicacion,
                epcs = emptySet(),
                resultado = null,
                error = null,
            )
        }
        cargarEsperados(ubicacion.id)
    }

    private fun cargarEsperados(ubicacionId: Int) {
        viewModelScope.launch {
            val esperadosResult = repo.listarActivos(ubicacionId = ubicacionId)
            val catalogoResult = repo.listarActivos(ubicacionId = null)
            val esperados = esperadosResult.getOrElse { emptyList() }
            val catalogo = catalogoResult.getOrElse { esperados }
            if (esperadosResult.isFailure) {
                _ui.update {
                    it.copy(error = esperadosResult.exceptionOrNull()?.message
                        ?: "No se pudieron cargar los activos esperados.")
                }
                return@launch
            }
            _ui.update { state ->
                val resultado = InventarioComparer.comparar(state.epcs, esperados, catalogo)
                state.copy(
                    esperados = esperados,
                    catalogo = catalogo,
                    catalogoCompleto = catalogoResult.isSuccess,
                    resultado = resultado,
                )
            }
        }
    }

    fun toggleLectura() {
        if (_ui.value.leyendo) detener() else iniciar()
    }

    private fun iniciar() {
        if (_ui.value.ubicacionSeleccionada == null) {
            _ui.update { it.copy(error = "Elige una ubicación primero.") }
            return
        }
        _ui.update { it.copy(leyendo = true, error = null) }
        reader.start(ReadMode.RFID)
        if (eventsJob == null) {
            eventsJob = viewModelScope.launch {
                reader.events.collect { event ->
                    if (pantallaActiva && _ui.value.leyendo && event is ScanEvent.RfidTag) {
                        onEpc(event.epc)
                    }
                }
            }
        }
    }

    private fun detener() {
        reader.stop()
        _ui.update { it.copy(leyendo = false) }
    }

    private fun onEpc(epc: String) {
        val antes = _ui.value
        if (epc in antes.epcs) return
        val resultado = InventarioComparer.comparar(antes.epcs + epc, antes.esperados, antes.catalogo)
        _ui.update { state ->
            if (epc in state.epcs) return@update state
            val nuevos = state.epcs + epc
            state.copy(
                epcs = nuevos,
                resultado = InventarioComparer.comparar(nuevos, state.esperados, state.catalogo),
            )
        }
        if (antes.catalogoCompleto && epc in resultado.desconocidos && tagsEnviados.add(epc)) {
            viewModelScope.launch { repo.registrarTagPorEditar(epc) }
        }
    }

    fun limpiarLecturas() {
        if (_ui.value.leyendo) return
        _ui.update { state ->
            val resultado = InventarioComparer.comparar(emptySet(), state.esperados, state.catalogo)
            state.copy(epcs = emptySet(), resultado = resultado)
        }
    }

    fun textoExportacion(): String? {
        val state = _ui.value
        val ubicacion = state.ubicacionSeleccionada ?: return null
        val resultado = state.resultado ?: return null
        return resultado.resumenTexto(ubicacion.nombre)
    }

    fun onPausePantalla() {
        pantallaActiva = false
        if (_ui.value.leyendo) detener()
    }

    fun onResumePantalla() {
        pantallaActiva = true
    }

    override fun onCleared() {
        reader.stop()
        super.onCleared()
    }
}
