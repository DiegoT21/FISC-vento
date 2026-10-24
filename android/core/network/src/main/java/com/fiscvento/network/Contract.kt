package com.fiscvento.network

/** CONTRATO FIJO: no cambiar firmas sin avisar a Capi. Ver android/CONTRATO.md */
data class Session(val token: String, val username: String, val rol: String?)

data class Ubicacion(val id: Int, val nombre: String)

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
}
