package com.fiscvento.campo.ui.ajustes

import androidx.lifecycle.ViewModel
import com.fiscvento.campo.AppContainer
import com.fiscvento.campo.BuildConfig
import com.fiscvento.network.FiscRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class AjustesUiState(
    val potencia: Int = AppContainer.DEFAULT_POTENCIA,
    val serverUrl: String = "",
    val version: String = BuildConfig.VERSION_NAME,
    val mensaje: String? = null,
)

class AjustesViewModel(
    private val repo: FiscRepository,
    private val container: AppContainer,
) : ViewModel() {

    private val _ui = MutableStateFlow(
        AjustesUiState(
            potencia = container.potenciaRfid(),
            serverUrl = repo.serverUrl(),
        ),
    )
    val ui: StateFlow<AjustesUiState> = _ui.asStateFlow()

    fun onPotencia(dbm: Int) {
        container.setPotenciaRfid(dbm)
        _ui.update { it.copy(potencia = container.potenciaRfid(), mensaje = "Potencia RFID: ${container.potenciaRfid()} dBm") }
    }

    fun onServerUrl(url: String) = _ui.update { it.copy(serverUrl = url, mensaje = null) }

    fun guardarServidor() {
        val url = _ui.value.serverUrl.trim()
        if (url.isBlank()) {
            _ui.update { it.copy(mensaje = "La URL no puede estar vacía.") }
            return
        }
        repo.setServerUrl(url)
        _ui.update { it.copy(serverUrl = repo.serverUrl(), mensaje = "Servidor actualizado.") }
    }

    fun cerrarSesion(onDone: () -> Unit) {
        container.setRecordarSesion(false)
        repo.logout()
        onDone()
    }
}
