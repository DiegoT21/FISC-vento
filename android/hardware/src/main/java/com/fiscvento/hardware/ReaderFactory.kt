package com.fiscvento.hardware

import android.content.Context

/** Punto de entrada que usa :app. Zebra TC22r → API3 + DataWedge; resto → fake. */
object ReaderFactory {
    fun create(context: Context): ReaderGateway {
        return if (DeviceDetector.isZebraDevice()) {
            ZebraReaderGateway(context.applicationContext)
        } else {
            FakeReaderGateway(
                ready = false,
                message = "Este equipo no es Zebra TC22. El lector real solo funciona en el TC22r.",
            )
        }
    }
}
