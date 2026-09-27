package com.danex.app.core.automation

import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.domain.model.SolveResult

object ClipboardAutomationHelper {

    /**
     * Formats a SolveResult into the user's desired clipboard text format.
     */
    fun formatClipboardText(
        result: SolveResult,
        automationMode: ClipboardAutomationMode,
        format: ClipboardFormat
    ): String? {
        if (automationMode == ClipboardAutomationMode.OFF) {
            return null
        }

        val answerText = when (format) {
            ClipboardFormat.OPTION_LETTER_ONLY -> {
                result.answerOption ?: result.answer
            }
            ClipboardFormat.OPTION_AND_TEXT -> {
                result.formattedShortNotification
            }
        }

        return when (automationMode) {
            ClipboardAutomationMode.OFF -> null
            ClipboardAutomationMode.ANSWER_ONLY -> {
                answerText
            }
            ClipboardAutomationMode.ANSWER_WITH_EXPLANATION -> {
                buildString {
                    append(answerText)
                    if (result.explanation.isNotBlank()) {
                        append("\n\nPenjelasan:\n")
                        append(result.explanation)
                    }
                    if (result.steps.isNotEmpty()) {
                        append("\n\nLangkah-langkah:\n")
                        result.steps.forEach { step ->
                            append("- $step\n")
                        }
                    }
                }.trimEnd()
            }
            ClipboardAutomationMode.LATEX -> {
                result.latex ?: answerText
            }
        }
    }
}
