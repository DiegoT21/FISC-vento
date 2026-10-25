package com.fiscvento.campo.ui.login

import android.app.Activity
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fiscvento.campo.R
import com.fiscvento.campo.ui.theme.CircuitBackground
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween

private val Cian = Color(0xFF46E0FF)
private val Texto = Color(0xFFF4FBFF)
private val TextoSuave = Color(0xFFB7D4E8)
private val ErrorClaro = Color(0xFFFFB4B4)

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoggedIn: () -> Unit,
) {
    val state by viewModel.ui.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    val view = LocalView.current
    val densidad = LocalDensity.current.density
    val giro by rememberInfiniteTransition(label = "logo").animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(durationMillis = 7000, easing = LinearEasing)),
        label = "giro",
    )

    DisposableEffect(lifecycleOwner, view) {
        val ventana = (view.context as Activity).window
        val barras = WindowCompat.getInsetsController(ventana, view)
        barras.isAppearanceLightStatusBars = false
        barras.isAppearanceLightNavigationBars = false
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
            barras.isAppearanceLightStatusBars = true
            barras.isAppearanceLightNavigationBars = true
        }
    }

    LaunchedEffect(state.dispositivo?.id, state.entrar) {
        if (state.dispositivo == null) return@LaunchedEffect
        if (!state.entrar) delay(1400)
        viewModel.consumirEntrada()
        onLoggedIn()
    }

    Box(Modifier.fillMaxSize()) {
        CircuitBackground()
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Image(
                painter = painterResource(R.drawable.logo_3d),
                contentDescription = "FISC-vento",
                modifier = Modifier
                    .size(168.dp)
                    .graphicsLayer {
                        rotationY = giro
                        cameraDistance = 14f * densidad
                    },
            )
            Spacer(Modifier.height(20.dp))
            Text(
                text = "FISC-vento",
                color = Texto,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = if (state.dispositivo != null) "Entrando…" else "Escanea el QR de vinculación",
                color = Cian,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )
            if (state.dispositivo == null) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Apunta el lector al QR de Dispositivos en la web y presiona el gatillo.",
                    color = TextoSuave,
                    fontSize = 16.sp,
                    textAlign = TextAlign.Center,
                )
            }

            if (state.vinculando) {
                Spacer(Modifier.height(20.dp))
                CircularProgressIndicator(color = Cian, strokeWidth = 2.dp)
            }

            state.errorVinculacion?.let { msg ->
                Spacer(Modifier.height(16.dp))
                Text(msg, color = ErrorClaro, fontSize = 16.sp, textAlign = TextAlign.Center)
            }

            if (state.dispositivo == null) {
            Spacer(Modifier.height(20.dp))
            if (!state.mostrarCodigo) {
                TextButton(onClick = viewModel::mostrarCodigo) {
                    Text("Escribir el código", color = Cian, fontSize = 16.sp)
                }
            } else {
                val colores = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Texto,
                    unfocusedTextColor = Texto,
                    focusedBorderColor = Cian,
                    unfocusedBorderColor = TextoSuave,
                    focusedLabelColor = Cian,
                    unfocusedLabelColor = TextoSuave,
                    cursorColor = Cian,
                )
                OutlinedTextField(
                    value = state.serverUrl,
                    onValueChange = viewModel::onServerUrl,
                    label = { Text("URL del servidor") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = colores,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = state.codigoManual,
                    onValueChange = viewModel::onCodigoManual,
                    label = { Text("Código de vinculación") },
                    singleLine = true,
                    enabled = !state.vinculando,
                    modifier = Modifier.fillMaxWidth(),
                    colors = colores,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { viewModel.vincularManual() }),
                )
                Spacer(Modifier.height(8.dp))
                TextButton(
                    onClick = viewModel::vincularManual,
                    enabled = !state.vinculando && state.codigoManual.isNotBlank(),
                ) {
                    Text("Vincular", color = Cian, fontSize = 16.sp)
                }
            }
            }
        }
    }
}
