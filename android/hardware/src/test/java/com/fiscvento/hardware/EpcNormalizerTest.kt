package com.fiscvento.hardware

import org.junit.Assert.assertEquals
import org.junit.Test

class EpcNormalizerTest {
    @Test
    fun uppercaseHex() {
        assertEquals("E28011608000021B5BF95AF8", EpcNormalizer.normalize("e28011608000021b5bf95af8"))
    }

    @Test
    fun stripsPcAndCrcWhen32Hex() {
        // PC(4) + EPC96(24) + CRC(4)
        assertEquals(
            "E28011608000021B5BF95AF8",
            EpcNormalizer.normalize("3000E28011608000021B5BF95AF8ABCD"),
        )
    }

    @Test
    fun stripsPcWhen28Hex() {
        assertEquals(
            "E28011608000021B5BF95AF8",
            EpcNormalizer.normalize("3000E28011608000021B5BF95AF8"),
        )
    }

    @Test
    fun takesFirstTokenWhenCommaSeparated() {
        assertEquals(
            "E28011608000021B5BF95AF8",
            EpcNormalizer.normalize("E28011608000021B5BF95AF8,E28011608000021BDEADBEEF"),
        )
    }

    @Test
    fun blankReturnsEmpty() {
        assertEquals("", EpcNormalizer.normalize("   "))
        assertEquals("", EpcNormalizer.normalize("xyz"))
    }
}
