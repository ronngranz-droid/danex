package com.danex.app.features.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.data.repository.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OnboardingPageData(
    val title: String,
    val subtitle: String,
    val detail: String,
    val stepIndex: Int
)

class OnboardingViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _currentPage = MutableStateFlow(0)
    val currentPage: StateFlow<Int> = _currentPage.asStateFlow()

    val pages = listOf(
        OnboardingPageData(
            title = "Pilih & Tanyakan",
            subtitle = "Select. Ask. Answer.",
            detail = "Sorot teks pertanyaan di aplikasi belajar apa pun (PDF, browser, catatan) dan pilih opsi 'DaneX' untuk mendapatkan jawaban tanpa beralih aplikasi.",
            stepIndex = 0
        ),
        OnboardingPageData(
            title = "Tangkapan Wilayah Cepat",
            subtitle = "Scan. Select Region. Answer.",
            detail = "Gunakan tombol pemicu mengambang, seret kotak seleksi di atas soal, dan lepaskan. Pemrosesan OCR lokal akan membaca soal seketika.",
            stepIndex = 1
        ),
        OnboardingPageData(
            title = "Bukan Sekadar Bot AI",
            subtitle = "Structured Academic Solutions.",
            detail = "Dukungan penuh pilihan ganda A–E, rumus matematika LaTeX terformat rapi, persamaan reaksi kimia, satuan fisika, dan blok kode pemrograman.",
            stepIndex = 2
        )
    )

    fun nextPage() {
        if (_currentPage.value < pages.size - 1) {
            _currentPage.value += 1
        }
    }

    fun prevPage() {
        if (_currentPage.value > 0) {
            _currentPage.value -= 1
        }
    }

    fun completeOnboarding(onFinish: () -> Unit) {
        viewModelScope.launch {
            settingsRepository.setOnboardingCompleted(true)
            onFinish()
        }
    }

    companion object {
        fun provideFactory(settingsRepository: SettingsRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return OnboardingViewModel(settingsRepository) as T
                }
            }
    }
}
