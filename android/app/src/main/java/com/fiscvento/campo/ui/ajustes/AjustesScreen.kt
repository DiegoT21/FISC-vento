package com.fiscvento.campo.ui.ajustes

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fiscvento.campo.ui.theme.ErrorRed
import com.fiscvento.campo.ui.theme.Fisc800
import kotlin.math.roundToInt

@Composable
fun AjustesScreen(
    viewModel: AjustesViewModel,
    onCerrarSesion: () -> Unit,
) {
    val state by viewModel.ui.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("Ajustes", style = MaterialTheme.typography.headlineMedium, color = Fisc800)
        Spacer(Modifier.height(20.dp))

        Text("Potencia RFID", style = MaterialTheme.typography.titleMedium)
        Text(
            "${state.potencia} dBm",
            style = MaterialTheme.typography.bodyLarge,
            color = Fisc800,
        )
        Slider(
            value = state.potencia.toFloat(),
            onValueChange = { viewModel.onPotencia(it.roundToInt()) },
            valueRange = 5f..30f,
            steps = 24,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
        )
        Text(
            "Rango 5–30 dBm. Úsalo según el alcance que necesites.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(24.dp))
        Text("Servidor", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = state.serverUrl,
            onValueChange = viewModel::onServerUrl,
            label = { Text("URL del servidor") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = viewModel::guardarServidor,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text("Guardar servidor")
        }

        state.mensaje?.let { msg ->
            Spacer(Modifier.height(12.dp))
            Text(msg, style = MaterialTheme.typography.bodyMedium, color = Fisc800)
        }

        Spacer(Modifier.height(28.dp))
        OutlinedButton(
            onClick = { viewModel.cerrarSesion(onCerrarSesion) },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text("Cerrar sesión")
        }

        Spacer(Modifier.height(24.dp))
        Text(
            "Versión ${state.version}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
