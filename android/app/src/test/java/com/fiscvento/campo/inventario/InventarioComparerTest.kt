package com.fiscvento.campo.inventario

import com.fiscvento.network.Activo
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class InventarioComparerTest {

    private val oficina = listOf(
        Activo(1, "ACT-0001", "Laptop", "ACTIVO", "Oficina", "EPC001"),
        Activo(2, "ACT-0002", "Proyector", "ACTIVO", "Oficina", "EPC002"),
        Activo(3, "ACT-0003", "Silla", "ACTIVO", "Oficina", null),
    )
    private val sala2 = Activo(4, "ACT-0004", "Monitor", "ACTIVO", "Sala 2", "EPC004")
    private val catalogo = oficina + sala2

    @Test
    fun `todo leido correcto va a OK`() {
        val r = InventarioComparer.comparar(
            epcsLeidos = setOf("EPC001", "EPC002"),
            esperadosEnUbicacion = oficina,
            catalogoCompleto = catalogo,
        )
        assertEquals(listOf(1, 2), r.ok.map { it.id })
        assertEquals(listOf(3), r.faltantes.map { it.id })
        assertTrue(r.extras.isEmpty())
        assertTrue(r.desconocidos.isEmpty())
    }

    @Test
    fun `tag de otra ubicacion es extra`() {
        val r = InventarioComparer.comparar(
            epcsLeidos = setOf("EPC001", "EPC004"),
            esperadosEnUbicacion = oficina,
            catalogoCompleto = catalogo,
        )
        assertEquals(listOf(1), r.ok.map { it.id })
        assertEquals(listOf(4), r.extras.map { it.id })
        assertEquals(listOf(2, 3), r.faltantes.map { it.id })
    }

    @Test
    fun `tag sin activo es desconocido`() {
        val r = InventarioComparer.comparar(
            epcsLeidos = setOf("EPC999"),
            esperadosEnUbicacion = oficina,
            catalogoCompleto = catalogo,
        )
        assertEquals(listOf("EPC999"), r.desconocidos)
        assertEquals(oficina.map { it.id }, r.faltantes.map { it.id })
    }

    @Test
    fun `sin lecturas todos faltan`() {
        val r = InventarioComparer.comparar(
            epcsLeidos = emptySet(),
            esperadosEnUbicacion = oficina,
            catalogoCompleto = catalogo,
        )
        assertTrue(r.ok.isEmpty())
        assertEquals(3, r.faltantes.size)
        assertEquals(0, r.totalLeidos)
    }

    @Test
    fun `resumenTexto incluye contadores`() {
        val r = InventarioComparer.comparar(
            epcsLeidos = setOf("EPC001", "EPC999"),
            esperadosEnUbicacion = oficina,
            catalogoCompleto = catalogo,
        )
        val texto = r.resumenTexto("Oficina")
        assertTrue(texto.contains("OK: 1"))
        assertTrue(texto.contains("Desconocidos: 1"))
        assertTrue(texto.contains("Oficina"))
    }
}
