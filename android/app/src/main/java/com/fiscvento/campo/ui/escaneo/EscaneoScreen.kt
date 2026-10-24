package com.fiscvento.campo.ui.escaneo

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fiscvento.campo.ui.theme.ErrorRed
import com.fiscvento.campo.ui.theme.ErrorRedBg
import com.fiscvento.campo.ui.theme.Fisc100
import com.fiscvento.campo.ui.theme.Fisc50
import com.fiscvento.campo.ui.theme.Fisc800
import com.fiscvento.campo.ui.theme.Fisc900
import com.fiscvento.network.Activo

@Composable
fun EscaneoScreen(viewModel: EscaneoViewModel) {
    val state by viewModel.ui.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    val focusManager = LocalFocusManager.current

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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("Escaneo", style = MaterialTheme.typography.headlineMedium, color = Fisc800)
        Text(
            text = if (state.lectorListo) state.lectorMensaje.ifBlank { "Lector listo" } else "Lector no listo",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = if (state.esperandoTag) {
                "Esperando tag RFID para asociar…"
            } else {
                "Dispara el gatillo o escribe un código a mano."
            },
            style = MaterialTheme.typography.bodyLarge,
        )

        if (state.busqueda) {
            Spacer(Modifier.height(16.dp))
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        }

        state.noEncontradoValor?.let { valor ->
            Spacer(Modifier.height(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(ErrorRedBg, RoundedCornerShape(12.dp))
                    .padding(16.dp),
            ) {
                Text(
                    "No encontrado",
                    color = ErrorRed,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "No hay un activo con: $valor",
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodyLarge,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }

        state.error?.let { msg ->
            Spacer(Modifier.height(12.dp))
            Text(msg, color = ErrorRed, style = MaterialTheme.typography.bodyMedium)
        }
        state.mensaje?.let { msg ->
            Spacer(Modifier.height(12.dp))
            Text(msg, color = Fisc800, style = MaterialTheme.typography.bodyMedium)
        }

        state.activo?.let { activo ->
            Spacer(Modifier.height(16.dp))
            FichaActivo(
                activo = activo,
                esperandoTag = state.esperandoTag,
                onAsociar = viewModel::iniciarAsociarTag,
                onCancelarAsociar = viewModel::cancelarAsociarTag,
                onQuitar = viewModel::pedirConfirmarQuitarTag,
            )
        }

        Spacer(Modifier.height(20.dp))
        OutlinedButton(
            onClick = {
                focusManager.clearFocus()
                viewModel.toggleEntradaManual()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text(
                if (state.mostrarEntradaManual) "Ocultar entrada manual" else "Entrada manual",
            )
        }

        if (state.mostrarEntradaManual) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = state.valorManual,
                onValueChange = viewModel::onValorManual,
                label = { Text("Código o EPC") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(
                    onSearch = {
                        focusManager.clearFocus()
                        viewModel.buscarManual()
                    },
                ),
            )
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    focusManager.clearFocus()
                    viewModel.buscarManual()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            ) {
                Text("Buscar")
            }
        }
    }

    if (state.confirmandoQuitarTag) {
        AlertDialog(
            onDismissRequest = viewModel::cancelarQuitarTag,
            title = { Text("Quitar tag") },
            text = { Text("¿Seguro que quieres quitar el tag RFID de este activo?") },
            confirmButton = {
                TextButton(onClick = viewModel::confirmarQuitarTag) {
                    Text("Quitar", color = ErrorRed)
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::cancelarQuitarTag) {
                    Text("Cancelar")
                }
            },
        )
    }
}

@Composable
private fun FichaActivo(
    activo: Activo,
    esperandoTag: Boolean,
    onAsociar: () -> Unit,
    onCancelarAsociar: () -> Unit,
    onQuitar: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Fisc50, RoundedCornerShape(12.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Ficha del activo", style = MaterialTheme.typography.titleMedium, color = Fisc900)
        CampoFicha("Código", activo.codigo, mono = true)
        CampoFicha("Descripción", activo.descripcion)
        CampoFicha("Estado", activo.estado)
        CampoFicha("Ubicación", activo.ubicacion ?: "Sin ubicación")
        CampoFicha("Tag RFID", activo.tagRfid ?: "Sin tag", mono = true)

        Spacer(Modifier.height(8.dp))
        if (esperandoTag) {
            OutlinedButton(
                onClick = onCancelarAsociar,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            ) {
                Text("Cancelar lectura de tag")
            }
        } else {
            Button(
                onClick = onAsociar,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            ) {
                Text(if (activo.tagRfid == null) "Asociar tag" else "Cambiar tag")
            }
            if (activo.tagRfid != null) {
                Spacer(Modifier.height(4.dp))
                OutlinedButton(
                    onClick = onQuitar,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                ) {
                    Text("Quitar tag")
                }
            }
        }
    }
}

@Composable
private fun CampoFicha(etiqueta: String, valor: String, mono: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Fisc100, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(etiqueta, style = MaterialTheme.typography.bodyMedium, color = Fisc900)
        Text(
            text = valor,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            fontFamily = if (mono) FontFamily.Monospace else FontFamily.SansSerif,
            color = Fisc900,
            modifier = Modifier.padding(start = 8.dp),
        )
    }
}
