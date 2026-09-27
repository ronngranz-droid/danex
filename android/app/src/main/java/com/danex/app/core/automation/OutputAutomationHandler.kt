package com.danex.app.core.automation

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.danex.app.data.preferences.UserSettings
import com.danex.app.domain.model.SolveResult
import com.danex.app.features.floating.FloatingResultManager

interface OutputAutomationHandler {
    fun deliverResult(result: SolveResult, settings: UserSettings)
}

class DefaultOutputAutomationHandler(
    private val appContext: Context
) : OutputAutomationHandler {

    override fun deliverResult(result: SolveResult, settings: UserSettings) {
        // 1. Notification Delivery
        if (settings.notificationDelivery) {
            DaneXNotificationHelper.showSolutionNotification(appContext, result)
        }

        // 2. Floating Result Card
        if (settings.floatingResultEnabled) {
            FloatingResultManager.showFloatingResult(appContext, result)
        }

        // 3. Clipboard Automation
        val clipboardText = ClipboardAutomationHelper.formatClipboardText(
            result = result,
            automationMode = settings.clipboardAutomation,
            format = settings.clipboardFormat
        )

        if (clipboardText != null) {
            try {
                val clipboard = appContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                val clip = ClipData.newPlainText("DaneX Solution", clipboardText)
                clipboard?.setPrimaryClip(clip)
            } catch (_: Exception) {
                // Background clipboard access restriction handling
            }
        }
    }
}
