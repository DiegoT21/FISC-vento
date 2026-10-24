package com.fiscvento.hardware

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log

/**
 * DataWedge: perfil de barras (Code 128 + QR para vincular el equipo → intent) y RFID DW apagado
 * para no competir con API3.
 */
class ZebraDataWedgeBridge(private val context: Context) {

    fun releaseRfidForNative() {
        createProfile(PROFILE_NAME)
        setRfidDisabled(PROFILE_NAME)
        disableProfileRfid("Profile0")
        disableProfileRfid(PROFILE_NAME)
        sendApi(EXTRA_SWITCH_TO_PROFILE to "Profile0")
        Log.i(TAG, "DataWedge RFID liberado para API3")
    }

    /** Perfil de barras asociado a [APP_PACKAGE]; RFID DW off; salida por INTENT (no teclado). */
    fun ensureBarcodeProfile() {
        createProfile(BARCODE_PROFILE_NAME)
        setBarcodeConfig()
        sendApi(EXTRA_SWITCH_TO_PROFILE to BARCODE_PROFILE_NAME)
        sendApi(EXTRA_SCANNER_INPUT_PLUGIN to "ENABLE_PLUGIN")
        Log.i(TAG, "Perfil barras listo → ${DataWedgeIntentParser.ACTION_SCAN}")
    }

    private fun createProfile(name: String) {
        sendApi(EXTRA_CREATE_PROFILE to name)
    }

    private fun setRfidDisabled(profileName: String) {
        val rfid = Bundle().apply {
            putString("PLUGIN_NAME", "RFID")
            putString("RESET_CONFIG", "true")
            putBundle(
                "PARAM_LIST",
                Bundle().apply {
                    putString("rfid_input_enabled", "false")
                    putString("rfid_hardware_trigger_enabled", "false")
                },
            )
        }
        val profileConfig = Bundle().apply {
            putString("PROFILE_NAME", profileName)
            putString("PROFILE_ENABLED", "false")
            putString("CONFIG_MODE", "UPDATE")
            putParcelableArray("PLUGIN_CONFIG", arrayOf(rfid))
            putParcelableArray("APP_LIST", arrayOf(appConfigBundle()))
        }
        sendApi(EXTRA_SET_CONFIG to profileConfig)
    }

    private fun disableProfileRfid(profileName: String) {
        val rfid = Bundle().apply {
            putString("PLUGIN_NAME", "RFID")
            putString("RESET_CONFIG", "false")
            putBundle(
                "PARAM_LIST",
                Bundle().apply { putString("rfid_input_enabled", "false") },
            )
        }
        val profileConfig = Bundle().apply {
            putString("PROFILE_NAME", profileName)
            putString("PROFILE_ENABLED", "true")
            putString("CONFIG_MODE", "UPDATE")
            putParcelableArray("PLUGIN_CONFIG", arrayOf(rfid))
        }
        sendApi(EXTRA_SET_CONFIG to profileConfig)
    }

    private fun setBarcodeConfig() {
        val barcodeParams = Bundle().apply {
            putString("scanner_selection", "auto")
            putString("scanner_input_enabled", "true")
            putString("decoder_code128", "true")
            // QR solo para la vinculacion del equipo (QR de la web); los activos siguen en Code 128.
            putString("decoder_qrcode", "true")
        }
        val barcode = Bundle().apply {
            putString("PLUGIN_NAME", "BARCODE")
            putString("RESET_CONFIG", "true")
            putBundle("PARAM_LIST", barcodeParams)
        }
        val rfid = Bundle().apply {
            putString("PLUGIN_NAME", "RFID")
            putString("RESET_CONFIG", "true")
            putBundle(
                "PARAM_LIST",
                Bundle().apply {
                    putString("rfid_input_enabled", "false")
                    putString("rfid_hardware_trigger_enabled", "false")
                },
            )
        }
        val intentOut = Bundle().apply {
            putString("PLUGIN_NAME", "INTENT")
            putString("RESET_CONFIG", "true")
            putBundle(
                "PARAM_LIST",
                Bundle().apply {
                    putString("intent_output_enabled", "true")
                    putString("intent_action", DataWedgeIntentParser.ACTION_SCAN)
                    putString("intent_category", "android.intent.category.DEFAULT")
                    putString("intent_delivery", "2") // broadcast
                },
            )
        }
        val keystroke = Bundle().apply {
            putString("PLUGIN_NAME", "KEYSTROKE")
            putString("RESET_CONFIG", "true")
            putBundle(
                "PARAM_LIST",
                Bundle().apply { putString("keystroke_output_enabled", "false") },
            )
        }
        val profileConfig = Bundle().apply {
            putString("PROFILE_NAME", BARCODE_PROFILE_NAME)
            putString("PROFILE_ENABLED", "true")
            putString("CONFIG_MODE", "UPDATE")
            putParcelableArrayList(
                "PLUGIN_CONFIG",
                arrayListOf(barcode, rfid, intentOut, keystroke),
            )
            putParcelableArray("APP_LIST", arrayOf(appConfigBundle()))
        }
        sendApi(EXTRA_SET_CONFIG to profileConfig)
    }

    private fun appConfigBundle(): Bundle = Bundle().apply {
        putString("PACKAGE_NAME", APP_PACKAGE)
        putStringArray("ACTIVITY_LIST", arrayOf("*"))
    }

    private fun sendApi(vararg extras: Pair<String, Any>) {
        val intent = Intent(ACTION_DATAWEDGE).apply {
            extras.forEach { (key, value) ->
                when (value) {
                    is String -> putExtra(key, value)
                    is Bundle -> putExtra(key, value)
                    is Boolean -> putExtra(key, value)
                    else -> putExtra(key, value.toString())
                }
            }
        }
        runCatching { context.sendBroadcast(intent) }
            .onFailure { Log.w(TAG, "broadcast DataWedge falló", it) }
    }

    companion object {
        private const val TAG = "FiscDataWedge"
        const val PROFILE_NAME = "FiscVentoRfidOff"
        const val BARCODE_PROFILE_NAME = "FiscVento"
        const val APP_PACKAGE = "com.fiscvento.campo"

        private const val ACTION_DATAWEDGE = "com.symbol.datawedge.api.ACTION"
        private const val EXTRA_CREATE_PROFILE = "com.symbol.datawedge.api.CREATE_PROFILE"
        private const val EXTRA_SET_CONFIG = "com.symbol.datawedge.api.SET_CONFIG"
        private const val EXTRA_SWITCH_TO_PROFILE = "com.symbol.datawedge.api.SWITCH_TO_PROFILE"
        private const val EXTRA_SCANNER_INPUT_PLUGIN = "com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN"
    }
}
