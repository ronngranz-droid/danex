package com.danex.app.features.regioncapture

import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

/**
 * Manages VirtualDisplay + ImageReader for capturing screen frames
 * from an active [MediaProjection] session.
 */
class ScreenCaptureManager(
    private val mediaProjection: MediaProjection,
    private val screenWidth: Int,
    private val screenHeight: Int,
    private val screenDensity: Int
) {
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private val handler = Handler(Looper.getMainLooper())

    fun initialize() {
        imageReader = ImageReader.newInstance(
            screenWidth,
            screenHeight,
            PixelFormat.RGBA_8888,
            2
        )

        virtualDisplay = mediaProjection.createVirtualDisplay(
            "DaneXRegionCapture",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader!!.surface,
            null,
            handler
        )
    }

    /**
     * Captures a single frame from the virtual display.
     * Retries up to [maxAttempts] times with a brief delay between attempts
     * to accommodate VirtualDisplay rendering latency.
     */
    suspend fun captureFrame(maxAttempts: Int = 10): Bitmap = withContext(Dispatchers.Default) {
        var attempts = 0
        var image: Image? = null

        while (image == null && attempts < maxAttempts) {
            image = try {
                imageReader?.acquireLatestImage()
            } catch (_: Exception) {
                null
            }
            if (image == null) {
                delay(50)
                attempts++
            }
        }

        if (image == null) {
            throw IllegalStateException("Gagal menangkap layar setelah $maxAttempts percobaan")
        }

        try {
            imageToBitmap(image)
        } finally {
            image.close()
        }
    }

    private fun imageToBitmap(image: Image): Bitmap {
        val planes = image.planes
        val buffer = planes[0].buffer
        val pixelStride = planes[0].pixelStride
        val rowStride = planes[0].rowStride
        val rowPadding = rowStride - pixelStride * screenWidth

        val bitmapWidth = screenWidth + rowPadding / pixelStride
        val bitmap = Bitmap.createBitmap(
            bitmapWidth,
            screenHeight,
            Bitmap.Config.ARGB_8888
        )
        bitmap.copyPixelsFromBuffer(buffer)

        // Crop out row padding if present
        return if (rowPadding > 0) {
            Bitmap.createBitmap(bitmap, 0, 0, screenWidth, screenHeight)
        } else {
            bitmap
        }
    }

    fun release() {
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
    }
}
