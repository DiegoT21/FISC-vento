package com.fiscvento.campo

import android.content.Context
import android.os.Build
import android.provider.Settings
import com.fiscvento.hardware.ReaderFactory
import com.fiscvento.hardware.ReaderGateway
import com.fiscvento.network.FiscRepository
import com.fiscvento.network.FiscRepositoryFactory

/** Datos con los que este equipo se registra al vincularlo con el QR de la web. */
data class InfoDispositivo(val nombre: String, val modelo: String, val androidId: String)

/** Inyección manual: un solo lugar crea reader y repo. */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val reader: ReaderGateway = ReaderFactory.create(appContext)
    val repo: FiscRepository = FiscRepositoryFactory.create(
        appContext,
        BuildConfig.DEFAULT_SERVER_URL,
    )
    val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun infoDispositivo(): InfoDispositivo {
        val androidId = Settings.Secure.getString(appContext.contentResolver, Settings.Secure.ANDROID_ID).orEmpty()
        val modelo = listOf(Build.MANUFACTURER, Build.MODEL).filter { it.isNotBlank() }.joinToString(" ")
        val sufijo = androidId.takeLast(4).takeIf { it.isNotEmpty() }?.let { " ($it)" }.orEmpty()
        return InfoDispositivo(nombre = "${Build.MODEL}$sufijo", modelo = modelo, androidId = androidId)
    }

    fun recordarSesion(): Boolean = prefs.getBoolean(KEY_RECORDAR, false)

    fun setRecordarSesion(value: Boolean) {
        prefs.edit().putBoolean(KEY_RECORDAR, value).apply()
    }

    fun potenciaRfid(): Int = prefs.getInt(KEY_POTENCIA, DEFAULT_POTENCIA).coerceIn(5, 30)

    fun setPotenciaRfid(dbm: Int) {
        val clamped = dbm.coerceIn(5, 30)
        prefs.edit().putInt(KEY_POTENCIA, clamped).apply()
        reader.setRfidPower(clamped)
    }

    companion object {
        private const val PREFS_NAME = "fisc_campo"
        private const val KEY_RECORDAR = "recordar_sesion"
        private const val KEY_POTENCIA = "potencia_rfid_dbm"
        const val DEFAULT_POTENCIA = 20
    }
}
