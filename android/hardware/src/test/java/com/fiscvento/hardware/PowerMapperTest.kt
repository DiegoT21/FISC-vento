package com.fiscvento.hardware

import org.junit.Assert.assertEquals
import org.junit.Test

class PowerMapperTest {
    @Test
    fun clampsDbm() {
        assertEquals(5, PowerMapper.clampDbm(1))
        assertEquals(30, PowerMapper.clampDbm(99))
        assertEquals(22, PowerMapper.clampDbm(22))
    }

    @Test
    fun picksClosestLevelInTenthsOfDbm() {
        // Índices: 0→50 (5.0 dBm), 1→100 (10 dBm), 2→220 (22 dBm), 3→300 (30 dBm)
        val levels = intArrayOf(50, 100, 220, 300)
        assertEquals(0, PowerMapper.indexForDbm(5, levels))
        assertEquals(1, PowerMapper.indexForDbm(10, levels))
        assertEquals(2, PowerMapper.indexForDbm(22, levels))
        assertEquals(3, PowerMapper.indexForDbm(30, levels))
        assertEquals(2, PowerMapper.indexForDbm(20, levels))
    }

    @Test
    fun fallsBackWithoutLevels() {
        assertEquals(0, PowerMapper.indexForDbm(5, null))
        assertEquals(30, PowerMapper.indexForDbm(30, null))
        assertEquals(20, PowerMapper.indexForDbm(22, null)) // (22-5)*30/25 = 20.4 → 20
    }
}
