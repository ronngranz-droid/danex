package com.danex.app.features.camera

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.danex.app.core.utils.ImageCropHelper
import com.danex.app.core.utils.NormalizedCropRect
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.QuestionInput
import com.danex.app.ocr.OcrResult
import com.danex.app.ocr.TextRecognizerEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CameraUiState(
    val isProcessing: Boolean = false,
    val processingMessage: String = "",
    val errorMessage: String? = null,
    val isFlashOn: Boolean = false
)

class CameraViewModel(
    private val ocrEngine: TextRecognizerEngine = TextRecognizerEngine()
) : ViewModel() {

    private val _uiState = MutableStateFlow(CameraUiState())
    val uiState: StateFlow<CameraUiState> = _uiState.asStateFlow()

    fun toggleFlash() {
        _uiState.value = _uiState.value.copy(isFlashOn = !_uiState.value.isFlashOn)
    }

    fun processCapturedImage(
        bitmap: Bitmap,
        cropRectNormalized: NormalizedCropRect,
        onSolveReady: (QuestionInput) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isProcessing = true,
                processingMessage = "Memotong area soal..."
            )

            try {
                // 1. Crop bitmap to viewfinder guide
                val croppedBitmap = ImageCropHelper.cropBitmap(bitmap, cropRectNormalized)
                val optimizedBitmap = ImageCropHelper.downscaleIfNeeded(croppedBitmap, 1600)

                _uiState.value = _uiState.value.copy(
                    processingMessage = "Membaca teks on-device (ML Kit)..."
                )

                // 2. Perform on-device OCR
                val ocrResult = ocrEngine.recognizeText(optimizedBitmap)

                // 3. Routing decision: Fast OCR path vs Vision
                if (ocrResult.routeDecision.useFastPath && ocrResult.fullText.isNotBlank()) {
                    // FAST PATH: Clean text -> Send directly to text solver
                    val input = QuestionInput.Text(
                        content = ocrResult.fullText,
                        source = InputSource.CAMERA_SCAN
                    )
                    _uiState.value = _uiState.value.copy(isProcessing = false)
                    onSolveReady(input)
                } else {
                    // VISION PATH: Diagram, table, or low OCR confidence -> Multimodal fallback
                    _uiState.value = _uiState.value.copy(
                        processingMessage = "Menyiapkan data multimodal..."
                    )
                    val jpegBytes = ImageCropHelper.compressToJpeg(optimizedBitmap, 85)
                    val input = QuestionInput.Image(
                        imageBytes = jpegBytes,
                        mimeType = "image/jpeg",
                        extractedOcrText = ocrResult.fullText.ifBlank { null },
                        source = InputSource.CAMERA_SCAN
                    )
                    _uiState.value = _uiState.value.copy(isProcessing = false)
                    onSolveReady(input)
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "Gagal memproses gambar: ${e.localizedMessage}"
                )
            }
        }
    }

    fun dismissError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    override fun onCleared() {
        super.onCleared()
        ocrEngine.close()
    }

    companion object {
        fun provideFactory(): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return CameraViewModel() as T
            }
        }
    }
}
