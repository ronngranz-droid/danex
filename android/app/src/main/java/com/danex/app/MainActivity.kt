package com.danex.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import com.danex.app.core.designsystem.DaneXTheme
import com.danex.app.core.navigation.DaneXNavHost
import com.danex.app.core.navigation.NavRoutes
import com.danex.app.features.regioncapture.RegionCaptureService

class MainActivity : ComponentActivity() {

    /**
     * Observed by the Compose tree to auto-solve region capture results.
     * Set by [onNewIntent] when the RegionCaptureService brings the activity to front.
     */
    val hasRegionCaptureResult = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val app = application as DaneXApplication
        val container = app.container

        val incomingText = extractIncomingText(intent)

        // Check if launched with a region capture result
        if (intent?.action == RegionCaptureService.ACTION_RESULT) {
            hasRegionCaptureResult.value = true
        }

        setContent {
            val settings by container.settingsRepository.settingsFlow.collectAsState(
                initial = null
            )

            val isDarkTheme = when (settings?.isDarkMode) {
                true -> true
                false -> false
                null -> isSystemInDarkTheme()
            }

            DaneXTheme(darkTheme = isDarkTheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (settings != null) {
                        val startDestination = if (settings?.hasCompletedOnboarding == true) {
                            NavRoutes.Home.route
                        } else {
                            NavRoutes.Onboarding.route
                        }

                        DaneXNavHost(
                            container = container,
                            startDestination = startDestination,
                            initialQuestionText = incomingText
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.action == RegionCaptureService.ACTION_RESULT) {
            hasRegionCaptureResult.value = true
        }
    }

    private fun extractIncomingText(intent: Intent?): String? {
        if (intent == null) return null
        return when (intent.action) {
            Intent.ACTION_PROCESS_TEXT -> {
                intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
            }
            Intent.ACTION_SEND -> {
                if (intent.type == "text/plain") {
                    intent.getStringExtra(Intent.EXTRA_TEXT)
                } else null
            }
            else -> null
        }
    }
}
