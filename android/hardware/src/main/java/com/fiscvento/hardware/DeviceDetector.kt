package com.fiscvento.hardware

import android.os.Build

object DeviceDetector {
    fun isEmulator(): Boolean {
        val fingerprint = Build.FINGERPRINT.lowercase()
        val model = Build.MODEL.lowercase()
        val product = Build.PRODUCT.lowercase()
        val manufacturer = Build.MANUFACTURER.lowercase()
        return fingerprint.contains("generic") ||
            fingerprint.contains("unknown") ||
            model.contains("google_sdk") ||
            model.contains("emulator") ||
            model.contains("android sdk built for") ||
            product.contains("sdk") ||
            product.contains("emulator") ||
            product.contains("google_sdk") ||
            manufacturer.contains("genymotion") ||
            (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
    }

    /** Zebra / Motorola Solutions (TC22r, etc.). */
    fun isZebraDevice(): Boolean {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val brand = Build.BRAND.lowercase()
        val zebraVendor =
            manufacturer.contains("zebra") ||
                brand.contains("zebra") ||
                manufacturer.contains("motorola solutions")
        return zebraVendor
    }

    fun isZebraTc22Family(): Boolean {
        if (!isZebraDevice()) return false
        val model = Build.MODEL.lowercase()
        val product = Build.PRODUCT.lowercase()
        val device = Build.DEVICE.lowercase()
        return model.contains("tc22") ||
            product.contains("tc22") ||
            device.contains("tc22") ||
            // Otros handhelds Zebra con RFID integrado
            model.contains("tc53") ||
            model.contains("mc33") ||
            model.contains("em45") ||
            isZebraDevice()
    }
}
