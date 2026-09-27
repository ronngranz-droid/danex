package com.danex.app.core.academic

import com.danex.app.domain.model.OptionItem

data class McqParseResult(
    val questionBody: String,
    val options: List<OptionItem>,
    val isComplete: Boolean,
    val confidence: Float
)

object McqExtractor {

    private val lineOptionRegex = Regex("""(?m)^[\s•\-\*]*([A-Ea-e1-5])[\.\)\:\-]\s+(.+)$""")
    private val inlineOptionRegex = Regex("""([A-Ea-e])[\.\)]\s+([^\n]+?)(?=(?:\s+[A-Ea-e][\.\)]|$))""")

    fun extractMcq(rawText: String): McqParseResult {
        val trimmed = rawText.trim()
        val options = mutableListOf<OptionItem>()
        val questionLines = mutableListOf<String>()

        val lines = trimmed.lines()

        for (line in lines) {
            val match = lineOptionRegex.find(line.trim())
            if (match != null) {
                val rawKey = match.groupValues[1]
                val key = normalizeKey(rawKey)
                val text = match.groupValues[2].trim()
                if (text.isNotBlank()) {
                    options.add(OptionItem(key = key, text = text))
                }
            } else {
                if (options.isEmpty()) {
                    questionLines.add(line)
                }
            }
        }

        // If line-by-line found fewer than 2 options, try inline regex
        if (options.size < 2) {
            options.clear()
            val matches = inlineOptionRegex.findAll(trimmed).toList()
            if (matches.size >= 2) {
                var firstOptionIndex = trimmed.length
                for (match in matches) {
                    val key = match.groupValues[1].uppercase()
                    val text = match.groupValues[2].trim()
                    options.add(OptionItem(key = key, text = text))
                    if (match.range.first < firstOptionIndex) {
                        firstOptionIndex = match.range.first
                    }
                }
                val questionPart = trimmed.substring(0, firstOptionIndex).trim()
                return McqParseResult(
                    questionBody = questionPart.ifBlank { trimmed },
                    options = options,
                    isComplete = options.size >= 2,
                    confidence = if (options.size >= 4) 0.95f else 0.85f
                )
            }
        }

        val questionBody = questionLines.joinToString("\n").trim()
        val isComplete = options.size >= 2 && questionBody.isNotBlank()

        val confidence = when {
            options.size in 4..5 && questionBody.length > 15 -> 0.98f
            options.size >= 2 -> 0.88f
            else -> 0.40f
        }

        return McqParseResult(
            questionBody = questionBody.ifBlank { trimmed },
            options = options,
            isComplete = isComplete,
            confidence = confidence
        )
    }

    private fun normalizeKey(rawKey: String): String {
        return when (rawKey.trim()) {
            "1" -> "A"
            "2" -> "B"
            "3" -> "C"
            "4" -> "D"
            "5" -> "E"
            else -> rawKey.uppercase().trim()
        }
    }
}
