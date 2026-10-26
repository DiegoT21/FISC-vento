package com.fiscvento.hardware

import android.app.ActivityManager
import android.content.Context
import android.util.Log

/** Libera apps que suelen ocupar el radio RFID del TC22r antes de abrir API3. */
object ZebraRadioClaim {
    private const val TAG = "ZebraRadioClaim"

    val COMPETING_PACKAGES = listOf(
        "com.zebra.rfid.rwdemo",
        "com.zebra.rfidreaderAPI.demo",
        "com.zebra.demo.rfidreader",
        "com.zebra.rfid.demo.sdksample",
        "com.zebra.rfid.demo.handheld",
        "com.symbol.emdk.rfidsample1",
        "com.zebra.scanner.rfid",
    )

    fun releaseCompetitors(context: Context) {
        val am = context.getSystemService(ActivityManager::class.java) ?: return
        for (pkg in COMPETING_PACKAGES) {
            runCatching {
                am.killBackgroundProcesses(pkg)
                Log.i(TAG, "killBackgroundProcesses $pkg")
            }.onFailure {
                Log.w(TAG, "killBackgroundProcesses $pkg failed", it)
            }
        }
    }
}
