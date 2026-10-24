package com.fiscvento.campo.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fiscvento.campo.ui.theme.Fisc800
import com.fiscvento.campo.ui.theme.ErrorRed
import com.fiscvento.campo.ui.theme.Fisc700

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoggedIn: () -> Unit,
) {
    val state by viewModel.ui.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current

    // El lector queda activo en el login para poder leer el QR de vinculacion.
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> viewModel.onResume()
                Lifecycle.Event.ON_PAUSE -> viewModel.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            viewModel.onPause()
        }
    }

    LaunchedEffect(state.sesionRestaurada) {
        if (state.sesionRestaurada) {
            viewModel.consumirSesionRestaurada()
            onLoggedIn()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "FISC-vento",
            style = MaterialTheme.typography.headlineLarge,
            color = Fisc800,
        )
        Text(
            text = "Campo",
            style = MaterialTheme.typography.headlineMedium,
            color = Fisc800,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Inicia sesión para escanear activos",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(20.dp))

        PanelVinculacion(state = state, viewModel = viewModel)

        Spacer(Modifier.height(20.dp))

        OutlinedTextField(
            value = state.serverUrl,
            onValueChange = viewModel::onServerUrl,
            label = { Text("URL del servidor") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Uri,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = state.usuario,
            onValueChange = viewModel::onUsuario,
            label = { Text("Usuario") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = state.contrasena,
            onValueChange = viewModel::onContrasena,
            label = { Text("Contraseña") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = if (state.mostrarContrasena) {
                VisualTransformation.None
            } else {
                PasswordVisualTransformation()
            },
            trailingIcon = {
                IconButton(
                    onClick = viewModel::toggleMostrarContrasena,
                    modifier = Modifier.height(48.dp),
                ) {
                    Icon(
                        imageVector = if (state.mostrarContrasena) {
                            Icons.Filled.VisibilityOff
                        } else {
                            Icons.Filled.Visibility
                        },
                        contentDescription = if (state.mostrarContrasena) {
                            "Ocultar contraseña"
                        } else {
                            "Mostrar contraseña"
                        },
                    )
                }
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(
                onDone = { viewModel.login(onLoggedIn) },
            ),
        )
        Spacer(Modifier.height(8.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Checkbox(
                checked = state.recordar,
                onCheckedChange = viewModel::onRecordar,
            )
            Text("Recordar sesión", style = MaterialTheme.typography.bodyLarge)
        }

        state.error?.let { msg ->
            Spacer(Modifier.height(12.dp))
            Text(msg, color = ErrorRed, style = MaterialTheme.typography.bodyMedium)
        }

        Spacer(Modifier.height(20.dp))
        Button(
            onClick = { viewModel.login(onLoggedIn) },
            enabled = !state.cargando,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            if (state.cargando) {
                CircularProgressIndicator(
                    modifier = Modifier.height(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text("Entrar", style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}

/** Vinculacion con el QR de la web: boton, estado y alternativa de pegar/teclear el codigo. */
@Composable
private fun PanelVinculacion(state: LoginUiState, viewModel: LoginViewModel) {
    state.dispositivo?.let { dispositivo ->
        Text(
            text = "Dispositivo vinculado: ${dispositivo.nombre}",
            style = MaterialTheme.typography.bodyMedium,
            color = Fisc700,
        )
        Spacer(Modifier.height(8.dp))
    }
    state.avisoVinculacion?.let { msg ->
        Text(msg, color = Fisc700, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(8.dp))
    }

    if (!state.mostrarVincular) {
        OutlinedButton(
            onClick = viewModel::abrirVincular,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
        ) {
            Text(if (state.dispositivo == null) "Vincular con QR" else "Volver a vincular con QR")
        }
        return
    }

    Text(
        text = "Apunta el lector al QR de Dispositivos en la web y presiona el gatillo.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Spacer(Modifier.height(8.dp))
    OutlinedTextField(
        value = state.codigoManual,
        onValueChange = viewModel::onCodigoManual,
        label = { Text("O escribe el codigo de vinculacion") },
        singleLine = true,
        enabled = !state.vinculando,
        modifier = Modifier.fillMaxWidth(),
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { viewModel.vincularManual() }),
    )
    state.errorVinculacion?.let { msg ->
        Spacer(Modifier.height(8.dp))
        Text(msg, color = ErrorRed, style = MaterialTheme.typography.bodyMedium)
    }
    Spacer(Modifier.height(8.dp))
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        OutlinedButton(
            onClick = viewModel::cerrarVincular,
            enabled = !state.vinculando,
            modifier = Modifier.height(48.dp),
        ) {
            Text("Cancelar")
        }
        Button(
            onClick = viewModel::vincularManual,
            enabled = !state.vinculando && state.codigoManual.isNotBlank(),
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
        ) {
            if (state.vinculando) {
                CircularProgressIndicator(
                    modifier = Modifier.height(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text("Vincular")
            }
        }
    }
}
