package com.danex.app

import com.danex.app.core.utils.ImageCropHelper
import com.danex.app.core.utils.NormalizedCropRect
import com.danex.app.ocr.OcrConfidenceAnalyzer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OcrConfidenceAnalyzerTest {

    @Test
    fun testCleanTextUsesFastPath() {
        val cleanText = """
            Manakah organel sel yang memproduksi ATP melalui respirasi sel?
            A. Nukleus
            B. Ribosom
            C. Mitokondria
            D. Lisosom
        """.trimIndent()

        val decision = OcrConfidenceAnalyzer.analyze(cleanText, rawConfidence = 0.95f)
        assertTrue(decision.useFastPath)
        assertFalse(decision.visualCueDetected)
        assertEquals(0.95f, decision.confidence, 0.01f)
    }

    @Test
    fun testVisualCueTriggersVisionFallback() {
        val textWithDiagram = "Perhatikan gambar berikut! Organel bernomor 3 berfungsi sebagai:"
        val decision = OcrConfidenceAnalyzer.analyze(textWithDiagram, rawConfidence = 0.95f)

        assertFalse(decision.useFastPath)
        assertTrue(decision.visualCueDetected)
        assertTrue(decision.reason.contains("visual"))

        val textWithGraph = "Berdasarkan grafik di atas, tentukan titik ekuilibrium pasar."
        val graphDecision = OcrConfidenceAnalyzer.analyze(textWithGraph, rawConfidence = 0.90f)
        assertFalse(graphDecision.useFastPath)
        assertTrue(graphDecision.visualCueDetected)

        val textWithTable = "Berdasarkan tabel berikut, hitunglah nilai mean."
        val tableDecision = OcrConfidenceAnalyzer.analyze(textWithTable, rawConfidence = 0.92f)
        assertFalse(tableDecision.useFastPath)
        assertTrue(tableDecision.visualCueDetected)
    }

    @Test
    fun testShortOrGibberishTextRejectsFastPath() {
        val tooShort = "Abc 123"
        val decision = OcrConfidenceAnalyzer.analyze(tooShort, rawConfidence = 0.9f)
        assertFalse(decision.useFastPath)

        val lowConfidenceText = "M4n4k4h 0rg4n3l s3l y4ng..."
        val lowConfDecision = OcrConfidenceAnalyzer.analyze(lowConfidenceText, rawConfidence = 0.50f)
        assertFalse(lowConfDecision.useFastPath)
    }

    @Test
    fun testImageCropHelperCoordinateCalculation() {
        // Test normalized coordinate bounds logic
        val normalizedRect = NormalizedCropRect(0.1f, 0.2f, 0.9f, 0.8f)
        val imageWidth = 1000
        val imageHeight = 1000

        val left = (normalizedRect.left * imageWidth).toInt()
        val top = (normalizedRect.top * imageHeight).toInt()
        val right = (normalizedRect.right * imageWidth).toInt()
        val bottom = (normalizedRect.bottom * imageHeight).toInt()

        assertEquals(100, left)
        assertEquals(200, top)
        assertEquals(900, right)
        assertEquals(800, bottom)
        assertEquals(800, right - left) // cropWidth
        assertEquals(600, bottom - top) // cropHeight
    }
}
