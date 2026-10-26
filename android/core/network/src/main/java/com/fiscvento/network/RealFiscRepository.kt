package com.fiscvento.network

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.io.IOException
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** Implementacion para el equipo: conserva la sesion cifrada y usa la API Django. */
class RealFiscRepository private constructor(
    private val servidorGuardado: AlmacenServidor,
    private val sesionGuardada: AlmacenSesion,
    private val dispositivoGuardado: AlmacenDispositivo,
    defaultUrl: String,
) : FiscRepository {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private var urlActual: String = recuperarUrl(defaultUrl)
    private var sesion: Session? = sesionGuardada.leer()
    private var registro: RegistroDispositivo? = dispositivoGuardado.leer()

    private val clienteHttp = OkHttpClient.Builder()
        .addInterceptor(Interceptor { cadena ->
            val constructor = cadena.request().newBuilder()
            // El canje del QR es publico: un token viejo haria que DRF lo rechace.
            val esVinculacion = cadena.request().url.encodedPath.endsWith(RUTA_VINCULAR)
            val token = sesion?.token
            if (!token.isNullOrBlank() && !esVinculacion) {
                constructor.header("Authorization", "Token $token")
            }
            registro?.token?.let { constructor.header("X-Dispositivo-Token", it) }
            cadena.proceed(constructor.build())
        })
        .build()

    constructor(context: Context, defaultUrl: String) : this(
        servidorGuardado = PreferenciasServidor(
            context.getSharedPreferences(PREFERENCIAS_SERVIDOR, Context.MODE_PRIVATE),
        ),
        sesionGuardada = PreferenciasSesion(crearPreferenciasCifradas(context, PREFERENCIAS_SESION)),
        dispositivoGuardado = PreferenciasDispositivo(
            crearPreferenciasCifradas(context, PREFERENCIAS_DISPOSITIVO),
        ),
        defaultUrl = defaultUrl,
    )

    /** Constructor solo para pruebas unitarias, sin almacenamiento del dispositivo. */
    internal constructor(defaultUrl: String) : this(
        servidorGuardado = ServidorEnMemoria(),
        sesionGuardada = SesionEnMemoria(),
        dispositivoGuardado = DispositivoEnMemoria(),
        defaultUrl = defaultUrl,
    )

    override suspend fun login(user: String, pass: String): Result<Session> {
        val resultado = ejecutar {
            api().login(LoginRequestDto(username = user, password = pass))
        }
        return resultado.map { respuesta ->
            Session(
                token = respuesta.token,
                username = respuesta.usuario.username,
                rol = respuesta.usuario.rol,
            ).also { nuevaSesion ->
                sesion = nuevaSesion
                sesionGuardada.guardar(nuevaSesion)
            }
        }
    }

    override fun restoreSession(): Session? {
        sesion = sesionGuardada.leer()
        return sesion
    }

    override fun logout() {
        sesion = null
        sesionGuardada.borrar()
    }

    override fun serverUrl(): String = urlActual

    override fun setServerUrl(url: String) {
        urlActual = normalizarUrl(url)
        servidorGuardado.guardar(urlActual)
    }

    override suspend fun lookup(valor: String): Result<LookupResult> = try {
        val respuesta = api().lookup(LookupRequestDto(valor))
        when {
            respuesta.isSuccessful -> respuesta.body()?.let { activo ->
                Result.success(LookupResult.Found(activo.aModelo()))
            } ?: Result.failure(ErrorApi("El servidor no devolvio el activo encontrado."))

            respuesta.code() == 404 -> Result.success(LookupResult.NotFound)
            else -> Result.failure(errorDeRespuesta(respuesta))
        }
    } catch (error: IOException) {
        Result.failure(ErrorApi("No se pudo conectar con el servidor. Revisa la direccion e intenta de nuevo.", error))
    } catch (error: Exception) {
        Result.failure(ErrorApi("No se pudo buscar el activo. Intenta de nuevo.", error))
    }

    override suspend fun listarActivos(ubicacionId: Int?, search: String?): Result<List<Activo>> =
        cargarPaginas { pagina ->
            ejecutar {
                api().listarActivos(
                    ubicacionId = ubicacionId,
                    search = search?.takeIf { it.isNotBlank() },
                    pagina = pagina,
                )
            }
        }.map { activos -> activos.map(ActivoDto::aModelo) }

    override suspend fun listarUbicaciones(): Result<List<Ubicacion>> =
        cargarPaginas { pagina ->
            ejecutar { api().listarUbicaciones(pagina) }
        }.map { ubicaciones -> ubicaciones.map(UbicacionDto::aModelo) }

    override suspend fun registrarTagPorEditar(epc: String): Result<RegistroTag> {
        val limpio = epc.trim()
        if (limpio.isEmpty()) {
            return Result.failure(ErrorApi("Lee un tag RFID antes de enviarlo."))
        }
        return ejecutar {
            api().registrarTagPorEditar(EpcRequestDto(limpio))
        }.fold(
            onSuccess = { dto ->
                val estado = when (dto.estado) {
                    "nuevo" -> EstadoTagPorEditar.NUEVO
                    "pendiente" -> EstadoTagPorEditar.PENDIENTE
                    "registrado" -> EstadoTagPorEditar.REGISTRADO
                    else -> return Result.failure(
                        ErrorApi("El servidor no indico si el tag quedo por editar."),
                    )
                }
                Result.success(RegistroTag(dto.epc, estado))
            },
            onFailure = { Result.failure(it) },
        )
    }

    override suspend fun asociarTag(activoId: Int, epc: String): Result<Activo> {
        val tag = epc.trim()
        if (tag.isEmpty()) {
            return Result.failure(ErrorApi("Lee un tag RFID antes de asociarlo."))
        }
        return ejecutar {
            api().actualizarTag(activoId, TagRfidRequestDto(tag))
        }.map(ActivoDto::aModelo)
    }

    override suspend fun desasociarTag(activoId: Int): Result<Activo> =
        ejecutar {
            api().actualizarTag(activoId, TagRfidRequestDto(null))
        }.map(ActivoDto::aModelo)

    override suspend fun vincularDispositivo(
        codigo: String,
        nombre: String,
        modelo: String,
        androidId: String,
    ): Result<Dispositivo> {
        val codigoLimpio = VinculacionQr.normalizarCodigo(codigo)
            ?: return Result.failure(ErrorApi("El código de vinculación no es válido."))
        return ejecutar {
            api().vincular(
                VincularRequestDto(
                    codigo = codigoLimpio,
                    nombreDispositivo = nombre.trim().take(100),
                    modelo = modelo.trim().take(100),
                    androidId = androidId.trim().take(64),
                ),
            )
        }.map { respuesta ->
            Dispositivo(respuesta.dispositivo.id, respuesta.dispositivo.nombre).also { nuevo ->
                registro = RegistroDispositivo(nuevo, respuesta.tokenDispositivo)
                dispositivoGuardado.guardar(registro!!)
            }
        }
    }

    override fun dispositivoVinculado(): Dispositivo? = registro?.dispositivo

    override fun olvidarVinculacion() {
        registro = null
        dispositivoGuardado.borrar()
    }

    private fun recuperarUrl(defaultUrl: String): String {
        val predeterminada = normalizarUrl(defaultUrl)
        val guardada = servidorGuardado.leer()?.let(::urlNormalizadaONull)
        return (guardada ?: predeterminada).also(servidorGuardado::guardar)
    }

    private fun api(): ApiDjango = Retrofit.Builder()
        .baseUrl(urlActual)
        .client(clienteHttp)
        .addConverterFactory(json.asConverterFactory(CONTENIDO_JSON))
        .build()
        .create(ApiDjango::class.java)

    private suspend fun <T> ejecutar(solicitud: suspend () -> Response<T>): Result<T> = try {
        val respuesta = solicitud()
        if (respuesta.isSuccessful) {
            respuesta.body()?.let { Result.success(it) }
                ?: Result.failure(ErrorApi("El servidor no devolvio una respuesta valida."))
        } else {
            Result.failure(errorDeRespuesta(respuesta))
        }
    } catch (error: IOException) {
        Result.failure(ErrorApi("No se pudo conectar con el servidor. Revisa la direccion e intenta de nuevo.", error))
    } catch (error: Exception) {
        Result.failure(ErrorApi("No se pudo completar la solicitud. Intenta de nuevo.", error))
    }

    private suspend fun <T> cargarPaginas(
        cargar: suspend (pagina: Int) -> Result<PaginaDto<T>>,
    ): Result<List<T>> {
        val elementos = mutableListOf<T>()
        var pagina = 1
        do {
            val resultado = cargar(pagina)
            val respuesta = resultado.getOrElse { return Result.failure(it) }
            elementos += respuesta.results
            pagina += 1
        } while (respuesta.next != null)
        return Result.success(elementos)
    }

    private fun errorDeRespuesta(respuesta: Response<*>): ErrorApi {
        if (respuesta.code() == 401) logout()
        val texto = respuesta.errorBody()?.string().orEmpty()
        if (respuesta.code() == 403 && texto.contains(CODIGO_DISPOSITIVO_REVOCADO)) {
            // Un administrador desvinculo este equipo: se borra el registro y la sesion.
            registro = null
            dispositivoGuardado.borrar()
            logout()
        }
        return ErrorApi(mensajeError(texto))
    }

    private fun mensajeError(texto: String): String {
        if (texto.isBlank()) return "No se pudo completar la solicitud. Intenta de nuevo."

        return runCatching {
            val objeto = json.parseToJsonElement(texto) as? JsonObject
            objeto?.get("detail")?.jsonPrimitive?.contentOrNull
                ?: objeto?.mensajesDeCampos()
                ?: "No se pudo completar la solicitud. Intenta de nuevo."
        }.getOrDefault("No se pudo completar la solicitud. Intenta de nuevo.")
    }

    private fun JsonObject.mensajesDeCampos(): String? = entries
        .filter { (campo, _) -> campo != "detail" }
        .mapNotNull { (campo, valor) ->
            val mensaje = when (valor) {
                is JsonArray -> valor.firstOrNull()?.jsonPrimitive?.contentOrNull
                is JsonPrimitive -> valor.contentOrNull
                else -> null
            }
            mensaje?.let { "${nombreCampo(campo)}: $it" }
        }
        .takeIf { it.isNotEmpty() }
        ?.joinToString(" ")

    private fun nombreCampo(campo: String): String = when (campo) {
        "tag_rfid" -> "El tag RFID"
        "username", "email" -> "El usuario"
        "password" -> "La contrasena"
        "non_field_errors" -> "La solicitud"
        else -> campo.replace('_', ' ')
    }

    private fun normalizarUrl(url: String): String = urlNormalizadaONull(url)
        ?: throw IllegalArgumentException("La direccion del servidor no es valida.")

    private fun urlNormalizadaONull(url: String): String? {
        val limpia = url.trim()
        val httpUrl = limpia.toHttpUrlOrNull() ?: return null
        if (httpUrl.scheme != "http" && httpUrl.scheme != "https") return null
        return limpia.trimEnd('/') + "/"
    }

    private interface AlmacenServidor {
        fun leer(): String?
        fun guardar(url: String)
    }

    private interface AlmacenSesion {
        fun leer(): Session?
        fun guardar(sesion: Session)
        fun borrar()
    }

    private interface AlmacenDispositivo {
        fun leer(): RegistroDispositivo?
        fun guardar(registro: RegistroDispositivo)
        fun borrar()
    }

    private class RegistroDispositivo(val dispositivo: Dispositivo, val token: String)

    private class PreferenciasServidor(
        private val preferencias: SharedPreferences,
    ) : AlmacenServidor {
        override fun leer(): String? = preferencias.getString(CLAVE_SERVIDOR, null)
        override fun guardar(url: String) {
            preferencias.edit().putString(CLAVE_SERVIDOR, url).apply()
        }
    }

    private class PreferenciasSesion(
        private val preferencias: SharedPreferences,
    ) : AlmacenSesion {
        override fun leer(): Session? {
            val token = preferencias.getString(CLAVE_TOKEN, null)
            val usuario = preferencias.getString(CLAVE_USUARIO, null)
            return if (token.isNullOrBlank() || usuario.isNullOrBlank()) null else Session(
                token = token,
                username = usuario,
                rol = preferencias.getString(CLAVE_ROL, null),
            )
        }

        override fun guardar(sesion: Session) {
            preferencias.edit()
                .putString(CLAVE_TOKEN, sesion.token)
                .putString(CLAVE_USUARIO, sesion.username)
                .putString(CLAVE_ROL, sesion.rol)
                .apply()
        }

        override fun borrar() {
            preferencias.edit().clear().apply()
        }
    }

    private class PreferenciasDispositivo(
        private val preferencias: SharedPreferences,
    ) : AlmacenDispositivo {
        override fun leer(): RegistroDispositivo? {
            val token = preferencias.getString(CLAVE_DISPOSITIVO_TOKEN, null)
            val nombre = preferencias.getString(CLAVE_DISPOSITIVO_NOMBRE, null)
            val id = preferencias.getInt(CLAVE_DISPOSITIVO_ID, -1)
            return if (token.isNullOrBlank() || nombre.isNullOrBlank() || id < 0) null else {
                RegistroDispositivo(Dispositivo(id, nombre), token)
            }
        }

        override fun guardar(registro: RegistroDispositivo) {
            preferencias.edit()
                .putInt(CLAVE_DISPOSITIVO_ID, registro.dispositivo.id)
                .putString(CLAVE_DISPOSITIVO_NOMBRE, registro.dispositivo.nombre)
                .putString(CLAVE_DISPOSITIVO_TOKEN, registro.token)
                .apply()
        }

        override fun borrar() {
            preferencias.edit().clear().apply()
        }
    }

    private class DispositivoEnMemoria : AlmacenDispositivo {
        private var registro: RegistroDispositivo? = null
        override fun leer(): RegistroDispositivo? = registro
        override fun guardar(registro: RegistroDispositivo) {
            this.registro = registro
        }
        override fun borrar() {
            registro = null
        }
    }

    private class ServidorEnMemoria : AlmacenServidor {
        private var url: String? = null
        override fun leer(): String? = url
        override fun guardar(url: String) {
            this.url = url
        }
    }

    private class SesionEnMemoria : AlmacenSesion {
        private var sesion: Session? = null
        override fun leer(): Session? = sesion
        override fun guardar(sesion: Session) {
            this.sesion = sesion
        }
        override fun borrar() {
            sesion = null
        }
    }

    @Serializable
    private data class LoginRequestDto(val username: String, val password: String)

    @Serializable
    private data class LoginResponseDto(val token: String, val usuario: UsuarioDto)

    @Serializable
    private data class UsuarioDto(val username: String, val rol: String? = null)

    @Serializable
    private data class VincularRequestDto(
        val codigo: String,
        @SerialName("nombre_dispositivo") val nombreDispositivo: String,
        val modelo: String,
        @SerialName("android_id") val androidId: String,
    )

    @Serializable
    private data class DispositivoDto(val id: Int, val nombre: String)

    @Serializable
    private data class VincularResponseDto(
        val dispositivo: DispositivoDto,
        @SerialName("token_dispositivo") val tokenDispositivo: String,
    )

    @Serializable
    private data class LookupRequestDto(val valor: String)

    @Serializable
    private data class EpcRequestDto(val epc: String)

    @Serializable
    private data class TagPorEditarDto(val epc: String, val estado: String)

    @Serializable
    private data class TagRfidRequestDto(@SerialName("tag_rfid") val tagRfid: String?)

    @Serializable
    private data class ActivoDto(
        val id: Int,
        val codigo: String,
        val descripcion: String,
        val estado: String,
        @SerialName("ubicacion_nombre") val ubicacion: String? = null,
        @SerialName("tag_rfid") val tagRfid: String? = null,
    ) {
        fun aModelo() = Activo(id, codigo, descripcion, estado, ubicacion, tagRfid)
    }

    @Serializable
    private data class UbicacionDto(val id: Int, val nombre: String) {
        fun aModelo() = Ubicacion(id, nombre)
    }

    @Serializable
    private data class PaginaDto<T>(
        val next: String? = null,
        val results: List<T> = emptyList(),
    )

    private interface ApiDjango {
        @POST("api/usuarios/login/")
        suspend fun login(@Body datos: LoginRequestDto): Response<LoginResponseDto>

        @POST("api/dispositivos/vincular/")
        suspend fun vincular(@Body datos: VincularRequestDto): Response<VincularResponseDto>

        @POST("api/escaneo/escanear/")
        suspend fun lookup(@Body datos: LookupRequestDto): Response<ActivoDto>

        @POST("api/activos/por-editar/")
        suspend fun registrarTagPorEditar(@Body datos: EpcRequestDto): Response<TagPorEditarDto>

        @GET("api/activos/")
        suspend fun listarActivos(
            @Query("ubicacion") ubicacionId: Int?,
            @Query("search") search: String?,
            @Query("page") pagina: Int,
        ): Response<PaginaDto<ActivoDto>>

        @GET("api/ubicaciones/")
        suspend fun listarUbicaciones(@Query("page") pagina: Int): Response<PaginaDto<UbicacionDto>>

        @PATCH("api/activos/{activoId}/")
        suspend fun actualizarTag(
            @Path("activoId") activoId: Int,
            @Body datos: TagRfidRequestDto,
        ): Response<ActivoDto>
    }

    private class ErrorApi(mensaje: String, causa: Throwable? = null) : Exception(mensaje, causa)

    private companion object {
        const val PREFERENCIAS_SERVIDOR = "fisc_servidor"
        const val PREFERENCIAS_SESION = "fisc_sesion"
        const val PREFERENCIAS_DISPOSITIVO = "fisc_dispositivo"
        const val RUTA_VINCULAR = "api/dispositivos/vincular/"
        const val CODIGO_DISPOSITIVO_REVOCADO = "dispositivo_revocado"
        const val CLAVE_DISPOSITIVO_ID = "id"
        const val CLAVE_DISPOSITIVO_NOMBRE = "nombre"
        const val CLAVE_DISPOSITIVO_TOKEN = "token"
        const val CLAVE_SERVIDOR = "url"
        const val CLAVE_TOKEN = "token"
        const val CLAVE_USUARIO = "usuario"
        const val CLAVE_ROL = "rol"
        val CONTENIDO_JSON = "application/json".toMediaType()

        @Suppress("DEPRECATION")
        fun crearPreferenciasCifradas(context: Context, nombre: String): SharedPreferences {
            val llave = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            return EncryptedSharedPreferences.create(
                context,
                nombre,
                llave,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        }
    }
}
