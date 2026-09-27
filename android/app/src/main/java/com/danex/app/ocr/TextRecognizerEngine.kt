package com.danex.app.ocr

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

data class OcrResult(
    val fullText: String,
    val textBlocks: List<String>,
    val lineCount: Int,
    val confidence: Float,
    val routeDecision: OcrRouteDecision
)

class TextRecognizerEngine {

    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun recognizeText(bitmap: Bitmap): OcrResult = suspendCancellableCoroutine { continuation ->
        val image = InputImage.fromBitmap(bitmap, 0)

        recognizer.process(image)
            .addOnSuccessListener { visionText ->
                val fullText = visionText.text
                val blocks = visionText.textBlocks.map { it.text }
                var lineCount = 0
                var totalConfidence = 0.0f
                var elementCount = 0

                for (block in visionText.textBlocks) {
                    lineCount += block.lines.size
                    for (line in block.lines) {
                        for (element in line.elements) {
                            element.confidence?.let {
                                totalConfidence += it
                                elementCount++
                            }
                        }
                    }
                }

                val avgConfidence = if (elementCount > 0) totalConfidence / elementCount else 0.90f
                val routeDecision = OcrConfidenceAnalyzer.analyze(fullText, avgConfidence)

                val result = OcrResult(
                    fullText = fullText,
                    textBlocks = blocks,
                    lineCount = lineCount,
                    confidence = avgConfidence,
                    routeDecision = routeDecision
                )
                continuation.resume(result)
            }
            .addOnFailureListener { exception ->
                continuation.resumeWithException(exception)
            }
    }

    fun close() {
        recognizer.close()
    }
}
