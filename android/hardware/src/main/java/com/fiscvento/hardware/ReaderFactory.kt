package com.fiscvento.hardware

import android.content.Context

/** Punto de entrada que usa :app. Cursor lo reemplaza por la implementacion real (Zebra API3 + DataWedge). */
object ReaderFactory {
    fun create(context: Context): ReaderGateway = FakeReaderGateway()
}
