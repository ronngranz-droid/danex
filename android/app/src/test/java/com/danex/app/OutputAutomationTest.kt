package com.danex.app

import com.danex.app.core.automation.ClipboardAutomationHelper
import com.danex.app.core.automation.OutputAutomationHandler
import com.danex.app.data.preferences.ClipboardAutomationMode
import com.danex.app.data.preferences.ClipboardFormat
import com.danex.app.data.preferences.UserSettings
import com.danex.app.domain.model.CodeSnippet
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.OptionItem
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OutputAutomationTest {

    private val sampleMcqResult = SolveResult(
        id = "test-1",
        questionExtracted = "Organel sel penghasil ATP?",
        subject = Subject.BIOLOGY,
        questionType = QuestionType.MULTIPLE_CHOICE,
        language = "id",
        options = listOf(
            OptionItem("A", "Nukleus"),
            OptionItem("B", "Ribosom"),
            OptionItem("C", "Mitokondria")
        ),
        answerOption = "C",
        answer = "Mitokondria",
        shortAnswer = "C — Mitokondria",
        explanation = "Mitokondria merupakan organel respirasi sel penghasil energi ATP.",
        steps = listOf("Identifikasi organel respirasi.", "Pilih opsi C."),
        latex = null,
        codeSnippet = null,
        confidence = 0.98f,
        solveMode = SolveMode.LEARN,
        inputSource = InputSource.CAMERA_SCAN,
        timestamp = System.currentTimeMillis(),
        warnings = emptyList()
    )

    private val sampleMathResult = SolveResult(
        id = "test-2",
        questionExtracted = "x^2 - 5x + 6 = 0",
        subject = Subject.MATHEMATICS,
        questionType = QuestionType.CALCULATION,
        language = "id",
        options = emptyList(),
        answerOption = null,
        answer = "x = 2 atau x = 3",
        shortAnswer = "x = 2 atau x = 3",
        explanation = "Faktorkan persamaan.",
        steps = listOf("Faktorkan: (x-2)(x-3)=0"),
        latex = "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
        codeSnippet = null,
        confidence = 0.99f,
        solveMode = SolveMode.QUICK,
        inputSource = InputSource.MANUAL_INPUT,
        timestamp = System.currentTimeMillis(),
        warnings = emptyList()
    )

    @Test
    fun testClipboardAutomationOffReturnsNull() {
        val formatted = ClipboardAutomationHelper.formatClipboardText(
            result = sampleMcqResult,
            automationMode = ClipboardAutomationMode.OFF,
            format = ClipboardFormat.OPTION_AND_TEXT
        )
        assertNull(formatted)
    }

    @Test
    fun testClipboardAutomationAnswerOnlyLetterFormat() {
        val formatted = ClipboardAutomationHelper.formatClipboardText(
            result = sampleMcqResult,
            automationMode = ClipboardAutomationMode.ANSWER_ONLY,
            format = ClipboardFormat.OPTION_LETTER_ONLY
        )
        assertEquals("C", formatted)
    }

    @Test
    fun testClipboardAutomationAnswerOnlyFullOptionFormat() {
        val formatted = ClipboardAutomationHelper.formatClipboardText(
            result = sampleMcqResult,
            automationMode = ClipboardAutomationMode.ANSWER_ONLY,
            format = ClipboardFormat.OPTION_AND_TEXT
        )
        assertEquals("C — Mitokondria", formatted)
    }

    @Test
    fun testClipboardAutomationWithExplanationAndSteps() {
        val formatted = ClipboardAutomationHelper.formatClipboardText(
            result = sampleMcqResult,
            automationMode = ClipboardAutomationMode.ANSWER_WITH_EXPLANATION,
            format = ClipboardFormat.OPTION_AND_TEXT
        )
        assertNotNull(formatted)
        assertTrue(formatted!!.startsWith("C — Mitokondria"))
        assertTrue(formatted.contains("Penjelasan:\nMitokondria merupakan organel"))
        assertTrue(formatted.contains("Langkah-langkah:\n- Identifikasi organel"))
    }

    @Test
    fun testClipboardAutomationLatexFormat() {
        val formatted = ClipboardAutomationHelper.formatClipboardText(
            result = sampleMathResult,
            automationMode = ClipboardAutomationMode.LATEX,
            format = ClipboardFormat.OPTION_AND_TEXT
        )
        assertEquals("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", formatted)
    }

    @Test
    fun testOutputAutomationHandlerDeliveryTracking() {
        var delivered = false
        var deliveredResult: SolveResult? = null

        val fakeHandler = object : OutputAutomationHandler {
            override fun deliverResult(result: SolveResult, settings: UserSettings) {
                delivered = true
                deliveredResult = result
            }
        }

        val settings = UserSettings(
            notificationDelivery = true,
            floatingResultEnabled = true,
            clipboardAutomation = ClipboardAutomationMode.ANSWER_ONLY
        )

        fakeHandler.deliverResult(sampleMcqResult, settings)

        assertTrue(delivered)
        assertEquals("test-1", deliveredResult?.id)
        assertEquals("C — Mitokondria", deliveredResult?.formattedShortNotification)
    }
}
