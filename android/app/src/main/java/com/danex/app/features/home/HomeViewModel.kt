package com.danex.app.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.data.preferences.UserSettings
import com.danex.app.data.repository.SettingsRepository
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.QuestionInput
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.SolveStatus
import com.danex.app.domain.repository.SolveFlowState
import com.danex.app.domain.repository.SolverRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class HomeUiState(
    val inputText: String = "",
    val solveStatus: SolveStatus = SolveStatus.IDLE,
    val errorMessage: String? = null,
    val activeSolveResult: SolveResult? = null,
    val recentSolutions: List<SolveResult> = emptyList(),
    val backendConnected: Boolean = true
)

class HomeViewModel(
    private val solverRepository: SolverRepository,
    private val settingsRepository: SettingsRepository,
    private val outputAutomationHandler: com.danex.app.core.automation.OutputAutomationHandler? = null,
    private val historyRepository: com.danex.app.data.repository.HistoryRepository? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val userSettings: StateFlow<UserSettings> = settingsRepository.settingsFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = UserSettings()
        )

    init {
        checkBackendHealth()
        loadRecentHistory()
    }

    private fun loadRecentHistory() {
        historyRepository?.let { repo ->
            viewModelScope.launch {
                repo.recentHistory.collect { historyList ->
                    _uiState.value = _uiState.value.copy(recentSolutions = historyList)
                }
            }
        }
    }

    fun checkBackendHealth() {
        viewModelScope.launch {
            val isHealthy = solverRepository.checkHealth()
            _uiState.value = _uiState.value.copy(backendConnected = isHealthy)
        }
    }

    fun onInputTextChanged(text: String) {
        _uiState.value = _uiState.value.copy(inputText = text)
    }

    fun onPasteContent(pastedText: String) {
        if (pastedText.isNotBlank()) {
            _uiState.value = _uiState.value.copy(inputText = pastedText)
        }
    }

    fun submitQuestion(source: InputSource = InputSource.MANUAL_INPUT) {
        val currentText = _uiState.value.inputText.trim()
        if (currentText.isBlank()) return

        val input = QuestionInput.Text(
            content = currentText,
            source = source
        )
        executeSolve(input)
    }

    fun executeSolve(input: QuestionInput) {
        viewModelScope.launch {
            val settings = settingsRepository.settingsFlow.first()

            _uiState.value = _uiState.value.copy(
                solveStatus = SolveStatus.READING,
                errorMessage = null
            )

            solverRepository.solve(
                input = input,
                mode = settings.solveMode,
                language = settings.outputLanguage,
                explanationLength = settings.explanationLength
            ).collect { flowState ->
                when (flowState) {
                    is SolveFlowState.Progress -> {
                        _uiState.value = _uiState.value.copy(
                            solveStatus = flowState.status
                        )
                    }
                    is SolveFlowState.Success -> {
                        val currentList = _uiState.value.recentSolutions.toMutableList()
                        currentList.add(0, flowState.result)
                        _uiState.value = _uiState.value.copy(
                            solveStatus = SolveStatus.SUCCESS,
                            activeSolveResult = flowState.result,
                            recentSolutions = currentList,
                            inputText = "" // clear input upon successful solve
                        )
                        // Trigger output automation (Notification, Floating Card, Clipboard)
                        outputAutomationHandler?.deliverResult(flowState.result, settings)
                        // Persist to local history
                        historyRepository?.saveResult(flowState.result)
                    }
                    is SolveFlowState.Failure -> {
                        _uiState.value = _uiState.value.copy(
                            solveStatus = flowState.status,
                            errorMessage = flowState.message
                        )
                    }
                }
            }
        }
    }

    fun dismissResult() {
        _uiState.value = _uiState.value.copy(
            activeSolveResult = null,
            solveStatus = SolveStatus.IDLE
        )
    }

    fun dismissStatus() {
        _uiState.value = _uiState.value.copy(
            solveStatus = SolveStatus.IDLE,
            errorMessage = null
        )
    }

    companion object {
        fun provideFactory(
            solverRepository: SolverRepository,
            settingsRepository: SettingsRepository,
            outputAutomationHandler: com.danex.app.core.automation.OutputAutomationHandler? = null,
            historyRepository: com.danex.app.data.repository.HistoryRepository? = null
        ): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(solverRepository, settingsRepository, outputAutomationHandler, historyRepository) as T
                }
            }
    }
}
