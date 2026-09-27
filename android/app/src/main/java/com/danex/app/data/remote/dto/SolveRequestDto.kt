package com.danex.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SolveRequestDto(
    @SerializedName("prompt") val prompt: String,
    @SerializedName("mode") val mode: String = "QUICK",
    @SerializedName("language") val language: String = "id",
    @SerializedName("explanationLength") val explanationLength: String = "concise",
    @SerializedName("inputSource") val inputSource: String? = null
)

data class SolveVisionRequestDto(
    @SerializedName("imageBase64") val imageBase64: String,
    @SerializedName("mimeType") val mimeType: String = "image/jpeg",
    @SerializedName("prompt") val prompt: String? = null,
    @SerializedName("mode") val mode: String = "QUICK",
    @SerializedName("language") val language: String = "id",
    @SerializedName("explanationLength") val explanationLength: String = "concise"
)

data class FollowUpRequestDto(
    @SerializedName("history") val history: List<FollowUpMessageDto>,
    @SerializedName("followUpQuestion") val followUpQuestion: String,
    @SerializedName("mode") val mode: String = "QUICK",
    @SerializedName("language") val language: String = "id"
)

data class FollowUpMessageDto(
    @SerializedName("role") val role: String,
    @SerializedName("content") val content: String
)
