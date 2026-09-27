package com.danex.app.ocr

data class OcrRouteDecision(
    val useFastPath: Boolean,
    val extractedText: String,
    val confidence: Float,
    val visualCueDetected: Boolean,
    val reason: String
)

object OcrConfidenceAnalyzer {

    // Keywords indicating visual element present on the page
    private val visualKeywords = listOf(
        "gambar di atas", "gambar di bawah", "gambar berikut", "perhatikan gambar",
        "diagram berikut", "pada diagram", "berdasarkan grafik", "grafik di atas",
        "tabel berikut", "berdasarkan tabel", "bagan di samping", "kurva berikut",
        "figure above", "figure below", "shown in the graph", "refer to the table",
        "diagram shows"
    )

    fun analyze(extractedText: String, rawConfidence: Float = 0.9f): OcrRouteDecision {
        val trimmed = extractedText.trim()
        val lower = trimmed.lowercase()

        // 1. Check for empty or near-empty OCR
        if (trimmed.length < 10) {
            return OcrRouteDecision(
                useFastPath = false,
                extractedText = trimmed,
                confidence = 0.2f,
                visualCueDetected = false,
                reason = "Teks OCR terlalu pendek atau tidak terbaca. Memerlukan Vision AI."
            )
        }

        // 2. Check for visual cues requiring multimodal understanding
        var visualCueFound = false
        var matchedKeyword = ""
        for (keyword in visualKeywords) {
            if (lower.contains(keyword)) {
                visualCueFound = true
                matchedKeyword = keyword
                break
            }
        }

        if (visualCueFound) {
            return OcrRouteDecision(
                useFastPath = false,
                extractedText = trimmed,
                confidence = 0.7f,
                visualCueDetected = true,
                reason = "Terdeteksi rujukan visual ('$matchedKeyword'). Dialihkan ke Vision AI."
            )
        }

        // 3. Check text quality / gibberish ratio
        val letterAndDigitCount = trimmed.count { it.isLetterOrDigit() || it.isWhitespace() }
        val readabilityRatio = letterAndDigitCount.toFloat() / trimmed.length.toFloat()

        if (readabilityRatio < 0.70f || rawConfidence < 0.65f) {
            return OcrRouteDecision(
                useFastPath = false,
                extractedText = trimmed,
                confidence = rawConfidence,
                visualCueDetected = false,
                reason = "Kejelasan teks rendah atau format OCR tidak teratur. Dialihkan ke Vision AI."
            )
        }

        // 4. Clean text fast path
        return OcrRouteDecision(
            useFastPath = true,
            extractedText = trimmed,
            confidence = rawConfidence,
            visualCueDetected = false,
            reason = "Teks bersih dan lengkap. Menggunakan Fast OCR Path on-device."
        )
    }
}
