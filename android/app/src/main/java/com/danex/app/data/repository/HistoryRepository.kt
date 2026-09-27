package com.danex.app.data.repository

import com.danex.app.data.remote.dto.UsageStatsDto
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import kotlinx.coroutines.flow.Flow

interface HistoryRepository {

    val allHistory: Flow<List<SolveResult>>

    val recentHistory: Flow<List<SolveResult>>

    fun searchHistory(query: String): Flow<List<SolveResult>>

    fun getHistoryBySubject(subject: Subject): Flow<List<SolveResult>>

    suspend fun getHistoryById(id: String): SolveResult?

    suspend fun saveResult(result: SolveResult)

    suspend fun deleteResult(id: String)

    suspend fun clearHistory()

    suspend fun getHistoryCount(): Int

    suspend fun getUsageStats(): UsageStatsDto?
}
