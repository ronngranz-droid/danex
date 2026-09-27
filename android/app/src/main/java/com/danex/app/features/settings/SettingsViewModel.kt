package com.danex.app.features.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.data.preferences.UserSettings
import com.danex.app.data.repository.SettingsRepository
import com.danex.app.domain.model.SolveMode
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    private val historyRepository: com.danex.app.data.repository.HistoryRepository? = null
) : ViewModel() {

    private val _usageStats = kotlinx.coroutines.flow.MutableStateFlow<com.danex.app.data.remote.dto.UsageStatsDto?>(null)
    val usageStats: StateFlow<com.danex.app.data.remote.dto.UsageStatsDto?> = _usageStats

    val settings: StateFlow<UserSettings> = settingsRepository.settingsFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = UserSettings()
        )

    init {
        loadUsageStats()
    }

    fun loadUsageStats() {
        historyRepository?.let { repo ->
            viewModelScope.launch {
                val stats = repo.getUsageStats()
                _usageStats.value = stats
            }
        }
    }

    fun updateSolveMode(mode: SolveMode) {
        viewModelScope.launch { settingsRepository.setSolveMode(mode) }
    }

    fun updateOutputLanguage(language: String) {
        viewModelScope.launch { settingsRepository.setOutputLanguage(language) }
    }

    fun updateExplanationLength(length: String) {
        viewModelScope.launch { settingsRepository.setExplanationLength(length) }
    }

    fun updateOcrFastPath(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setOcrFastPath(enabled) }
    }

    fun updateInstantRegionProcess(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setInstantRegionProcess(enabled) }
    }

    fun updateNotificationDelivery(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setNotificationDelivery(enabled) }
    }

    fun updateFloatingResult(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setFloatingResult(enabled) }
    }

    fun updateClipboardAutomation(mode: ClipboardAutomationMode) {
        viewModelScope.launch { settingsRepository.setClipboardAutomation(mode) }
    }

    fun updateClipboardFormat(format: ClipboardFormat) {
        viewModelScope.launch { settingsRepository.setClipboardFormat(format) }
    }

    fun updateRetainScreenshots(retain: Boolean) {
        viewModelScope.launch { settingsRepository.setRetainScreenshots(retain) }
    }

    fun clearAllUserData(onDone: () -> Unit) {
        viewModelScope.launch {
            settingsRepository.clearAllData()
            historyRepository?.clearHistory()
            onDone()
        }
    }

    companion object {
        fun provideFactory(
            settingsRepository: SettingsRepository,
            historyRepository: com.danex.app.data.repository.HistoryRepository? = null
        ): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return SettingsViewModel(settingsRepository, historyRepository) as T
                }
            }
    }
}
