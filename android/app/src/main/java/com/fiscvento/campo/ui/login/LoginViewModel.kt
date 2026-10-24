package com.fiscvento.campo.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fiscvento.campo.AppContainer
import com.fiscvento.network.FiscRepository
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
)

class LoginViewModel(
    private val repo: FiscRepository,
    private val container: AppContainer,
) : ViewModel() {

    private val _ui = MutableStateFlow(
        LoginUiState(
            serverUrl = repo.serverUrl(),
            recordar = container.recordarSesion(),
        ),
    )
    val ui: StateFlow<LoginUiState> = _ui.asStateFlow()

    init {
        if (container.recordarSesion() && repo.restoreSession() != null) {
            _ui.update { it.copy(sesionRestaurada = true) }
        } else if (!container.recordarSesion()) {
            repo.logout()
        }
    }

    fun onServerUrl(v: String) = _ui.update { it.copy(serverUrl = v, error = null) }
    fun onUsuario(v: String) = _ui.update { it.copy(usuario = v, error = null) }
    fun onContrasena(v: String) = _ui.update { it.copy(contrasena = v, error = null) }
    fun toggleMostrarContrasena() = _ui.update { it.copy(mostrarContrasena = !it.mostrarContrasena) }
    fun onRecordar(v: Boolean) = _ui.update { it.copy(recordar = v) }
    fun consumirSesionRestaurada() = _ui.update { it.copy(sesionRestaurada = false) }

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
