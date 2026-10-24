package com.fiscvento.network

import android.content.Context

/** Punto de entrada que usa :app. Codex lo reemplaza por la implementacion real (Retrofit contra Django). */
object FiscRepositoryFactory {
    fun create(context: Context, defaultUrl: String): FiscRepository = FakeFiscRepository().also { it.setServerUrl(defaultUrl) }
}
