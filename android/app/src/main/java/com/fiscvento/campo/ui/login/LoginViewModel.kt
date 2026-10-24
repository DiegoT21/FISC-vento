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
    val usuario: String = "",
    val contrasena: String = "",
    val mostrarContrasena: Boolean = false,
    val recordar: Boolean = false,
    val cargando: Boolean = false,
    val error: String? = null,
    val sesionRestaurada: Boolean = false,
    // Vinculación con el QR de la web
    val dispositivo: Dispositivo? = null,
    val mostrarVincular: Boolean = false,
    val codigoManual: String = "",
    val vinculando: Boolean = false,
    val errorVinculacion: String? = null,
    val avisoVinculacion: String? = null,
)

class LoginViewModel(
    private val repo: FiscRepository,
    private val container: AppContainer,
    private val reader: ReaderGateway,
) : ViewModel() {

    private val _ui = MutableStateFlow(
        LoginUiState(
            serverUrl = repo.serverUrl(),
            recordar = container.recordarSesion(),
            dispositivo = repo.dispositivoVinculado(),
        ),
    )
    val ui: StateFlow<LoginUiState> = _ui.asStateFlow()

    private var eventsJob: Job? = null
    private var pantallaActiva = false

    init {
        if (container.recordarSesion() && repo.restoreSession() != null) {
            _ui.update { it.copy(sesionRestaurada = true) }
        } else if (!container.recordarSesion()) {
            repo.logout()
        }
    }

    /** Mientras el login está visible el lector queda activo para leer el QR de vinculación. */
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

    fun onServerUrl(v: String) = _ui.update { it.copy(serverUrl = v, error = null) }
    fun onUsuario(v: String) = _ui.update { it.copy(usuario = v, error = null) }
    fun onContrasena(v: String) = _ui.update { it.copy(contrasena = v, error = null) }
    fun toggleMostrarContrasena() = _ui.update { it.copy(mostrarContrasena = !it.mostrarContrasena) }
    fun onRecordar(v: Boolean) = _ui.update { it.copy(recordar = v) }
    fun consumirSesionRestaurada() = _ui.update { it.copy(sesionRestaurada = false) }

    fun abrirVincular() = _ui.update {
        it.copy(mostrarVincular = true, errorVinculacion = null, avisoVinculacion = null)
    }

    fun cerrarVincular() = _ui.update { it.copy(mostrarVincular = false, errorVinculacion = null) }
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

    /** Evento del lector: solo reacciona a QR de vinculación; el resto se ignora. */
    private fun alEscanear(valor: String) {
        val qr = VinculacionQr.parse(valor) ?: return
        _ui.update { it.copy(mostrarVincular = true) }
        vincular(qr.serverUrl, qr.codigo)
    }

    private fun vincular(url: String, codigo: String) {
        if (_ui.value.vinculando) return
        if (url.isBlank()) {
            _ui.update { it.copy(errorVinculacion = "Indica la URL del servidor.") }
            return
        }
        viewModelScope.launch {
            _ui.update { it.copy(vinculando = true, errorVinculacion = null, avisoVinculacion = null) }
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
                            mostrarVincular = false,
                            codigoManual = "",
                            avisoVinculacion = "Dispositivo vinculado. Ahora inicia sesión.",
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

    fun login(onOk: () -> Unit) {
        val state = _ui.value
        if (state.usuario.isBlank() || state.contrasena.isBlank()) {
            _ui.update { it.copy(error = "Escribe tu usuario y contraseña.") }
            return
        }
        if (state.serverUrl.isBlank()) {
            _ui.update { it.copy(error = "Indica la URL del servidor.") }
            return
        }
        viewModelScope.launch {
            _ui.update { it.copy(cargando = true, error = null) }
            repo.setServerUrl(state.serverUrl.trim())
            val result = repo.login(state.usuario.trim(), state.contrasena)
            result.fold(
                onSuccess = {
                    container.setRecordarSesion(state.recordar)
                    _ui.update { it.copy(cargando = false) }
                    onOk()
                },
                onFailure = { e ->
                    _ui.update {
                        it.copy(
                            cargando = false,
                            error = e.message?.takeIf { m -> m.isNotBlank() }
                                ?: "No se pudo iniciar sesión. Revisa usuario, contraseña y servidor.",
                        )
                    }
                },
            )
        }
    }
}
