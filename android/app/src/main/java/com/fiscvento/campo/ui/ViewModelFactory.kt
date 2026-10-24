package com.fiscvento.campo.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.fiscvento.campo.AppContainer
import com.fiscvento.campo.feedback.ScanFeedback
import com.fiscvento.campo.ui.ajustes.AjustesViewModel
import com.fiscvento.campo.ui.escaneo.EscaneoViewModel
import com.fiscvento.campo.ui.inventario.InventarioViewModel
import com.fiscvento.campo.ui.login.LoginViewModel

class ViewModelFactory(
    private val container: AppContainer,
    private val feedback: ScanFeedback,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when {
        modelClass.isAssignableFrom(LoginViewModel::class.java) ->
            LoginViewModel(container.repo, container) as T
        modelClass.isAssignableFrom(EscaneoViewModel::class.java) ->
            EscaneoViewModel(container.repo, container.reader, feedback) as T
        modelClass.isAssignableFrom(InventarioViewModel::class.java) ->
            InventarioViewModel(container.repo, container.reader) as T
        modelClass.isAssignableFrom(AjustesViewModel::class.java) ->
            AjustesViewModel(container.repo, container) as T
        else -> throw IllegalArgumentException("ViewModel desconocido: ${modelClass.name}")
    }
}
