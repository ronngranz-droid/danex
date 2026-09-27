package com.danex.app

import com.danex.app.data.remote.api.DaneXApiService
import com.danex.app.data.remote.dto.CodeSnippetDto
import com.danex.app.data.remote.dto.OptionItemDto
import com.danex.app.data.remote.dto.SolveRequestDto
import com.danex.app.data.remote.dto.SolveResponseDto
import com.danex.app.data.repository.SolverRepositoryImpl
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.QuestionInput
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveStatus
import com.danex.app.domain.model.Subject
import com.danex.app.domain.repository.SolveFlowState
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response
import java.io.IOException

class SolverRepositoryTest {

    private class FakeDaneXApiService(
        var responseToReturn: Response<SolveResponseDto>? = null,
        var exceptionToThrow: Exception? = null
    ) : DaneXApiService {
        override suspend fun solveText(request: SolveRequestDto): Response<SolveResponseDto> {
            if (exceptionToThrow != null) throw exceptionToThrow!!
            return responseToReturn ?: Response.success(
                SolveResponseDto(
                    status = "SUCCESS",
                    subject = "biology",
                    questionType = "multiple_choice",
                    language = "id",
                    questionExtracted = request.prompt,
                    options = listOf(OptionItemDto("C", "Mitokondria")),
                    answerOption = "C",
                    answer = "Mitokondria",
                    shortAnswer = "C — Mitokondria",
                    explanation = "Tempat utama sintesis ATP",
                    steps = listOf("Langkah 1"),
                    latex = null,
                    codeSnippet = null,
                    confidence = 0.98f,
                    warnings = emptyList()
                )
            )
        }

        override suspend fun solveVision(request: com.danex.app.data.remote.dto.SolveVisionRequestDto): Response<SolveResponseDto> {
            if (exceptionToThrow != null) throw exceptionToThrow!!
            return responseToReturn ?: Response.success(
                SolveResponseDto(
                    status = "SUCCESS",
                    subject = "mathematics",
                    questionType = "calculation",
                    language = "id",
                    questionExtracted = request.prompt ?: "Soal geometri dari gambar",
                    options = listOf(OptionItemDto("A", "45°"), OptionItemDto("B", "90°")),
                    answerOption = "B",
                    answer = "90°",
                    shortAnswer = "B — 90°",
                    explanation = "Sudut siku-siku pada segitiga siku-siku memiliki besar 90 derajat.",
                    steps = listOf("Identifikasi sudut siku-siku dari gambar diagram.", "Besar sudut adalah 90°."),
                    latex = "\\angle ABC = 90^\\circ",
                    codeSnippet = null,
                    confidence = 0.97f,
                    warnings = emptyList()
                )
            )
        }

        override suspend fun solveFollowUp(request: com.danex.app.data.remote.dto.FollowUpRequestDto): Response<SolveResponseDto> {
            throw NotImplementedError()
        }

        override suspend fun checkHealth(): Response<Map<String, Any>> {
            return Response.success(mapOf("status" to "healthy"))
        }

        override suspend fun getUsage(): Response<com.danex.app.data.remote.dto.UsageStatsDto> {
            return Response.success(com.danex.app.data.remote.dto.UsageStatsDto())
        }
    }

