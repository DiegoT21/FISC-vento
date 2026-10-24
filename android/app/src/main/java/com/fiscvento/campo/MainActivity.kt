package com.fiscvento.campo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.fiscvento.campo.feedback.ScanFeedback
import com.fiscvento.campo.ui.ViewModelFactory
import com.fiscvento.campo.ui.navigation.CampoNav
import com.fiscvento.campo.ui.theme.FiscCampoTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as FiscCampoApp
        val factory = ViewModelFactory(app.container, ScanFeedback(this))
        setContent {
            FiscCampoTheme {
                CampoNav(factory = factory)
            }
        }
    }
}
