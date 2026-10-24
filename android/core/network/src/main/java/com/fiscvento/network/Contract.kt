package com.fiscvento.network

/** CONTRATO FIJO: no cambiar firmas sin avisar a Capi. Ver android/CONTRATO.md */
data class Session(val token: String, val username: String, val rol: String?)

data class Ubicacion(val id: Int, val nombre: String)

/** Equipo registrado en el servidor al vincularlo con el QR de la web. */
data class Dispositivo(val id: Int, val nombre: String)

data class Activo(
    val id: Int,
    val codigo: String,
    val descripcion: String,
    val estado: String,
    val ubicacion: String?,
    val tagRfid: String?,
)

sealed interface LookupResult {
    data class Found(val activo: Activo) : LookupResult
    data object NotFound : LookupResult
}

interface FiscRepository {
    suspend fun login(user: String, pass: String): Result<Session>
    fun restoreSession(): Session?
    fun logout()
    fun serverUrl(): String
    fun setServerUrl(url: String)

    /** POST /api/escaneo/escanear/ con {"valor": ...}. 404 => LookupResult.NotFound. */
    suspend fun lookup(valor: String): Result<LookupResult>
    suspend fun listarActivos(ubicacionId: Int? = null, search: String? = null): Result<List<Activo>>
    suspend fun listarUbicaciones(): Result<List<Ubicacion>>
    /** Guarda el EPC en Activo.tag_rfid. Debe fallar con mensaje claro si el tag ya pertenece a otro activo. */
    suspend fun asociarTag(activoId: Int, epc: String): Result<Activo>
    suspend fun desasociarTag(activoId: Int): Result<Activo>

    /**
     * POST /api/dispositivos/vincular/ (publico): canjea el codigo de un solo uso del QR.
     * Guarda el registro del equipo (id + token) y, desde entonces, cada peticion
     * lleva `X-Dispositivo-Token`. Antes hay que llamar a [setServerUrl] con la URL del QR.
     */
    suspend fun vincularDispositivo(
        codigo: String,
        nombre: String,
        modelo: String,
        androidId: String,
    ): Result<Dispositivo>

    /** Registro local de la vinculacion, o null si este equipo no se ha vinculado. */
    fun dispositivoVinculado(): Dispositivo?
}
