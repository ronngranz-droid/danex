package com.danex.app.domain.repository

import com.danex.app.domain.model.QuestionInput
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.SolveStatus
import kotlinx.coroutines.flow.Flow

sealed interface SolveFlowState {
    data class Progress(val status: SolveStatus) : SolveFlowState
    data class Success(val result: SolveResult) : SolveFlowState
    data class Failure(val status: SolveStatus, val message: String) : SolveFlowState
}

interface SolverRepository {
    fun solveText(
        input: QuestionInput.Text,
        mode: SolveMode,
        language: String = "id",
        explanationLength: String = "concise"
    ): Flow<SolveFlowState>

    fun solveImage(
        input: QuestionInput.Image,
        mode: SolveMode,
        language: String = "id",
        explanationLength: String = "concise"
    ): Flow<SolveFlowState>

    fun solve(
        input: QuestionInput,
        mode: SolveMode,
        language: String = "id",
        explanationLength: String = "concise"
    ): Flow<SolveFlowState>

    suspend fun checkHealth(): Boolean
}
