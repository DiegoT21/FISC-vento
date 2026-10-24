package com.fiscvento.hardware

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TagDedupeTest {
    @Test
    fun emitsFirstThenDedupesWithinWindow() {
        val d = TagDedupe(windowMs = 400)
        assertTrue(d.shouldEmit("AAAA", nowMs = 1_000))
        assertFalse(d.shouldEmit("AAAA", nowMs = 1_200))
        assertTrue(d.shouldEmit("AAAA", nowMs = 1_500))
    }

    @Test
    fun differentEpcAlwaysEmits() {
        val d = TagDedupe(windowMs = 400)
        assertTrue(d.shouldEmit("AAAA", nowMs = 1_000))
        assertTrue(d.shouldEmit("BBBB", nowMs = 1_050))
        assertTrue(d.shouldEmit("AAAA", nowMs = 1_100))
    }

    @Test
    fun blankNeverEmits() {
        val d = TagDedupe()
        assertFalse(d.shouldEmit(""))
        assertFalse(d.shouldEmit("   "))
    }
}
