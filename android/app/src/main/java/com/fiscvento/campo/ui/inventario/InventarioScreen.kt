package com.fiscvento.campo.ui.inventario

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fiscvento.campo.ui.theme.ErrorRed
import com.fiscvento.campo.ui.theme.Fisc100
import com.fiscvento.campo.ui.theme.Fisc50
import com.fiscvento.campo.ui.theme.Fisc800
import com.fiscvento.campo.ui.theme.Fisc900

@Composable
fun InventarioScreen(viewModel: InventarioViewModel) {
    val state by viewModel.ui.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var menuAbierto by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> viewModel.onResumePantalla()
                Lifecycle.Event.ON_PAUSE -> viewModel.onPausePantalla()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            viewModel.onPausePantalla()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
    ) {
        Text("Inventario RFID", style = MaterialTheme.typography.headlineMedium, color = Fisc800)
        Spacer(Modifier.height(12.dp))

        Text("Ubicación", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        if (state.cargandoUbicaciones) {
            CircularProgressIndicator()
        } else {
            OutlinedButton(
                onClick = { if (!state.leyendo) menuAbierto = true },
                enabled = !state.leyendo,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            ) {
                Text(state.ubicacionSeleccionada?.nombre ?: "Elegir ubicación")
            }
            DropdownMenu(expanded = menuAbierto, onDismissRequest = { menuAbierto = false }) {
                state.ubicaciones.forEach { ubi ->
                    DropdownMenuItem(
                        text = { Text(ubi.nombre) },
                        onClick = {
                            menuAbierto = false
                            viewModel.seleccionarUbicacion(ubi)
                        },
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Button(
                onClick = viewModel::toggleLectura,
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
            ) {
                Text(if (state.leyendo) "Detener" else "Iniciar")
            }
            OutlinedButton(
                onClick = viewModel::limpiarLecturas,
                enabled = !state.leyendo && state.epcs.isNotEmpty(),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
            ) {
                Text("Limpiar")
            }
        }

        Spacer(Modifier.height(8.dp))
        OutlinedButton(
            onClick = {
                val texto = viewModel.textoExportacion() ?: return@OutlinedButton
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, "Inventario RFID FISC-vento")
                    putExtra(Intent.EXTRA_TEXT, texto)
                }
                context.startActivity(Intent.createChooser(intent, "Exportar resumen"))
            },
            enabled = state.resultado != null,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text("Exportar resumen")
        }

        state.error?.let { msg ->
            Spacer(Modifier.height(8.dp))
            Text(msg, color = ErrorRed, style = MaterialTheme.typography.bodyMedium)
        }

        val resultado = state.resultado
        Spacer(Modifier.height(12.dp))
        Contadores(
            leidos = state.epcs.size,
            ok = resultado?.ok?.size ?: 0,
            faltantes = resultado?.faltantes?.size ?: 0,
            extras = resultado?.extras?.size ?: 0,
            desconocidos = resultado?.desconocidos?.size ?: 0,
        )

        Spacer(Modifier.height(12.dp))
        Text(
            "Tags leídos (${state.epcs.size})",
            style = MaterialTheme.typography.titleMedium,
            color = Fisc900,
        )
        Spacer(Modifier.height(4.dp))
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            items(state.epcs.toList().sorted(), key = { it }) { epc ->
                Text(
                    text = epc,
                    fontFamily = FontFamily.Monospace,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Fisc50, RoundedCornerShape(8.dp))
                        .padding(12.dp),
                )
            }
            if (resultado != null) {
                item {
                    Spacer(Modifier.height(8.dp))
                    SeccionLista("OK", resultado.ok.map { "${it.codigo} — ${it.descripcion}" })
                }
                item {
                    SeccionLista(
                        "Faltantes",
                        resultado.faltantes.map {
                            "${it.codigo} — ${it.descripcion} (${it.tagRfid ?: "sin tag"})"
                        },
                    )
                }
                item {
                    SeccionLista(
                        "Extras",
                        resultado.extras.map {
                            "${it.codigo} — ${it.ubicacion} — ${it.tagRfid}"
                        },
                    )
                }
                item {
                    SeccionLista("Desconocidos", resultado.desconocidos)
                }
            }
        }
    }
}

@Composable
private fun Contadores(leidos: Int, ok: Int, faltantes: Int, extras: Int, desconocidos: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        ContadorChip("Leídos", leidos, Modifier.weight(1f))
        ContadorChip("OK", ok, Modifier.weight(1f))
        ContadorChip("Faltan", faltantes, Modifier.weight(1f))
        ContadorChip("Extra", extras, Modifier.weight(1f))
        ContadorChip("Desc.", desconocidos, Modifier.weight(1f))
    }
}

@Composable
private fun ContadorChip(label: String, value: Int, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(Fisc100, RoundedCornerShape(8.dp))
            .padding(vertical = 8.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = value.toString(),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Fisc800,
        )
        Text(label, style = MaterialTheme.typography.labelLarge, color = Fisc900)
    }
}

@Composable
private fun SeccionLista(titulo: String, items: List<String>) {
    if (items.isEmpty()) return
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(titulo, style = MaterialTheme.typography.titleMedium, color = Fisc800)
        items.forEach { linea ->
            Text(
                text = linea,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
            )
        }
    }
}
