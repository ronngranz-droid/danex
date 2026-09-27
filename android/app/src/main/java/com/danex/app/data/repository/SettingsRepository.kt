package com.danex.app.data.repository

import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.data.preferences.SettingsDataStore
import com.danex.app.data.preferences.UserSettings
import com.danex.app.domain.model.SolveMode
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val settingsFlow: Flow<UserSettings>
    suspend fun setOutputLanguage(language: String)
    suspend fun setSolveMode(mode: SolveMode)
    suspend fun setExplanationLength(length: String)
    suspend fun setThemeMode(mode: String)
    suspend fun setOcrFastPath(enabled: Boolean)
    suspend fun setInstantRegionProcess(enabled: Boolean)
    suspend fun setNotificationDelivery(enabled: Boolean)
    suspend fun setFloatingResult(enabled: Boolean)
    suspend fun setClipboardAutomation(mode: ClipboardAutomationMode)
    suspend fun setClipboardFormat(format: ClipboardFormat)
    suspend fun setRetainScreenshots(retain: Boolean)
    suspend fun setOnboardingCompleted(completed: Boolean)
    suspend fun clearAllData()
}

class SettingsRepositoryImpl(
    private val dataStore: SettingsDataStore
) : SettingsRepository {

    override val settingsFlow: Flow<UserSettings> = dataStore.userSettingsFlow

    override suspend fun setOutputLanguage(language: String) = dataStore.setOutputLanguage(language)

    override suspend fun setSolveMode(mode: SolveMode) = dataStore.setSolveMode(mode)

    override suspend fun setExplanationLength(length: String) = dataStore.setExplanationLength(length)

    override suspend fun setThemeMode(mode: String) = dataStore.setThemeMode(mode)

    override suspend fun setOcrFastPath(enabled: Boolean) = dataStore.setOcrFastPath(enabled)

    override suspend fun setInstantRegionProcess(enabled: Boolean) = dataStore.setInstantRegionProcess(enabled)

    override suspend fun setNotificationDelivery(enabled: Boolean) = dataStore.setNotificationDelivery(enabled)

    override suspend fun setFloatingResult(enabled: Boolean) = dataStore.setFloatingResult(enabled)

    override suspend fun setClipboardAutomation(mode: ClipboardAutomationMode) = dataStore.setClipboardAutomation(mode)

    override suspend fun setClipboardFormat(format: ClipboardFormat) = dataStore.setClipboardFormat(format)

    override suspend fun setRetainScreenshots(retain: Boolean) = dataStore.setRetainScreenshots(retain)

    override suspend fun setOnboardingCompleted(completed: Boolean) = dataStore.setOnboardingCompleted(completed)

    override suspend fun clearAllData() = dataStore.clearAll()
}
