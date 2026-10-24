package com.fiscvento.network

import android.content.Context

/** Punto de entrada de la implementacion Retrofit contra Django. */
object FiscRepositoryFactory {
    fun create(context: Context, defaultUrl: String): FiscRepository =
        RealFiscRepository(context, defaultUrl)
}