    @Test
    fun testDtoToDomainMappingMultipleSubjects() {
        // 1. Biology MCQ
        val biologyDto = SolveResponseDto(
            status = "SUCCESS",
            subject = "biology",
            questionType = "multiple_choice",
            language = "id",
            questionExtracted = "Organel sel penghasil ATP?",
            options = listOf(
                OptionItemDto("A", "Nukleus"),
                OptionItemDto("B", "Ribosom"),
                OptionItemDto("C", "Mitokondria")
            ),
            answerOption = "C",
            answer = "Mitokondria",
            shortAnswer = "C — Mitokondria",
            explanation = "Respirasi seluler menghasilkan ATP.",
            steps = listOf("Identifikasi organel respirasi sel."),
            confidence = 0.98f
        )
        val biologyDomain = biologyDto.toDomain(SolveMode.QUICK, InputSource.MANUAL_INPUT)
        assertEquals(Subject.BIOLOGY, biologyDomain.subject)
        assertEquals(QuestionType.MULTIPLE_CHOICE, biologyDomain.questionType)
        assertEquals("C", biologyDomain.answerOption)
        assertEquals(3, biologyDomain.options.size)

        // 2. Mathematics with LaTeX
        val mathDto = SolveResponseDto(
            status = "SUCCESS",
            subject = "mathematics",
            questionType = "calculation",
            language = "id",
            questionExtracted = "x^2 - 5x + 6 = 0",
            answer = "x = 2 atau x = 3",
            shortAnswer = "x = 2 atau x = 3",
            explanation = "Faktorkan persamaan kuadrat.",
            steps = listOf("Faktorkan: (x-2)(x-3)=0", "Akar: x=2 atau x=3"),
            latex = "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
            confidence = 0.99f
        )
        val mathDomain = mathDto.toDomain(SolveMode.LEARN, InputSource.SELECTED_TEXT)
        assertEquals(Subject.MATHEMATICS, mathDomain.subject)
        assertNotNull(mathDomain.latex)
        assertTrue(mathDomain.latex!!.contains("\\frac"))

        // 3. Programming with CodeSnippet
        val codeDto = SolveResponseDto(
            status = "SUCCESS",
            subject = "programming",
            questionType = "programming",
            language = "id",
            questionExtracted = "Fungsi total array",
            answer = "Gunakan sum()",
            shortAnswer = "sum(arr)",
            explanation = "Fungsi bawaan Python.",
            codeSnippet = CodeSnippetDto("python", "def total(arr):\n    return sum(arr)"),
            confidence = 0.99f
        )
        val codeDomain = codeDto.toDomain(SolveMode.QUICK, InputSource.CLIPBOARD_PASTE)
        assertEquals(Subject.PROGRAMMING, codeDomain.subject)
        assertNotNull(codeDomain.codeSnippet)
        assertEquals("python", codeDomain.codeSnippet?.language)
    }

    @Test
    fun testSolverRepositoryProgressiveFlow() = runBlocking {
        val fakeApi = FakeDaneXApiService()
        val repository = SolverRepositoryImpl(fakeApi)

        val input = QuestionInput.Text(
            content = "Organel sel penghasil ATP?",
            source = InputSource.MANUAL_INPUT
        )

        val states = repository.solveText(input, SolveMode.QUICK).toList()

        // Verify progressive loading sequence
        assertEquals(SolveFlowState.Progress(SolveStatus.READING), states[0])
        assertEquals(SolveFlowState.Progress(SolveStatus.UNDERSTANDING), states[1])
        assertEquals(SolveFlowState.Progress(SolveStatus.SOLVING), states[2])
        assertEquals(SolveFlowState.Progress(SolveStatus.VERIFYING), states[3])
        assertTrue(states[4] is SolveFlowState.Success)

        val successState = states[4] as SolveFlowState.Success
        assertEquals(Subject.BIOLOGY, successState.result.subject)
        assertEquals("C — Mitokondria", successState.result.formattedShortNotification)
    }

    @Test
    fun testSolverRepositoryIncompleteQuestionHandling() = runBlocking {
        val incompleteDto = SolveResponseDto(
            status = "INCOMPLETE_QUESTION",
            subject = "general",
            questionType = "multiple_choice",
            questionExtracted = "Soal terpotong",
            answer = "Area soal belum lengkap. Sertakan pertanyaan dan semua pilihan jawaban.",
            shortAnswer = "Soal Belum Lengkap",
            explanation = "Area seleksi tidak memuat pilihan jawaban.",
            confidence = 0.1f
        )

        val fakeApi = FakeDaneXApiService(responseToReturn = Response.success(incompleteDto))
        val repository = SolverRepositoryImpl(fakeApi)

        val input = QuestionInput.Text("Soal terpotong")
        val states = repository.solveText(input, SolveMode.QUICK).toList()

        val lastState = states.last()
        assertTrue(lastState is SolveFlowState.Failure)
        val failure = lastState as SolveFlowState.Failure
        assertEquals(SolveStatus.INCOMPLETE_QUESTION, failure.status)
        assertTrue(failure.message.contains("Area soal belum lengkap"))
    }

