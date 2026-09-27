package com.danex.app.features.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.data.repository.HistoryRepository
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch

data class HistoryUiState(
    val items: List<SolveResult> = emptyList(),
    val searchQuery: String = "",
    val selectedSubject: Subject? = null,
    val isLoading: Boolean = false,
    val activeDetailResult: SolveResult? = null
)

@OptIn(kotlinx.coroutines.FlowPreview::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class HistoryViewModel(
    private val historyRepository: HistoryRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedSubject = MutableStateFlow<Subject?>(null)
    private val _activeDetailResult = MutableStateFlow<SolveResult?>(null)

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        loadHistory()
    }

    private fun loadHistory() {
        viewModelScope.launch {
            combine(
                _searchQuery.debounce(150),
                _selectedSubject
            ) { query, subject ->
                Pair(query, subject)
            }.flatMapLatest { (query, subject) ->
                when {
                    query.isNotBlank() -> historyRepository.searchHistory(query)
                    subject != null -> historyRepository.getHistoryBySubject(subject)
                    else -> historyRepository.allHistory
                }
            }.collect { list ->
                _uiState.value = _uiState.value.copy(
                    items = list,
                    searchQuery = _searchQuery.value,
                    selectedSubject = _selectedSubject.value,
                    activeDetailResult = _activeDetailResult.value,
                    isLoading = false
                )
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun onSubjectSelected(subject: Subject?) {
        _selectedSubject.value = subject
        _uiState.value = _uiState.value.copy(selectedSubject = subject)
    }

    fun selectResult(result: SolveResult) {
        _activeDetailResult.value = result
        _uiState.value = _uiState.value.copy(activeDetailResult = result)
    }

    fun dismissDetail() {
        _activeDetailResult.value = null
        _uiState.value = _uiState.value.copy(activeDetailResult = null)
    }

    fun deleteItem(id: String) {
        viewModelScope.launch {
            historyRepository.deleteResult(id)
            if (_activeDetailResult.value?.id == id) {
                dismissDetail()
            }
        }
    }

    fun clearAllHistory() {
        viewModelScope.launch {
            historyRepository.clearHistory()
            dismissDetail()
        }
    }

    companion object {
        fun provideFactory(historyRepository: HistoryRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HistoryViewModel(historyRepository) as T
                }
            }
    }
}
