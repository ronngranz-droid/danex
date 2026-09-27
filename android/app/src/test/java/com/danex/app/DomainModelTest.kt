package com.danex.app

import com.danex.app.domain.model.OptionItem
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.SolveStatus
import com.danex.app.domain.model.Subject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainModelTest {

    @Test
    fun testSubjectMapping() {
        assertEquals(Subject.MATHEMATICS, Subject.fromString("mathematics"))
        assertEquals(Subject.PHYSICS, Subject.fromString("PHYSICS"))
        assertEquals(Subject.CHEMISTRY, Subject.fromString("chemistry"))
        assertEquals(Subject.PROGRAMMING, Subject.fromString("programming"))
        assertEquals(Subject.GENERAL, Subject.fromString("unknown_subject_xyz"))
    }

    @Test
    fun testQuestionTypeMapping() {
        assertEquals(QuestionType.MULTIPLE_CHOICE, QuestionType.fromString("multiple_choice"))
        assertEquals(QuestionType.CALCULATION, QuestionType.fromString("calculation"))
        assertEquals(QuestionType.PROGRAMMING, QuestionType.fromString("programming"))
        assertEquals(QuestionType.GENERAL_QA, QuestionType.fromString("any_unknown_type"))
    }

    @Test
    fun testSolveModeMapping() {
        assertEquals(SolveMode.QUICK, SolveMode.fromString("QUICK"))
        assertEquals(SolveMode.LEARN, SolveMode.fromString("learn"))
        assertEquals(SolveMode.QUICK, SolveMode.fromString("non_existent_mode"))
    }

    @Test
    fun testSolveStatusTerminalFlags() {
        assertTrue(SolveStatus.IDLE.isTerminal)
        assertFalse(SolveStatus.IDLE.isError)

        assertFalse(SolveStatus.SOLVING.isTerminal)
        assertFalse(SolveStatus.SOLVING.isError)

        assertTrue(SolveStatus.SUCCESS.isTerminal)
        assertFalse(SolveStatus.SUCCESS.isError)

        assertTrue(SolveStatus.INCOMPLETE_QUESTION.isTerminal)
        assertTrue(SolveStatus.INCOMPLETE_QUESTION.isError)

        assertTrue(SolveStatus.CAPTURE_NOT_ALLOWED.isTerminal)
        assertTrue(SolveStatus.CAPTURE_NOT_ALLOWED.isError)
    }

    @Test
    fun testSolveResultNotificationFormatting() {
        val mcqResult = SolveResult(
            id = "test-1",
            questionExtracted = "Which organelle produces ATP?",
            subject = Subject.BIOLOGY,
            questionType = QuestionType.MULTIPLE_CHOICE,
            options = listOf(
                OptionItem("A", "Nucleus"),
                OptionItem("B", "Ribosome"),
                OptionItem("C", "Mitochondria")
            ),
            answerOption = "C",
            answer = "Mitochondria",
            shortAnswer = "C — Mitochondria",
            explanation = "Mitochondria is the powerhouse of the cell."
        )

        assertEquals("C — Mitochondria", mcqResult.formattedShortNotification)
        assertTrue(mcqResult.isMultipleChoice)

        val mathResult = SolveResult(
            id = "test-2",
            questionExtracted = "12 * 8 = ?",
            subject = Subject.MATHEMATICS,
            questionType = QuestionType.CALCULATION,
            answerOption = null,
            answer = "96",
            shortAnswer = "96",
            explanation = "12 multiplied by 8 equals 96.",
            latex = "12 \\times 8 = 96"
        )

        assertEquals("96", mathResult.formattedShortNotification)
        assertFalse(mathResult.isMultipleChoice)
    }
}
