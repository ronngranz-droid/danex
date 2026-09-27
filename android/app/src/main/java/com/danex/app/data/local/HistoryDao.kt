package com.danex.app.data.local

import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import kotlinx.coroutines.flow.Flow

interface HistoryDao {

    fun getAllHistory(): Flow<List<SolveResult>>

    fun getRecentHistory(limit: Int = 10): Flow<List<SolveResult>>

    fun searchHistory(query: String): Flow<List<SolveResult>>

    fun getHistoryBySubject(subject: Subject): Flow<List<SolveResult>>

    suspend fun getHistoryById(id: String): SolveResult?

    suspend fun insert(result: SolveResult)

    suspend fun deleteById(id: String)

    suspend fun clearAll()

    suspend fun getCount(): Int
}
