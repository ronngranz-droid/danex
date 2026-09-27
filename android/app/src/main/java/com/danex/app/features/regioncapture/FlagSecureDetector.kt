package com.danex.app.features.regioncapture

import android.graphics.Bitmap
import android.graphics.Color

/**
 * Detects whether a screen capture was blocked by FLAG_SECURE.
 * When FLAG_SECURE is active, MediaProjection returns an all-black frame.
 * DaneX does NOT bypass this — it detects and shows a graceful error.
 */
object FlagSecureDetector {

    data class DetectionResult(
        val isBlocked: Boolean,
        val blackPixelRatio: Float,
        val reason: String
    )

    /**
     * Samples pixels across the bitmap to determine if the capture was blocked.
     * Uses a grid sampling strategy for efficiency (avoids checking every pixel).
     */
    fun detect(bitmap: Bitmap): DetectionResult {
        val width = bitmap.width
        val height = bitmap.height

        if (width == 0 || height == 0) {
            return DetectionResult(
                isBlocked = true,
                blackPixelRatio = 1.0f,
                reason = "Bitmap kosong (dimensi 0)."
            )
        }

        val gridSize = 10
        val stepX = (width / (gridSize + 1)).coerceAtLeast(1)
        val stepY = (height / (gridSize + 1)).coerceAtLeast(1)

        var blackCount = 0
        var totalSampled = 0

        for (i in 1..gridSize) {
            for (j in 1..gridSize) {
                val x = (i * stepX).coerceAtMost(width - 1)
                val y = (j * stepY).coerceAtMost(height - 1)
                val pixel = bitmap.getPixel(x, y)

                val r = Color.red(pixel)
                val g = Color.green(pixel)
                val b = Color.blue(pixel)

                if (r < 5 && g < 5 && b < 5) {
                    blackCount++
                }
                totalSampled++
            }
        }

        val blackRatio = if (totalSampled > 0) blackCount.toFloat() / totalSampled else 1.0f

        return evaluateRatio(blackRatio)
    }

    /**
     * Pure-Kotlin evaluation for unit testing without Android Bitmap dependency.
     */
    fun evaluateRatio(blackPixelRatio: Float, threshold: Float = 0.95f): DetectionResult {
        return if (blackPixelRatio >= threshold) {
            DetectionResult(
                isBlocked = true,
                blackPixelRatio = blackPixelRatio,
                reason = "CAPTURE_NOT_ALLOWED: Aplikasi target dilindungi FLAG_SECURE. DaneX tidak dapat menangkap layar ini."
            )
        } else {
            DetectionResult(
                isBlocked = false,
                blackPixelRatio = blackPixelRatio,
                reason = "Tangkapan layar berhasil."
            )
        }
    }
}
