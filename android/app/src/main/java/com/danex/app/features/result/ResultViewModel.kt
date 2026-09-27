package com.danex.app.features.result

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.data.repository.SettingsRepository
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.repository.SolverRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class ResultViewModel(
    private val solverRepository: SolverRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _currentResult = MutableStateFlow<SolveResult?>(null)
    val currentResult: StateFlow<SolveResult?> = _currentResult.asStateFlow()

    private val _isFollowUpLoading = MutableStateFlow(false)
    val isFollowUpLoading: StateFlow<Boolean> = _isFollowUpLoading.asStateFlow()

    fun setResult(result: SolveResult) {
        _currentResult.value = result
        applyClipboardAutomation(result)
    }

    private val _clipboardAutomatedText = MutableStateFlow<String?>(null)
    val clipboardAutomatedText: StateFlow<String?> = _clipboardAutomatedText.asStateFlow()

    private fun applyClipboardAutomation(result: SolveResult) {
        viewModelScope.launch {
            val settings = settingsRepository.settingsFlow.first()
            if (settings.clipboardAutomation == ClipboardAutomationMode.OFF) return@launch

            val textToCopy = when (settings.clipboardAutomation) {
                ClipboardAutomationMode.ANSWER_ONLY -> {
                    if (settings.clipboardFormat == ClipboardFormat.OPTION_LETTER_ONLY && !result.answerOption.isNullOrBlank()) {
                        result.answerOption
                    } else {
                        result.formattedShortNotification
                    }
                }
                ClipboardAutomationMode.ANSWER_WITH_EXPLANATION -> {
                    "${result.formattedShortNotification}\n\n${result.explanation}"
                }
                ClipboardAutomationMode.LATEX -> {
                    result.latex ?: result.formattedShortNotification
                }
                ClipboardAutomationMode.OFF -> null
            }

            _clipboardAutomatedText.value = textToCopy
        }
    }

    companion object {
        fun provideFactory(
            solverRepository: SolverRepository,
            settingsRepository: SettingsRepository
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return ResultViewModel(solverRepository, settingsRepository) as T
            }
        }
    }
}
