package com.danex.app.data.preferences

import com.danex.app.domain.model.SolveMode

enum class ClipboardAutomationMode(val displayName: String) {
    OFF("Nonaktif"),
    ANSWER_ONLY("Hanya Jawaban Singkat"),
    ANSWER_WITH_EXPLANATION("Jawaban & Penjelasan"),
    LATEX("Format LaTeX")
}

enum class ClipboardFormat(val displayName: String) {
    OPTION_LETTER_ONLY("Hanya Huruf (Contoh: C)"),
    OPTION_AND_TEXT("Huruf dan Teks (Contoh: C — Mitokondria)")
}

data class UserSettings(
    val outputLanguage: String = "id",
    val solveMode: SolveMode = SolveMode.QUICK,
    val explanationLength: String = "concise",
    val isDarkMode: Boolean? = null,
    val ocrFastPathEnabled: Boolean = true,
    val instantRegionProcess: Boolean = true,
    val notificationDelivery: Boolean = true,
    val floatingResultEnabled: Boolean = false,
    val clipboardAutomation: ClipboardAutomationMode = ClipboardAutomationMode.OFF,
    val clipboardFormat: ClipboardFormat = ClipboardFormat.OPTION_AND_TEXT,
    val retainScreenshots: Boolean = false,
    val hasCompletedOnboarding: Boolean = false
)
