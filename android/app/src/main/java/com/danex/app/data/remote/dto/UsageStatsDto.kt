package com.danex.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class UsageStatsDto(
    @SerializedName("totalRequests") val totalRequests: Int = 0,
    @SerializedName("successfulRequests") val successfulRequests: Int = 0,
    @SerializedName("failedRequests") val failedRequests: Int = 0,
    @SerializedName("totalTokens") val totalTokens: Int = 0,
    @SerializedName("inputTokens") val inputTokens: Int = 0,
    @SerializedName("outputTokens") val outputTokens: Int = 0,
    @SerializedName("budgetTokens") val budgetTokens: Int = 1_000_000,
    @SerializedName("remainingTokens") val remainingTokens: Int = 1_000_000,
    @SerializedName("percentageUsed") val percentageUsed: Float = 0f,
    @SerializedName("isNearLimit") val isNearLimit: Boolean = false,
    @SerializedName("isLimitExceeded") val isLimitExceeded: Boolean = false
)
