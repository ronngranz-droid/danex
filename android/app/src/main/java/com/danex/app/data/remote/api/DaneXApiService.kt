package com.danex.app.data.remote.api

import com.danex.app.data.remote.dto.FollowUpRequestDto
import com.danex.app.data.remote.dto.SolveRequestDto
import com.danex.app.data.remote.dto.SolveResponseDto
import com.danex.app.data.remote.dto.SolveVisionRequestDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface DaneXApiService {

    @POST("api/v1/solve/text")
    suspend fun solveText(
        @Body request: SolveRequestDto
    ): Response<SolveResponseDto>

    @POST("api/v1/solve/vision")
    suspend fun solveVision(
        @Body request: SolveVisionRequestDto
    ): Response<SolveResponseDto>

    @POST("api/v1/solve/followup")
    suspend fun solveFollowUp(
        @Body request: FollowUpRequestDto
    ): Response<SolveResponseDto>

    @GET("api/v1/health")
    suspend fun checkHealth(): Response<Map<String, Any>>

    @GET("api/v1/usage")
    suspend fun getUsage(): Response<com.danex.app.data.remote.dto.UsageStatsDto>
}
