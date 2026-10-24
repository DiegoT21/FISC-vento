package com.fiscvento.campo

import android.app.Application

class FiscCampoApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.reader.setRfidPower(container.potenciaRfid())
    }
}
