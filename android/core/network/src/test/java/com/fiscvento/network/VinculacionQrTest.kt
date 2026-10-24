package com.fiscvento.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VinculacionQrTest {
    @Test
    fun `parsea el payload que genera la web`() {
        val qr = VinculacionQr.parse("fiscvento://vincular?u=http%3A%2F%2F3.149.4.52%2F&c=ABCDEFGHJK")

        assertEquals(VinculacionQr("http://3.149.4.52/", "ABCDEFGHJK"), qr)
    }

    @Test
    fun `acepta https, espacios alrededor y esquema en mayusculas`() {
        val qr = VinculacionQr.parse("  FISCVENTO://vincular?u=https%3A%2F%2Ffisc.utp.ac.pa%3A8443%2F&c=ab3de-fgh2k \n")

        assertEquals(VinculacionQr("https://fisc.utp.ac.pa:8443/", "AB3DEFGH2K"), qr)
    }

    @Test
    fun `el orden de los parametros no importa`() {
        val qr = VinculacionQr.parse("fiscvento://vincular?c=ABCDEFGHJK&u=http%3A%2F%2Fservidor%2F")

        assertEquals(VinculacionQr("http://servidor/", "ABCDEFGHJK"), qr)
    }

    @Test
    fun `rechaza lo que no es un QR de vinculacion`() {
        assertNull(VinculacionQr.parse("ACT-0001"))
        assertNull(VinculacionQr.parse("E2801170000001"))
        assertNull(VinculacionQr.parse("https://fisc.utp.ac.pa/?c=ABCDEFGHJK"))
        assertNull(VinculacionQr.parse("fiscvento://otra?u=http%3A%2F%2Fx%2F&c=ABCDEFGHJK"))
        assertNull(VinculacionQr.parse(""))
    }

    @Test
    fun `rechaza payloads incompletos o con url invalida`() {
        assertNull(VinculacionQr.parse("fiscvento://vincular?c=ABCDEFGHJK"))
        assertNull(VinculacionQr.parse("fiscvento://vincular?u=http%3A%2F%2Fservidor%2F"))
        assertNull(VinculacionQr.parse("fiscvento://vincular?u=ftp%3A%2F%2Fservidor%2F&c=ABCDEFGHJK"))
        assertNull(VinculacionQr.parse("fiscvento://vincular?u=no-es-url&c=ABCDEFGHJK"))
        assertNull(VinculacionQr.parse("fiscvento://vincular?u=http%3A%2F%2Fservidor%2F&c=CORTO"))
    }

    @Test
    fun `normaliza el codigo tecleado a mano`() {
        assertEquals("ABCDEFGHJK", VinculacionQr.normalizarCodigo(" abcde fghjk "))
        assertEquals("ABCDEFGHJK", VinculacionQr.normalizarCodigo("ABCDE-FGHJK"))
        assertNull(VinculacionQr.normalizarCodigo("abc"))
        assertNull(VinculacionQr.normalizarCodigo("x".repeat(40)))
    }
}