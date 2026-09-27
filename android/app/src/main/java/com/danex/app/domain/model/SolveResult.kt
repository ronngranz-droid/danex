package com.danex.app.domain.model

data class OptionItem(
    val key: String,
    val text: String
)

data class CodeSnippet(
    val language: String,
    val code: String
)

data class SolveResult(
    val id: String,
    val questionExtracted: String,
    val subject: Subject,
    val questionType: QuestionType,
    val language: String = "id",
    val options: List<OptionItem> = emptyList(),
    val answerOption: String? = null,
    val answer: String,
    val shortAnswer: String,
    val explanation: String,
    val steps: List<String> = emptyList(),
    val latex: String? = null,
    val codeSnippet: CodeSnippet? = null,
    val confidence: Float = 1.0f,
    val solveMode: SolveMode = SolveMode.QUICK,
    val inputSource: InputSource = InputSource.MANUAL_INPUT,
    val timestamp: Long = System.currentTimeMillis(),
    val warnings: List<String> = emptyList()
) {
    val isMultipleChoice: Boolean
        get() = questionType == QuestionType.MULTIPLE_CHOICE || questionType == QuestionType.MULTIPLE_ANSWER

    val formattedShortNotification: String
        get() = when {
            !answerOption.isNullOrBlank() && answer.isNotBlank() -> "$answerOption — $answer"
            !answerOption.isNullOrBlank() -> answerOption
            shortAnswer.isNotBlank() -> shortAnswer
            else -> answer.take(60)
        }
}
