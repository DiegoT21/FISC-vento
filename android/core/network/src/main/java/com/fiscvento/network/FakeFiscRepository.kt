package com.fiscvento.network

/** Datos de ejemplo EN MEMORIA para desarrollar la UI sin servidor. No es dato real. */
class FakeFiscRepository : FiscRepository {
    private var url = "http://3.149.4.52/"
    private var session: Session? = null
    private var dispositivo: Dispositivo? = null
    private val porEditar = mutableSetOf<String>()
    private val activos = mutableListOf(
        Activo(1, "ACT-0001", "Laptop (ejemplo)", "disponible", "Oficina", "E2801170000001"),
        Activo(2, "ACT-0002", "Proyector (ejemplo)", "disponible", "Sala 2", null),
        Activo(3, "ACT-0003", "Impresora (ejemplo)", "en_uso", "Oficina", "E2801170000003"),
    )
    override suspend fun login(user: String, pass: String): Result<Session> =
        Result.success(Session("fake-token", user, "admin").also { session = it })
    override fun restoreSession(): Session? = session
    override fun logout() { session = null }
    override fun serverUrl(): String = url
    override fun setServerUrl(url: String) { this.url = url }
    override suspend fun lookup(valor: String): Result<LookupResult> =
        Result.success(activos.firstOrNull { it.codigo == valor || it.tagRfid == valor }
            ?.let { LookupResult.Found(it) } ?: LookupResult.NotFound)
    override suspend fun listarActivos(ubicacionId: Int?, search: String?): Result<List<Activo>> =
        Result.success(activos.toList())
    override suspend fun listarUbicaciones(): Result<List<Ubicacion>> =
        Result.success(listOf(Ubicacion(1, "Oficina"), Ubicacion(2, "Sala 2")))
    override suspend fun asociarTag(activoId: Int, epc: String): Result<Activo> {
        val i = activos.indexOfFirst { it.id == activoId }
        if (i < 0) return Result.failure(IllegalArgumentException("Activo no existe"))
        if (activos.any { it.tagRfid == epc && it.id != activoId }) return Result.failure(IllegalStateException("Ese tag ya pertenece a otro activo"))
        activos[i] = activos[i].copy(tagRfid = epc); return Result.success(activos[i])
    }
    override suspend fun registrarTagPorEditar(epc: String): Result<RegistroTag> {
        val limpio = epc.trim()
        if (activos.any { it.tagRfid == limpio }) {
            return Result.success(RegistroTag(limpio, EstadoTagPorEditar.REGISTRADO))
        }
        val nuevo = porEditar.add(limpio)
        val estado = if (nuevo) EstadoTagPorEditar.NUEVO else EstadoTagPorEditar.PENDIENTE
        return Result.success(RegistroTag(limpio, estado))
    }
    override suspend fun vincularDispositivo(
        codigo: String,
        nombre: String,
        modelo: String,
        androidId: String,
    ): Result<Dispositivo> =
        if (VinculacionQr.normalizarCodigo(codigo) == null) {
            Result.failure(IllegalArgumentException("El código de vinculación no es válido o ya venció."))
        } else {
            Result.success(Dispositivo(1, nombre).also { dispositivo = it })
        }
    override fun dispositivoVinculado(): Dispositivo? = dispositivo
    override fun olvidarVinculacion() { dispositivo = null }
    override suspend fun desasociarTag(activoId: Int): Result<Activo> {
        val i = activos.indexOfFirst { it.id == activoId }
        if (i < 0) return Result.failure(IllegalArgumentException("Activo no existe"))
        activos[i] = activos[i].copy(tagRfid = null); return Result.success(activos[i])
    }
}
