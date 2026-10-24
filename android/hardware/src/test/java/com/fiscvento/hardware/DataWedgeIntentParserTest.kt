package com.fiscvento.hardware

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DataWedgeIntentParserTest {
    @Test
    fun prefersSymbolDataString() {
        val extras = mapOf(
            "com.symbol.datawedge.data_string" to " 123456789012 ",
            "data" to "otro",
        )
        assertEquals("123456789012", DataWedgeIntentParser.extractBarcode(extras))
    }

    @Test
    fun fallsBackToGenericKeys() {
        assertEquals(
            "ABC-99",
            DataWedgeIntentParser.extractBarcode(mapOf("barcode" to "ABC-99")),
        )
    }

    @Test
    fun emptyExtrasReturnsNull() {
        assertNull(DataWedgeIntentParser.extractBarcode(emptyMap()))
        assertNull(DataWedgeIntentParser.extractBarcode(mapOf("data" to "  ")))
    }

    @Test
    fun scanActionIsFiscCampo() {
        assertEquals("com.fiscvento.campo.BARCODE_SCAN", DataWedgeIntentParser.ACTION_SCAN)
    }
}
