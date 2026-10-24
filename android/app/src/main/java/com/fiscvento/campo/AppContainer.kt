package com.fiscvento.campo

import android.content.Context
import com.fiscvento.hardware.ReaderFactory
import com.fiscvento.hardware.ReaderGateway
import com.fiscvento.network.FiscRepository
import com.fiscvento.network.FiscRepositoryFactory

/** Inyección manual: un solo lugar crea reader y repo. */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val reader: ReaderGateway = ReaderFactory.create(appContext)
    val repo: FiscRepository = FiscRepositoryFactory.create(
        appContext,
        BuildConfig.DEFAULT_SERVER_URL,
    )
    val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

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
