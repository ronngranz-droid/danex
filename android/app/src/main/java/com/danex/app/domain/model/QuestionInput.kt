package com.danex.app.domain.model

enum class InputSource(val displayName: String) {
    SELECTED_TEXT("Teks Terpilih"),
    SHARED_TEXT("Teks Dibagikan"),
    CLIPBOARD_PASTE("Papan Klip"),
    MANUAL_INPUT("Ketik Manual"),
    CAMERA_SCAN("Foto Kamera"),
    REGION_CAPTURE("Tangkapan Wilayah")
}

sealed class QuestionInput {
    abstract val source: InputSource

    data class Text(
        val content: String,
        override val source: InputSource = InputSource.MANUAL_INPUT
    ) : QuestionInput()

    data class Image(
        val imageBytes: ByteArray,
        val mimeType: String = "image/jpeg",
        val extractedOcrText: String? = null,
        override val source: InputSource = InputSource.CAMERA_SCAN
    ) : QuestionInput() {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (javaClass != other?.javaClass) return false
            other as Image
            return imageBytes.contentEquals(other.imageBytes) &&
                    mimeType == other.mimeType &&
                    extractedOcrText == other.extractedOcrText &&
                    source == other.source
        }

        override fun hashCode(): Int {
            var result = imageBytes.contentHashCode()
            result = 31 * result + mimeType.hashCode()
            result = 31 * result + (extractedOcrText?.hashCode() ?: 0)
            result = 31 * result + source.hashCode()
            return result
        }
    }
}
