package com.danex.app.data.repository

import com.danex.app.data.remote.api.DaneXApiService
import com.danex.app.data.remote.dto.SolveRequestDto
import com.danex.app.data.remote.dto.SolveVisionRequestDto
import com.danex.app.domain.model.QuestionInput
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveStatus
import com.danex.app.domain.repository.SolveFlowState
import com.danex.app.domain.repository.SolverRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException
import java.util.Base64

class SolverRepositoryImpl(
    private val apiService: DaneXApiService
) : SolverRepository {

    override fun solve(
        input: QuestionInput,
        mode: SolveMode,
        language: String,
        explanationLength: String
    ): Flow<SolveFlowState> {
        return when (input) {
            is QuestionInput.Text -> solveText(input, mode, language, explanationLength)
            is QuestionInput.Image -> solveImage(input, mode, language, explanationLength)
        }
    }

    override fun solveText(
        input: QuestionInput.Text,
        mode: SolveMode,
        language: String,
        explanationLength: String
    ): Flow<SolveFlowState> = flow {
        // Step 1: Reading input
        emit(SolveFlowState.Progress(SolveStatus.READING))
        delay(120) // Brief sensory feedback delay for human-readable state transition

        // Step 2: Understanding & parsing context
        emit(SolveFlowState.Progress(SolveStatus.UNDERSTANDING))
        delay(150)

        // Step 3: Solving via backend academic solver
        emit(SolveFlowState.Progress(SolveStatus.SOLVING))

        try {
            val requestDto = SolveRequestDto(
                prompt = input.content,
                mode = mode.name,
                language = language,
                explanationLength = explanationLength,
                inputSource = input.source.name
            )

            val response = apiService.solveText(requestDto)

            if (response.isSuccessful && response.body() != null) {
                // Step 4: Verifying structured output
                emit(SolveFlowState.Progress(SolveStatus.VERIFYING))
                delay(100)

                val body = response.body()!!
                val domainResult = body.toDomain(mode = mode, source = input.source)

                if (body.status == "INCOMPLETE_QUESTION") {
                    emit(SolveFlowState.Failure(
                        status = SolveStatus.INCOMPLETE_QUESTION,
                        message = domainResult.answer
                    ))
                } else if (body.status == "OPTIONS_INCOMPLETE") {
                    emit(SolveFlowState.Failure(
                        status = SolveStatus.OPTIONS_INCOMPLETE,
                        message = "Pilihan jawaban tidak lengkap atau terpotong."
                    ))
                } else {
                    emit(SolveFlowState.Success(domainResult))
                }
            } else {
                val code = response.code()
                when (code) {
                    429 -> emit(SolveFlowState.Failure(
                        status = SolveStatus.RATE_LIMITED,
                        message = "Batas frekuensi permintaan tercapai. Mohon tunggu beberapa detik."
                    ))
                    else -> emit(SolveFlowState.Failure(
                        status = SolveStatus.SERVER_ERROR,
                        message = "Terjadi kendala pada gateway penyelesai (HTTP $code)."
                    ))
                }
            }
        } catch (e: IOException) {
            emit(SolveFlowState.Failure(
                status = SolveStatus.NO_INTERNET,
                message = "Gagal menghubungi server. Periksa koneksi internet atau status backend."
            ))
        } catch (e: Exception) {
            emit(SolveFlowState.Failure(
                status = SolveStatus.ERROR,
                message = e.localizedMessage ?: "Terjadi kesalahan yang tidak terduga."
            ))
        }
    }

    override fun solveImage(
        input: QuestionInput.Image,
        mode: SolveMode,
        language: String,
        explanationLength: String
    ): Flow<SolveFlowState> = flow {
        // Step 1: Reading multimodal input
        emit(SolveFlowState.Progress(SolveStatus.READING))
        delay(120)

        // Step 2: Visual comprehension & diagram parsing
        emit(SolveFlowState.Progress(SolveStatus.UNDERSTANDING))
        delay(150)

        // Step 3: Solving via backend multimodal Vision AI
        emit(SolveFlowState.Progress(SolveStatus.SOLVING))

        try {
            val base64String = Base64.getEncoder().encodeToString(input.imageBytes)

            val requestDto = SolveVisionRequestDto(
                imageBase64 = base64String,
                mimeType = input.mimeType,
                prompt = input.extractedOcrText,
                mode = mode.name,
                language = language,
                explanationLength = explanationLength
            )

            val response = apiService.solveVision(requestDto)

            if (response.isSuccessful && response.body() != null) {
                // Step 4: Verifying structured output
                emit(SolveFlowState.Progress(SolveStatus.VERIFYING))
                delay(100)

                val body = response.body()!!
                val domainResult = body.toDomain(mode = mode, source = input.source)

                if (body.status == "INCOMPLETE_QUESTION") {
                    emit(SolveFlowState.Failure(
                        status = SolveStatus.INCOMPLETE_QUESTION,
                        message = domainResult.answer
                    ))
                } else if (body.status == "OPTIONS_INCOMPLETE") {
                    emit(SolveFlowState.Failure(
                        status = SolveStatus.OPTIONS_INCOMPLETE,
                        message = "Pilihan jawaban tidak lengkap atau terpotong."
                    ))
                } else {
                    emit(SolveFlowState.Success(domainResult))
                }
            } else {
                val code = response.code()
                when (code) {
                    429 -> emit(SolveFlowState.Failure(
                        status = SolveStatus.RATE_LIMITED,
                        message = "Batas frekuensi permintaan vision tercapai. Mohon tunggu beberapa detik."
                    ))
                    else -> emit(SolveFlowState.Failure(
                        status = SolveStatus.SERVER_ERROR,
                        message = "Terjadi kendala pada gateway Vision AI (HTTP $code)."
                    ))
                }
            }
        } catch (e: IOException) {
            emit(SolveFlowState.Failure(
                status = SolveStatus.NO_INTERNET,
                message = "Gagal menghubungi server. Periksa koneksi internet atau status backend."
            ))
        } catch (e: Exception) {
            emit(SolveFlowState.Failure(
                status = SolveStatus.ERROR,
                message = e.localizedMessage ?: "Terjadi kesalahan pada Vision AI."
            ))
        }
    }

    override suspend fun checkHealth(): Boolean {
        return try {
            val response = apiService.checkHealth()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }
}
