package com.danex.app

import com.danex.app.data.local.HistoryDao
import com.danex.app.data.remote.api.DaneXApiService
import com.danex.app.data.remote.dto.UsageStatsDto
import com.danex.app.data.repository.HistoryRepositoryImpl
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.OptionItem
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response

class HistoryRepositoryTest {

    private class FakeHistoryDao : HistoryDao {
        private val list = mutableListOf<SolveResult>()
        private val trigger = MutableStateFlow(0L)

        override fun getAllHistory(): Flow<List<SolveResult>> = trigger.map {
            list.toList().sortedByDescending { it.timestamp }
        }

        override fun getRecentHistory(limit: Int): Flow<List<SolveResult>> = trigger.map {
            list.toList().sortedByDescending { it.timestamp }.take(limit)
        }

        override fun searchHistory(query: String): Flow<List<SolveResult>> = trigger.map {
            val q = query.lowercase()
            list.filter {
                it.questionExtracted.lowercase().contains(q) ||
                it.answer.lowercase().contains(q) ||
                it.explanation.lowercase().contains(q)
            }.sortedByDescending { it.timestamp }
        }

        override fun getHistoryBySubject(subject: Subject): Flow<List<SolveResult>> = trigger.map {
            list.filter { it.subject == subject }.sortedByDescending { it.timestamp }
        }

        override suspend fun getHistoryById(id: String): SolveResult? {
            return list.find { it.id == id }
        }

        override suspend fun insert(result: SolveResult) {
            list.removeAll { it.id == result.id }
            list.add(result)
            trigger.value = System.currentTimeMillis()
        }

        override suspend fun deleteById(id: String) {
            list.removeAll { it.id == id }
            trigger.value = System.currentTimeMillis()
        }

        override suspend fun clearAll() {
            list.clear()
            trigger.value = System.currentTimeMillis()
        }

        override suspend fun getCount(): Int {
            return list.size
        }
    }

    private class FakeUsageApiService : DaneXApiService {
        override suspend fun solveText(request: com.danex.app.data.remote.dto.SolveRequestDto): Response<com.danex.app.data.remote.dto.SolveResponseDto> = throw NotImplementedError()
        override suspend fun solveVision(request: com.danex.app.data.remote.dto.SolveVisionRequestDto): Response<com.danex.app.data.remote.dto.SolveResponseDto> = throw NotImplementedError()
        override suspend fun solveFollowUp(request: com.danex.app.data.remote.dto.FollowUpRequestDto): Response<com.danex.app.data.remote.dto.SolveResponseDto> = throw NotImplementedError()
        override suspend fun checkHealth(): Response<Map<String, Any>> = Response.success(mapOf("status" to "healthy"))
        override suspend fun getUsage(): Response<UsageStatsDto> {
            return Response.success(
                UsageStatsDto(
                    totalRequests = 15,
                    successfulRequests = 15,
                    failedRequests = 0,
                    totalTokens = 3500,
                    inputTokens = 2000,
                    outputTokens = 1500,
                    budgetTokens = 1_000_000,
                    remainingTokens = 996_500,
                    percentageUsed = 0.35f,
                    isNearLimit = false,
                    isLimitExceeded = false
                )
            )
        }
    }

    private val sampleResult1 = SolveResult(
        id = "id-1",
        questionExtracted = "Organel sel penghasil ATP?",
        subject = Subject.BIOLOGY,
        questionType = QuestionType.MULTIPLE_CHOICE,
        language = "id",
        options = listOf(OptionItem("C", "Mitokondria")),
        answerOption = "C",
        answer = "Mitokondria",
        shortAnswer = "C — Mitokondria",
        explanation = "Mitokondria menghasilkan ATP.",
        steps = emptyList(),
        latex = null,
        codeSnippet = null,
        confidence = 0.98f,
        solveMode = SolveMode.QUICK,
        inputSource = InputSource.CAMERA_SCAN,
        timestamp = 1000L,
        warnings = emptyList()
    )

    private val sampleResult2 = SolveResult(
        id = "id-2",
        questionExtracted = "Tentukan akar x^2 - 5x + 6 = 0",
        subject = Subject.MATHEMATICS,
        questionType = QuestionType.CALCULATION,
        language = "id",
        options = emptyList(),
        answerOption = null,
        answer = "x = 2 atau x = 3",
        shortAnswer = "x = 2 atau x = 3",
        explanation = "Faktorisasi kuadrat.",
        steps = emptyList(),
        latex = "x = 2, 3",
        codeSnippet = null,
        confidence = 0.99f,
        solveMode = SolveMode.LEARN,
        inputSource = InputSource.MANUAL_INPUT,
        timestamp = 2000L,
        warnings = emptyList()
    )

    @Test
    fun testSaveAndGetAllHistory() = runBlocking {
        val dao = FakeHistoryDao()
        val repo = HistoryRepositoryImpl(dao)

        repo.saveResult(sampleResult1)
        repo.saveResult(sampleResult2)

        val history = repo.allHistory.first()
        assertEquals(2, history.size)
        // Sorted descending by timestamp
        assertEquals("id-2", history[0].id)
        assertEquals("id-1", history[1].id)
    }

    @Test
    fun testSearchHistory() = runBlocking {
        val dao = FakeHistoryDao()
        val repo = HistoryRepositoryImpl(dao)

        repo.saveResult(sampleResult1)
        repo.saveResult(sampleResult2)

        val bioSearch = repo.searchHistory("mitokondria").first()
        assertEquals(1, bioSearch.size)
        assertEquals("id-1", bioSearch[0].id)

        val mathSearch = repo.searchHistory("akar").first()
        assertEquals(1, mathSearch.size)
        assertEquals("id-2", mathSearch[0].id)
    }

    @Test
    fun testFilterBySubject() = runBlocking {
        val dao = FakeHistoryDao()
        val repo = HistoryRepositoryImpl(dao)

        repo.saveResult(sampleResult1)
        repo.saveResult(sampleResult2)

        val mathOnly = repo.getHistoryBySubject(Subject.MATHEMATICS).first()
        assertEquals(1, mathOnly.size)
        assertEquals(Subject.MATHEMATICS, mathOnly[0].subject)

        val physOnly = repo.getHistoryBySubject(Subject.PHYSICS).first()
        assertEquals(0, physOnly.size)
    }

    @Test
    fun testDeleteAndClearHistory() = runBlocking {
        val dao = FakeHistoryDao()
        val repo = HistoryRepositoryImpl(dao)

        repo.saveResult(sampleResult1)
        repo.saveResult(sampleResult2)
        assertEquals(2, repo.getHistoryCount())

        repo.deleteResult("id-1")
        assertEquals(1, repo.getHistoryCount())
        assertNull(repo.getHistoryById("id-1"))
        assertNotNull(repo.getHistoryById("id-2"))

        repo.clearHistory()
        assertEquals(0, repo.getHistoryCount())
        assertTrue(repo.allHistory.first().isEmpty())
    }

    @Test
    fun testGetUsageStats() = runBlocking {
        val dao = FakeHistoryDao()
        val api = FakeUsageApiService()
        val repo = HistoryRepositoryImpl(dao, api)

        val stats = repo.getUsageStats()
        assertNotNull(stats)
        assertEquals(3500, stats?.totalTokens)
        assertEquals(1_000_000, stats?.budgetTokens)
        assertEquals(996_500, stats?.remainingTokens)
    }
}
