package com.danex.app

import com.danex.app.features.regioncapture.FlagSecureDetector
import com.danex.app.features.regioncapture.RegionCaptureResultHolder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RegionCaptureTest {

    // ── FlagSecureDetector Tests ─────────────────────────────────────

    @Test
    fun testAllBlackDetectedAsBlocked() {
        val result = FlagSecureDetector.evaluateRatio(1.0f)
        assertTrue(result.isBlocked)
        assertTrue(result.reason.contains("CAPTURE_NOT_ALLOWED"))
        assertEquals(1.0f, result.blackPixelRatio, 0.01f)
    }

    @Test
    fun testHighBlackRatioDetectedAsBlocked() {
        val result = FlagSecureDetector.evaluateRatio(0.98f)
        assertTrue(result.isBlocked)
        assertTrue(result.reason.contains("FLAG_SECURE"))
    }

    @Test
    fun testBorderlineBlackRatioDetectedAsBlocked() {
        val result = FlagSecureDetector.evaluateRatio(0.95f)
        assertTrue(result.isBlocked)
    }

    @Test
    fun testNormalImageNotBlocked() {
        val result = FlagSecureDetector.evaluateRatio(0.15f)
        assertFalse(result.isBlocked)
        assertTrue(result.reason.contains("berhasil"))
    }

    @Test
    fun testMostlyBlackButNotFullyBlockedNotBlocked() {
        // 90% black but still under 95% threshold - could be dark UI
        val result = FlagSecureDetector.evaluateRatio(0.90f)
        assertFalse(result.isBlocked)
    }

    @Test
    fun testZeroBlackRatioNotBlocked() {
        val result = FlagSecureDetector.evaluateRatio(0.0f)
        assertFalse(result.isBlocked)
        assertEquals(0.0f, result.blackPixelRatio, 0.01f)
    }

    @Test
    fun testCustomThresholdApplied() {
        // With a lower threshold (0.80), a 0.85 ratio should be blocked
        val result = FlagSecureDetector.evaluateRatio(0.85f, threshold = 0.80f)
        assertTrue(result.isBlocked)

        // With the default threshold (0.95), 0.85 should NOT be blocked
        val result2 = FlagSecureDetector.evaluateRatio(0.85f)
        assertFalse(result2.isBlocked)
    }

    // ── RegionCaptureResultHolder Tests ──────────────────────────────

    @Test
    fun testConsumeResultReturnsNullWhenEmpty() {
        // Ensure clean state
        RegionCaptureResultHolder.pendingText = null
        RegionCaptureResultHolder.pendingImageBytes = null
        RegionCaptureResultHolder.isImageResult = false

        val result = RegionCaptureResultHolder.consumeResult()
        assertNull(result)
    }

    @Test
    fun testConsumeTextResult() {
        RegionCaptureResultHolder.pendingText = "Manakah organel yang menghasilkan ATP?"
        RegionCaptureResultHolder.pendingImageBytes = null
        RegionCaptureResultHolder.isImageResult = false

        val result = RegionCaptureResultHolder.consumeResult()
        assertNotNull(result)
        assertTrue(result is RegionCaptureResultHolder.CaptureResult.TextResult)
        assertEquals(
            "Manakah organel yang menghasilkan ATP?",
            (result as RegionCaptureResultHolder.CaptureResult.TextResult).text
        )

        // After consume, should be null
        val secondResult = RegionCaptureResultHolder.consumeResult()
        assertNull(secondResult)
    }

    @Test
    fun testConsumeImageResult() {
        val testBytes = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xE0.toByte())
        RegionCaptureResultHolder.pendingText = "Some OCR text"
        RegionCaptureResultHolder.pendingImageBytes = testBytes
        RegionCaptureResultHolder.isImageResult = true

        val result = RegionCaptureResultHolder.consumeResult()
        assertNotNull(result)
        assertTrue(result is RegionCaptureResultHolder.CaptureResult.ImageResult)
        val imageResult = result as RegionCaptureResultHolder.CaptureResult.ImageResult
        assertEquals("Some OCR text", imageResult.ocrText)
        assertEquals(4, imageResult.imageBytes.size)

        // After consume, should be null
        val secondResult = RegionCaptureResultHolder.consumeResult()
        assertNull(secondResult)
    }

    @Test
    fun testConsumeImageResultWithNullOcrText() {
        val testBytes = byteArrayOf(0x89.toByte(), 0x50.toByte())
        RegionCaptureResultHolder.pendingText = null
        RegionCaptureResultHolder.pendingImageBytes = testBytes
        RegionCaptureResultHolder.isImageResult = true

        val result = RegionCaptureResultHolder.consumeResult()
        assertNotNull(result)
        assertTrue(result is RegionCaptureResultHolder.CaptureResult.ImageResult)
        assertNull((result as RegionCaptureResultHolder.CaptureResult.ImageResult).ocrText)
    }
}
