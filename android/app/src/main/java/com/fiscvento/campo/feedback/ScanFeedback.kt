package com.fiscvento.campo.feedback

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/** Vibración y tono cortos: éxito (verde) o no encontrado (rojo). */
class ScanFeedback(context: Context) {
    private val appContext = context.applicationContext

    fun success() {
        vibrate(40)
        tone(ToneGenerator.TONE_PROP_ACK, 80)
    }

    fun notFound() {
        vibrate(120)
        tone(ToneGenerator.TONE_PROP_NACK, 150)
    }

    private fun vibrate(ms: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = appContext.getSystemService(VibratorManager::class.java)
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Vibrator::class.java)
        } ?: return
        if (!vibrator.hasVibrator()) return
        vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    private fun tone(type: Int, durationMs: Int) {
        try {
            val tg = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            tg.startTone(type, durationMs)
            android.os.Handler(appContext.mainLooper).postDelayed({ tg.release() }, durationMs + 50L)
        } catch (_: Exception) {
            // Sin audio no bloqueamos el flujo.
        }
    }
}
