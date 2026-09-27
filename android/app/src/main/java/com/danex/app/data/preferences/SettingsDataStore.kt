package com.danex.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.danex.app.domain.model.SolveMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "danex_settings")

class SettingsDataStore(private val context: Context) {

    private object PreferencesKeys {
        val OUTPUT_LANGUAGE = stringPreferencesKey("output_language")
        val SOLVE_MODE = stringPreferencesKey("solve_mode")
        val EXPLANATION_LENGTH = stringPreferencesKey("explanation_length")
        val IS_DARK_MODE = stringPreferencesKey("theme_mode") // "light", "dark", "system"
        val OCR_FAST_PATH = booleanPreferencesKey("ocr_fast_path")
        val INSTANT_REGION_PROCESS = booleanPreferencesKey("instant_region_process")
        val NOTIFICATION_DELIVERY = booleanPreferencesKey("notification_delivery")
        val FLOATING_RESULT = booleanPreferencesKey("floating_result")
        val CLIPBOARD_AUTOMATION = stringPreferencesKey("clipboard_automation")
        val CLIPBOARD_FORMAT = stringPreferencesKey("clipboard_format")
        val RETAIN_SCREENSHOTS = booleanPreferencesKey("retain_screenshots")
        val HAS_COMPLETED_ONBOARDING = booleanPreferencesKey("has_completed_onboarding")
    }

    val userSettingsFlow: Flow<UserSettings> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            val lang = preferences[PreferencesKeys.OUTPUT_LANGUAGE] ?: "id"
            val modeStr = preferences[PreferencesKeys.SOLVE_MODE] ?: SolveMode.QUICK.name
            val mode = SolveMode.fromString(modeStr)
            val expLength = preferences[PreferencesKeys.EXPLANATION_LENGTH] ?: "concise"
            val themeStr = preferences[PreferencesKeys.IS_DARK_MODE] ?: "system"
            val isDark = when (themeStr) {
                "dark" -> true
                "light" -> false
                else -> null
            }
            val ocr = preferences[PreferencesKeys.OCR_FAST_PATH] ?: true
            val instant = preferences[PreferencesKeys.INSTANT_REGION_PROCESS] ?: true
            val notif = preferences[PreferencesKeys.NOTIFICATION_DELIVERY] ?: true
            val floating = preferences[PreferencesKeys.FLOATING_RESULT] ?: false
            val clipAutoStr = preferences[PreferencesKeys.CLIPBOARD_AUTOMATION] ?: ClipboardAutomationMode.OFF.name
            val clipAuto = try {
                ClipboardAutomationMode.valueOf(clipAutoStr)
            } catch (e: Exception) {
                ClipboardAutomationMode.OFF
            }
            val clipFmtStr = preferences[PreferencesKeys.CLIPBOARD_FORMAT] ?: ClipboardFormat.OPTION_AND_TEXT.name
            val clipFmt = try {
                ClipboardFormat.valueOf(clipFmtStr)
            } catch (e: Exception) {
                ClipboardFormat.OPTION_AND_TEXT
            }
            val retain = preferences[PreferencesKeys.RETAIN_SCREENSHOTS] ?: false
            val onboarded = preferences[PreferencesKeys.HAS_COMPLETED_ONBOARDING] ?: false

            UserSettings(
                outputLanguage = lang,
                solveMode = mode,
                explanationLength = expLength,
                isDarkMode = isDark,
                ocrFastPathEnabled = ocr,
                instantRegionProcess = instant,
                notificationDelivery = notif,
                floatingResultEnabled = floating,
                clipboardAutomation = clipAuto,
                clipboardFormat = clipFmt,
                retainScreenshots = retain,
                hasCompletedOnboarding = onboarded
            )
        }

    suspend fun setOutputLanguage(language: String) {
        context.dataStore.edit { it[PreferencesKeys.OUTPUT_LANGUAGE] = language }
    }

    suspend fun setSolveMode(mode: SolveMode) {
        context.dataStore.edit { it[PreferencesKeys.SOLVE_MODE] = mode.name }
    }

    suspend fun setExplanationLength(length: String) {
        context.dataStore.edit { it[PreferencesKeys.EXPLANATION_LENGTH] = length }
    }

    suspend fun setThemeMode(mode: String) {
        context.dataStore.edit { it[PreferencesKeys.IS_DARK_MODE] = mode }
    }

    suspend fun setOcrFastPath(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.OCR_FAST_PATH] = enabled }
    }

    suspend fun setInstantRegionProcess(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.INSTANT_REGION_PROCESS] = enabled }
    }

    suspend fun setNotificationDelivery(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.NOTIFICATION_DELIVERY] = enabled }
    }

    suspend fun setFloatingResult(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.FLOATING_RESULT] = enabled }
    }

    suspend fun setClipboardAutomation(mode: ClipboardAutomationMode) {
        context.dataStore.edit { it[PreferencesKeys.CLIPBOARD_AUTOMATION] = mode.name }
    }

    suspend fun setClipboardFormat(format: ClipboardFormat) {
        context.dataStore.edit { it[PreferencesKeys.CLIPBOARD_FORMAT] = format.name }
    }

    suspend fun setRetainScreenshots(retain: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.RETAIN_SCREENSHOTS] = retain }
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.HAS_COMPLETED_ONBOARDING] = completed }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