    @Test
    fun testSolverRepositoryNetworkErrorHandling() = runBlocking {
        val fakeApi = FakeDaneXApiService(exceptionToThrow = IOException("Connection refused"))
        val repository = SolverRepositoryImpl(fakeApi)

        val input = QuestionInput.Text("Pertanyaan apa saja")
        val states = repository.solveText(input, SolveMode.QUICK).toList()

        val lastState = states.last()
        assertTrue(lastState is SolveFlowState.Failure)
        val failure = lastState as SolveFlowState.Failure
        assertEquals(SolveStatus.NO_INTERNET, failure.status)
    }

    @Test
    fun testSolverRepositoryRateLimitedHandling() = runBlocking {
        val errorBody = "{\"message\":\"Rate limited\"}".toResponseBody("application/json".toMediaTypeOrNull())
        val fakeApi = FakeDaneXApiService(responseToReturn = Response.error(429, errorBody))
        val repository = SolverRepositoryImpl(fakeApi)

        val input = QuestionInput.Text("Pertanyaan apa saja")
        val states = repository.solveText(input, SolveMode.QUICK).toList()

        val lastState = states.last()
        assertTrue(lastState is SolveFlowState.Failure)
        val failure = lastState as SolveFlowState.Failure
        assertEquals(SolveStatus.RATE_LIMITED, failure.status)
    }

    @Test
    fun testSolveImageProgressiveFlow() = runBlocking {
        val fakeApi = FakeDaneXApiService()
        val repository = SolverRepositoryImpl(fakeApi)

        val imageInput = QuestionInput.Image(
            imageBytes = byteArrayOf(0x12, 0x34, 0x56, 0x78),
            mimeType = "image/jpeg",
            extractedOcrText = "Perhatikan diagram segitiga siku-siku ABC di samping",
            source = InputSource.CAMERA_SCAN
        )

        val states = repository.solveImage(imageInput, SolveMode.LEARN).toList()

        // Verify progressive loading states
        assertEquals(SolveFlowState.Progress(SolveStatus.READING), states[0])
        assertEquals(SolveFlowState.Progress(SolveStatus.UNDERSTANDING), states[1])
        assertEquals(SolveFlowState.Progress(SolveStatus.SOLVING), states[2])
        assertEquals(SolveFlowState.Progress(SolveStatus.VERIFYING), states[3])
        assertTrue(states[4] is SolveFlowState.Success)

        val successState = states[4] as SolveFlowState.Success
        assertEquals(Subject.MATHEMATICS, successState.result.subject)
        assertEquals("B — 90°", successState.result.formattedShortNotification)
        assertEquals("90°", successState.result.answer)
        assertNotNull(successState.result.latex)
    }

    @Test
    fun testSolveImageRateLimitedHandling() = runBlocking {
        val errorBody = "{\"message\":\"Vision rate limited\"}".toResponseBody("application/json".toMediaTypeOrNull())
        val fakeApi = FakeDaneXApiService(responseToReturn = Response.error(429, errorBody))
        val repository = SolverRepositoryImpl(fakeApi)

        val imageInput = QuestionInput.Image(
            imageBytes = byteArrayOf(0x01, 0x02),
            source = InputSource.REGION_CAPTURE
        )
        val states = repository.solveImage(imageInput, SolveMode.QUICK).toList()

        val lastState = states.last()
        assertTrue(lastState is SolveFlowState.Failure)
        val failure = lastState as SolveFlowState.Failure
        assertEquals(SolveStatus.RATE_LIMITED, failure.status)
        assertTrue(failure.message.contains("vision"))
    }

    @Test
    fun testUnifiedSolveRouting() = runBlocking {
        val fakeApi = FakeDaneXApiService()
        val repository = SolverRepositoryImpl(fakeApi)

        // 1. Unified solve with Text input
        val textInput = QuestionInput.Text("Soal teks")
        val textStates = repository.solve(textInput, SolveMode.QUICK).toList()
        assertTrue(textStates.last() is SolveFlowState.Success)

        // 2. Unified solve with Image input
        val imageInput = QuestionInput.Image(
            imageBytes = byteArrayOf(0xAA.toByte(), 0xBB.toByte()),
            source = InputSource.REGION_CAPTURE
        )
        val imageStates = repository.solve(imageInput, SolveMode.QUICK).toList()
        assertTrue(imageStates.last() is SolveFlowState.Success)
    }
}
