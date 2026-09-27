package com.danex.app.features.regioncapture

/**
 * Singleton holder for passing region capture results from [RegionCaptureService]
 * back to the main activity Compose tree.
 *
 * Uses volatile fields for thread-safe single-consumer access.
 * The service sets the result; the Compose LaunchedEffect consumes it.
 */
object RegionCaptureResultHolder {

    @Volatile
    var pendingText: String? = null

    @Volatile
    var pendingImageBytes: ByteArray? = null

    @Volatile
    var isImageResult: Boolean = false

    /**
     * Atomically consume and clear the pending result.
     * Returns null if no result is pending.
     */
    @Synchronized
    fun consumeResult(): CaptureResult? {
        val text = pendingText
        val image = pendingImageBytes
        val isImage = isImageResult

        if (text == null && image == null) return null

        pendingText = null
        pendingImageBytes = null
        isImageResult = false

        return if (isImage && image != null) {
            CaptureResult.ImageResult(imageBytes = image, ocrText = text)
        } else if (!text.isNullOrBlank()) {
            CaptureResult.TextResult(text = text)
        } else {
            null
        }
    }

    sealed class CaptureResult {
        data class TextResult(val text: String) : CaptureResult()
        data class ImageResult(val imageBytes: ByteArray, val ocrText: String?) : CaptureResult()
    }
}
