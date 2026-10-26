package com.fiscvento.hardware

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/** Recibe códigos de barras vía DataWedge (intent broadcast). */
class ZebraBarcodeScanner(private val context: Context) {
    private val _scans = MutableSharedFlow<String>(extraBufferCapacity = 16)
    val scans: SharedFlow<String> = _scans.asSharedFlow()

    @Volatile
    private var running = false
    private var registered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (!running || intent == null) return
            val extras = mutableMapOf<String, String?>()
            intent.extras?.keySet()?.forEach { key ->
                extras[key] = intent.getStringExtra(key)
            }
            val barcode = DataWedgeIntentParser.extractBarcode(extras) ?: return
            Log.i(TAG, "Lectura recibida (${barcode.length} caracteres)")
            _scans.tryEmit(barcode)
        }
    }

    fun start() {
        running = true
        if (!registered) {
            // DataWedge 15 manda el broadcast con CATEGORY_DEFAULT (así está el perfil).
            // Sin esa categoría Android descarta el intent: el gatillo pita y la app no se entera.
            val filter = IntentFilter(DataWedgeIntentParser.ACTION_SCAN).apply {
                addCategory(Intent.CATEGORY_DEFAULT)
            }
            ContextCompat.registerReceiver(
                context,
                receiver,
                filter,
                ContextCompat.RECEIVER_EXPORTED,
            )
            registered = true
            Log.i(TAG, "Escuchando DataWedge: ${DataWedgeIntentParser.ACTION_SCAN}")
        }
    }

    fun stop() {
        running = false
        if (registered) {
            runCatching { context.unregisterReceiver(receiver) }
            registered = false
        }
    }

    companion object {
        private const val TAG = "FiscBarcode"
    }
}
