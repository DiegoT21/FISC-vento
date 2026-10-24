package com.fiscvento.network

import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class RealFiscRepositoryTest {
    private lateinit var servidor: MockWebServer
    private lateinit var repositorio: RealFiscRepository

    @Before
    fun preparar() {
        servidor = MockWebServer()
        servidor.start()
        repositorio = RealFiscRepository(servidor.url("/").toString())
    }

    @After
    fun cerrar() {
        servidor.shutdown()
    }

    @Test
    fun `login exitoso guarda la sesion`() = runTest {
        servidor.enqueue(json(200, """
            {"token":"token-prueba","usuario":{"username":"maria","rol":"CUSTODIO"}}
        """))

        val sesion = repositorio.login("maria", "clave").getOrThrow()

        assertEquals(Session("token-prueba", "maria", "CUSTODIO"), sesion)
        assertEquals(sesion, repositorio.restoreSession())
        val solicitud = servidor.takeRequest()
        assertEquals("/api/usuarios/login/", solicitud.path)
        assertEquals("{\"username\":\"maria\",\"password\":\"clave\"}", solicitud.body.readUtf8())
    }

    @Test
    fun `login fallido devuelve el mensaje de Django`() = runTest {
        servidor.enqueue(json(401, """{"detail":"Credenciales inválidas."}"""))

        val resultado = repositorio.login("maria", "incorrecta")

        assertTrue(resultado.isFailure)
        assertEquals("Credenciales inválidas.", resultado.exceptionOrNull()?.message)
        assertNull(repositorio.restoreSession())
    }

    @Test
    fun `lookup encontrado mapea el activo`() = runTest {
        servidor.enqueue(json(200, activoJson(id = 4, tag = "E280")))

        val resultado = repositorio.lookup("E280").getOrThrow()

        assertEquals(
            LookupResult.Found(Activo(4, "ACT-0004", "Laptop", "ACTIVO", "Laboratorio", "E280")),
            resultado,
        )
        val solicitud = servidor.takeRequest()
        assertEquals("/api/escaneo/escanear/", solicitud.path)
        assertEquals("{\"valor\":\"E280\"}", solicitud.body.readUtf8())
    }

    @Test
    fun `lookup inexistente devuelve NotFound`() = runTest {
        servidor.enqueue(json(404, """{"detail":"No se encontró un activo."}"""))

        val resultado = repositorio.lookup("DESCONOCIDO").getOrThrow()

        assertEquals(LookupResult.NotFound, resultado)
    }

    @Test
    fun `asociar tag actualiza el activo mediante patch`() = runTest {
        servidor.enqueue(json(200, activoJson(id = 4, tag = "E2801170")))

        val activo = repositorio.asociarTag(4, " E2801170 ").getOrThrow()

        assertEquals("E2801170", activo.tagRfid)
        val solicitud = servidor.takeRequest()
        assertEquals("PATCH", solicitud.method)
        assertEquals("/api/activos/4/", solicitud.path)
        assertEquals("{\"tag_rfid\":\"E2801170\"}", solicitud.body.readUtf8())
    }

    @Test
    fun `listar activos recupera todas las paginas`() = runTest {
        servidor.enqueue(json(200, """
            {"count":2,"next":"http://pagina-dos","previous":null,"results":[${activoJson(1, null)}]}
        """))
        servidor.enqueue(json(200, """
            {"count":2,"next":null,"previous":"http://pagina-uno","results":[${activoJson(2, "EPC-2")}]} 
        """))

        val activos = repositorio.listarActivos(ubicacionId = 8, search = "laptop").getOrThrow()

        assertEquals(listOf("ACT-0001", "ACT-0002"), activos.map(Activo::codigo))
        assertTrue(servidor.takeRequest().path!!.contains("page=1"))
        assertTrue(servidor.takeRequest().path!!.contains("page=2"))
    }

    @Test
    fun `respuesta no autorizada cierra la sesion local`() = runTest {
        servidor.enqueue(json(200, """
            {"token":"token-prueba","usuario":{"username":"maria","rol":"CUSTODIO"}}
        """))
        servidor.enqueue(json(401, """{"detail":"La sesión expiró."}"""))
        repositorio.login("maria", "clave").getOrThrow()

        val resultado = repositorio.lookup("E280")

        assertTrue(resultado.isFailure)
        assertEquals("La sesión expiró.", resultado.exceptionOrNull()?.message)
        assertNull(repositorio.restoreSession())
        servidor.takeRequest()
        assertEquals("Token token-prueba", servidor.takeRequest().getHeader("Authorization"))
    }

    private fun json(codigo: Int, cuerpo: String): MockResponse = MockResponse()
        .setResponseCode(codigo)
        .setHeader("Content-Type", "application/json")
        .setBody(cuerpo.trimIndent())

    private fun activoJson(id: Int, tag: String?): String = """
        {"id":$id,"codigo":"ACT-000$id","descripcion":"Laptop","estado":"ACTIVO",
        "ubicacion_nombre":"Laboratorio","tag_rfid":${tag?.let { "\"$it\"" } ?: "null"}}
    """.trimIndent()
}
