package com.fiscvento.campo.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fiscvento.campo.AppContainer
import com.fiscvento.hardware.ReadMode
import com.fiscvento.hardware.ReaderGateway
import com.fiscvento.hardware.ScanEvent
import com.fiscvento.network.Dispositivo
import com.fiscvento.network.FiscRepository
import com.fiscvento.network.VinculacionQr
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val serverUrl: String = "",
    val dispositivo: Dispositivo? = null,
    val mostrarCodigo: Boolean = false,
    val codigoManual: String = "",
    val vinculando: Boolean = false,
    val errorVinculacion: String? = null,
    val entrar: Boolean = false,
)

class LoginViewModel(
    private val repo: FiscRepository,
    private val container: AppContainer,
    private val reader: ReaderGateway,
) : ViewModel() {

    private val _ui = MutableStateFlow(
        LoginUiState(
            serverUrl = repo.serverUrl(),
            dispositivo = repo.dispositivoVinculado(),
        ),
    )
    val ui: StateFlow<LoginUiState> = _ui.asStateFlow()

    private var eventsJob: Job? = null
    private var pantallaActiva = false

    /** Mientras esta pantalla está visible el lector queda listo para el QR. */
    fun onResume() {
        pantallaActiva = true
        reader.start(ReadMode.BARCODE)
        if (eventsJob == null) {
            eventsJob = viewModelScope.launch {
                reader.events.collect { event ->
                    if (pantallaActiva && event is ScanEvent.Barcode) alEscanear(event.value)
                }
            }
        }
    }

    fun onPause() {
        pantallaActiva = false
        reader.stop()
    }

    fun consumirEntrada() = _ui.update { it.copy(entrar = false) }

    fun onServerUrl(v: String) = _ui.update { it.copy(serverUrl = v, errorVinculacion = null) }
    fun mostrarCodigo() = _ui.update { it.copy(mostrarCodigo = true, errorVinculacion = null) }
    fun onCodigoManual(v: String) = _ui.update { it.copy(codigoManual = v, errorVinculacion = null) }

    /** Código pegado o tecleado: acepta el texto completo del QR o solo el código. */
    fun vincularManual() {
        val texto = _ui.value.codigoManual.trim()
        val qr = VinculacionQr.parse(texto)
        if (qr != null) {
            vincular(qr.serverUrl, qr.codigo)
            return
        }
        val codigo = VinculacionQr.normalizarCodigo(texto)
        if (codigo == null) {
            _ui.update { it.copy(errorVinculacion = "Escribe el código que muestra la web bajo el QR.") }
            return
        }
        vincular(_ui.value.serverUrl.trim(), codigo)
    }

    /** Evento del lector: solo reacciona al QR de vinculación. */
    private fun alEscanear(valor: String) {
        val qr = VinculacionQr.parse(valor) ?: return
        vincular(qr.serverUrl, qr.codigo)
    }

    private fun vincular(url: String, codigo: String) {
        if (_ui.value.vinculando || _ui.value.entrar) return
        if (url.isBlank()) {
            _ui.update { it.copy(errorVinculacion = "Indica la URL del servidor.") }
            return
        }
        viewModelScope.launch {
            _ui.update { it.copy(vinculando = true, errorVinculacion = null) }
            try {
                repo.setServerUrl(url)
            } catch (e: IllegalArgumentException) {
                _ui.update { it.copy(vinculando = false, errorVinculacion = e.message) }
                return@launch
            }
            val info = container.infoDispositivo()
            repo.vincularDispositivo(codigo, info.nombre, info.modelo, info.androidId).fold(
                onSuccess = { dispositivo ->
                    _ui.update {
                        it.copy(
                            vinculando = false,
                            dispositivo = dispositivo,
                            serverUrl = repo.serverUrl(),
                            codigoManual = "",
                            entrar = true,
                        )
                    }
                },
                onFailure = { e ->
                    _ui.update {
                        it.copy(
                            vinculando = false,
                            errorVinculacion = e.message?.takeIf { m -> m.isNotBlank() }
                                ?: "No se pudo vincular el dispositivo. Intenta de nuevo.",
                        )
                    }
                },
            )
        }
    }
}
