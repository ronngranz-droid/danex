package com.danex.app.data.repository

import com.danex.app.data.local.HistoryDao
import com.danex.app.data.remote.api.DaneXApiService
import com.danex.app.data.remote.dto.UsageStatsDto
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import kotlinx.coroutines.flow.Flow

class HistoryRepositoryImpl(
    private val historyDao: HistoryDao,
    private val apiService: DaneXApiService? = null
) : HistoryRepository {

    override val allHistory: Flow<List<SolveResult>> = historyDao.getAllHistory()

    override val recentHistory: Flow<List<SolveResult>> = historyDao.getRecentHistory(10)

    override fun searchHistory(query: String): Flow<List<SolveResult>> {
        return historyDao.searchHistory(query)
    }

    override fun getHistoryBySubject(subject: Subject): Flow<List<SolveResult>> {
        return historyDao.getHistoryBySubject(subject)
    }

    override suspend fun getHistoryById(id: String): SolveResult? {
        return historyDao.getHistoryById(id)
    }

    override suspend fun saveResult(result: SolveResult) {
        historyDao.insert(result)
    }

    override suspend fun deleteResult(id: String) {
        historyDao.deleteById(id)
    }

    override suspend fun clearHistory() {
        historyDao.clearAll()
    }

    override suspend fun getHistoryCount(): Int {
        return historyDao.getCount()
    }

    override suspend fun getUsageStats(): UsageStatsDto? {
        return try {
            val response = apiService?.getUsage()
            if (response?.isSuccessful == true) {
                response.body()
            } else null
        } catch (_: Exception) {
            null
        }
    }
}
