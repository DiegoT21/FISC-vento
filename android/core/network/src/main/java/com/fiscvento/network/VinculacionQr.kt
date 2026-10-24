package com.fiscvento.network

import java.net.URLDecoder
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * Contenido del QR de vinculacion que muestra la web:
 * `fiscvento://vincular?u=<url del servidor urlencoded>&c=<codigo de un solo uso>`.
 */
data class VinculacionQr(val serverUrl: String, val codigo: String) {
    companion object {
        private const val PREFIJO = "fiscvento://vincular?"
        private const val LONGITUD_MINIMA = 8
        private const val LONGITUD_MAXIMA = 32

        /** Devuelve null si [texto] no es un QR de vinculacion valido. */
        fun parse(texto: String): VinculacionQr? {
            val limpio = texto.trim()
            if (!limpio.startsWith(PREFIJO, ignoreCase = true)) return null
            val parametros = limpio.substring(PREFIJO.length)
                .split('&')
                .mapNotNull { par ->
                    val i = par.indexOf('=')
                    if (i <= 0) null else par.substring(0, i) to decodificar(par.substring(i + 1))
                }
                .toMap()
            val url = parametros["u"]?.trim()?.takeIf { it.isNotEmpty() } ?: return null
            val http = url.toHttpUrlOrNull() ?: return null
            if (http.scheme != "http" && http.scheme != "https") return null
            val codigo = normalizarCodigo(parametros["c"].orEmpty()) ?: return null
            return VinculacionQr(serverUrl = url, codigo = codigo)
        }

        /**
         * Para el codigo tecleado o pegado a mano: mayusculas, sin espacios ni guiones.
         * Devuelve null si no tiene un largo razonable.
         */
        fun normalizarCodigo(texto: String): String? {
            val codigo = texto.uppercase().filter { it.isLetterOrDigit() }
            return codigo.takeIf { it.length in LONGITUD_MINIMA..LONGITUD_MAXIMA }
        }

        private fun decodificar(valor: String): String =
            runCatching { URLDecoder.decode(valor, "UTF-8") }.getOrDefault(valor)
    }
}