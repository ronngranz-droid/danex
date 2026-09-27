package com.danex.app.data.remote.dto

import com.danex.app.domain.model.CodeSnippet
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.OptionItem
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import com.google.gson.annotations.SerializedName
import java.util.UUID

data class OptionItemDto(
    @SerializedName("key") val key: String,
    @SerializedName("text") val text: String
)

data class CodeSnippetDto(
    @SerializedName("language") val language: String,
    @SerializedName("code") val code: String
)

data class SolveResponseDto(
    @SerializedName("status") val status: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("questionType") val questionType: String,
    @SerializedName("language") val language: String = "id",
    @SerializedName("questionExtracted") val questionExtracted: String,
    @SerializedName("options") val options: List<OptionItemDto>? = null,
    @SerializedName("answerOption") val answerOption: String? = null,
    @SerializedName("answer") val answer: String,
    @SerializedName("shortAnswer") val shortAnswer: String,
    @SerializedName("explanation") val explanation: String,
    @SerializedName("steps") val steps: List<String>? = null,
    @SerializedName("latex") val latex: String? = null,
    @SerializedName("codeSnippet") val codeSnippet: CodeSnippetDto? = null,
    @SerializedName("confidence") val confidence: Float = 1.0f,
    @SerializedName("warnings") val warnings: List<String>? = null
) {
    fun toDomain(mode: SolveMode = SolveMode.QUICK, source: InputSource = InputSource.MANUAL_INPUT): SolveResult {
        return SolveResult(
            id = UUID.randomUUID().toString(),
            questionExtracted = questionExtracted,
            subject = Subject.fromString(subject),
            questionType = QuestionType.fromString(questionType),
            language = language,
            options = options?.map { OptionItem(it.key, it.text) } ?: emptyList(),
            answerOption = answerOption,
            answer = answer,
            shortAnswer = shortAnswer,
            explanation = explanation,
            steps = steps ?: emptyList(),
            latex = latex,
            codeSnippet = codeSnippet?.let { CodeSnippet(it.language, it.code) },
            confidence = confidence,
            solveMode = mode,
            inputSource = source,
            timestamp = System.currentTimeMillis(),
            warnings = warnings ?: emptyList()
        )
    }
}
