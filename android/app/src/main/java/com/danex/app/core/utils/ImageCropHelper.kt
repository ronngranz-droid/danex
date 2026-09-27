package com.danex.app.core.utils

import android.graphics.Bitmap
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

data class NormalizedCropRect(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float
)

object ImageCropHelper {

    fun cropBitmap(original: Bitmap, normalizedRect: NormalizedCropRect): Bitmap {
        val width = original.width
        val height = original.height

        val left = max(0, (normalizedRect.left * width).roundToInt())
        val top = max(0, (normalizedRect.top * height).roundToInt())
        val right = (normalizedRect.right * width).roundToInt().coerceAtMost(width)
        val bottom = (normalizedRect.bottom * height).roundToInt().coerceAtMost(height)

        val cropWidth = max(1, right - left)
        val cropHeight = max(1, bottom - top)

        return Bitmap.createBitmap(original, left, top, cropWidth, cropHeight)
    }

    fun downscaleIfNeeded(bitmap: Bitmap, maxDimension: Int = 1600): Bitmap {
        val width = bitmap.width
        val height = bitmap.height

        if (width <= maxDimension && height <= maxDimension) {
            return bitmap
        }

        val ratio = width.toFloat() / height.toFloat()
        val targetWidth: Int
        val targetHeight: Int

        if (width > height) {
            targetWidth = maxDimension
            targetHeight = (maxDimension / ratio).roundToInt()
        } else {
            targetHeight = maxDimension
            targetWidth = (maxDimension * ratio).roundToInt()
        }

        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }

    fun compressToJpeg(bitmap: Bitmap, quality: Int = 85): ByteArray {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        return outputStream.toByteArray()
    }
}
