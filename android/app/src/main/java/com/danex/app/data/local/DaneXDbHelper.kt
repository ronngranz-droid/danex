package com.danex.app.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.danex.app.domain.model.CodeSnippet
import com.danex.app.domain.model.InputSource
import com.danex.app.domain.model.OptionItem
import com.danex.app.domain.model.QuestionType
import com.danex.app.domain.model.SolveMode
import com.danex.app.domain.model.SolveResult
import com.danex.app.domain.model.Subject
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class DaneXDbHelper(
    context: Context,
    dbName: String = DATABASE_NAME
) : SQLiteOpenHelper(context, dbName, null, DATABASE_VERSION), HistoryDao {

    companion object {
        const val DATABASE_NAME = "danex_history.db"
        const val DATABASE_VERSION = 1

        const val TABLE_HISTORY = "solve_history"
        const val COL_ID = "id"
        const val COL_QUESTION = "question_extracted"
        const val COL_SUBJECT = "subject"
        const val COL_QUESTION_TYPE = "question_type"
        const val COL_LANGUAGE = "language"
        const val COL_OPTIONS_JSON = "options_json"
        const val COL_ANSWER_OPTION = "answer_option"
        const val COL_ANSWER = "answer"
        const val COL_SHORT_ANSWER = "short_answer"
        const val COL_EXPLANATION = "explanation"
        const val COL_STEPS_JSON = "steps_json"
        const val COL_LATEX = "latex"
        const val COL_CODE_SNIPPET_JSON = "code_snippet_json"
        const val COL_CONFIDENCE = "confidence"
        const val COL_SOLVE_MODE = "solve_mode"
        const val COL_INPUT_SOURCE = "input_source"
        const val COL_TIMESTAMP = "timestamp"
        const val COL_WARNINGS_JSON = "warnings_json"
    }

    private val gson = Gson()
    private val mutationTrigger = MutableStateFlow(0L)

    override fun onCreate(db: SQLiteDatabase) {
        val createTableQuery = """
            CREATE TABLE $TABLE_HISTORY (
                $COL_ID TEXT PRIMARY KEY,
                $COL_QUESTION TEXT NOT NULL,
                $COL_SUBJECT TEXT NOT NULL,
                $COL_QUESTION_TYPE TEXT NOT NULL,
                $COL_LANGUAGE TEXT NOT NULL,
                $COL_OPTIONS_JSON TEXT,
                $COL_ANSWER_OPTION TEXT,
                $COL_ANSWER TEXT NOT NULL,
                $COL_SHORT_ANSWER TEXT NOT NULL,
                $COL_EXPLANATION TEXT NOT NULL,
                $COL_STEPS_JSON TEXT,
                $COL_LATEX TEXT,
                $COL_CODE_SNIPPET_JSON TEXT,
                $COL_CONFIDENCE REAL NOT NULL,
                $COL_SOLVE_MODE TEXT NOT NULL,
                $COL_INPUT_SOURCE TEXT NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL,
                $COL_WARNINGS_JSON TEXT
            );
        """.trimIndent()
        db.execSQL(createTableQuery)

        // Performance indexes
        db.execSQL("CREATE INDEX idx_history_timestamp ON $TABLE_HISTORY ($COL_TIMESTAMP DESC);")
        db.execSQL("CREATE INDEX idx_history_subject ON $TABLE_HISTORY ($COL_SUBJECT);")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_HISTORY")
        onCreate(db)
    }

    override fun getAllHistory(): Flow<List<SolveResult>> = mutationTrigger.map {
        withContext(Dispatchers.IO) {
            queryHistory("SELECT * FROM $TABLE_HISTORY ORDER BY $COL_TIMESTAMP DESC")
        }
    }

    override fun getRecentHistory(limit: Int): Flow<List<SolveResult>> = mutationTrigger.map {
        withContext(Dispatchers.IO) {
            queryHistory("SELECT * FROM $TABLE_HISTORY ORDER BY $COL_TIMESTAMP DESC LIMIT $limit")
        }
    }

    override fun searchHistory(query: String): Flow<List<SolveResult>> = mutationTrigger.map {
        withContext(Dispatchers.IO) {
            val safeQuery = "%${query.trim()}%"
            queryHistory(
                "SELECT * FROM $TABLE_HISTORY WHERE $COL_QUESTION LIKE ? OR $COL_ANSWER LIKE ? OR $COL_EXPLANATION LIKE ? ORDER BY $COL_TIMESTAMP DESC",
                arrayOf(safeQuery, safeQuery, safeQuery)
            )
        }
    }

    override fun getHistoryBySubject(subject: Subject): Flow<List<SolveResult>> = mutationTrigger.map {
        withContext(Dispatchers.IO) {
            queryHistory(
                "SELECT * FROM $TABLE_HISTORY WHERE $COL_SUBJECT = ? ORDER BY $COL_TIMESTAMP DESC",
                arrayOf(subject.name.lowercase())
            )
        }
    }

    override suspend fun getHistoryById(id: String): SolveResult? = withContext(Dispatchers.IO) {
        val list = queryHistory(
            "SELECT * FROM $TABLE_HISTORY WHERE $COL_ID = ? LIMIT 1",
            arrayOf(id)
        )
        list.firstOrNull()
    }

    override suspend fun insert(result: SolveResult) = withContext(Dispatchers.IO) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_ID, result.id)
            put(COL_QUESTION, result.questionExtracted)
            put(COL_SUBJECT, result.subject.name.lowercase())
            put(COL_QUESTION_TYPE, result.questionType.name.lowercase())
            put(COL_LANGUAGE, result.language)
            put(COL_OPTIONS_JSON, gson.toJson(result.options))
            put(COL_ANSWER_OPTION, result.answerOption)
            put(COL_ANSWER, result.answer)
            put(COL_SHORT_ANSWER, result.shortAnswer)
            put(COL_EXPLANATION, result.explanation)
            put(COL_STEPS_JSON, gson.toJson(result.steps))
            put(COL_LATEX, result.latex)
            put(COL_CODE_SNIPPET_JSON, result.codeSnippet?.let { gson.toJson(it) })
            put(COL_CONFIDENCE, result.confidence)
            put(COL_SOLVE_MODE, result.solveMode.name)
            put(COL_INPUT_SOURCE, result.inputSource.name)
            put(COL_TIMESTAMP, result.timestamp)
            put(COL_WARNINGS_JSON, gson.toJson(result.warnings))
        }
        db.insertWithOnConflict(TABLE_HISTORY, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        mutationTrigger.value = System.currentTimeMillis()
    }

    override suspend fun deleteById(id: String) = withContext(Dispatchers.IO) {
        val db = writableDatabase
        db.delete(TABLE_HISTORY, "$COL_ID = ?", arrayOf(id))
        mutationTrigger.value = System.currentTimeMillis()
    }

    override suspend fun clearAll() = withContext(Dispatchers.IO) {
        val db = writableDatabase
        db.delete(TABLE_HISTORY, null, null)
        mutationTrigger.value = System.currentTimeMillis()
    }

    override suspend fun getCount(): Int = withContext(Dispatchers.IO) {
        val db = readableDatabase
        db.rawQuery("SELECT COUNT(*) FROM $TABLE_HISTORY", null).use { cursor ->
            if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
    }

    private fun queryHistory(sql: String, selectionArgs: Array<String>? = null): List<SolveResult> {
        val list = mutableListOf<SolveResult>()
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(sql, selectionArgs)

        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(COL_ID))
                val question = it.getString(it.getColumnIndexOrThrow(COL_QUESTION))
                val subjectStr = it.getString(it.getColumnIndexOrThrow(COL_SUBJECT))
                val qTypeStr = it.getString(it.getColumnIndexOrThrow(COL_QUESTION_TYPE))
                val lang = it.getString(it.getColumnIndexOrThrow(COL_LANGUAGE))
                val optionsJson = it.getString(it.getColumnIndexOrThrow(COL_OPTIONS_JSON))
                val answerOption = it.getString(it.getColumnIndexOrThrow(COL_ANSWER_OPTION))
                val answer = it.getString(it.getColumnIndexOrThrow(COL_ANSWER))
                val shortAnswer = it.getString(it.getColumnIndexOrThrow(COL_SHORT_ANSWER))
                val explanation = it.getString(it.getColumnIndexOrThrow(COL_EXPLANATION))
                val stepsJson = it.getString(it.getColumnIndexOrThrow(COL_STEPS_JSON))
                val latex = it.getString(it.getColumnIndexOrThrow(COL_LATEX))
                val codeJson = it.getString(it.getColumnIndexOrThrow(COL_CODE_SNIPPET_JSON))
                val confidence = it.getFloat(it.getColumnIndexOrThrow(COL_CONFIDENCE))
                val solveModeStr = it.getString(it.getColumnIndexOrThrow(COL_SOLVE_MODE))
                val inputSourceStr = it.getString(it.getColumnIndexOrThrow(COL_INPUT_SOURCE))
                val timestamp = it.getLong(it.getColumnIndexOrThrow(COL_TIMESTAMP))
                val warningsJson = it.getString(it.getColumnIndexOrThrow(COL_WARNINGS_JSON))

                val options: List<OptionItem> = try {
                    if (optionsJson != null) {
                        val type = object : TypeToken<List<OptionItem>>() {}.type
                        gson.fromJson(optionsJson, type) ?: emptyList()
                    } else emptyList()
                } catch (_: Exception) { emptyList() }

                val steps: List<String> = try {
                    if (stepsJson != null) {
                        val type = object : TypeToken<List<String>>() {}.type
                        gson.fromJson(stepsJson, type) ?: emptyList()
                    } else emptyList()
                } catch (_: Exception) { emptyList() }

                val codeSnippet: CodeSnippet? = try {
                    if (codeJson != null) gson.fromJson(codeJson, CodeSnippet::class.java) else null
                } catch (_: Exception) { null }

                val warnings: List<String> = try {
                    if (warningsJson != null) {
                        val type = object : TypeToken<List<String>>() {}.type
                        gson.fromJson(warningsJson, type) ?: emptyList()
                    } else emptyList()
                } catch (_: Exception) { emptyList() }

                list.add(
                    SolveResult(
                        id = id,
                        questionExtracted = question,
                        subject = Subject.fromString(subjectStr),
                        questionType = QuestionType.fromString(qTypeStr),
                        language = lang,
                        options = options,
                        answerOption = answerOption,
                        answer = answer,
                        shortAnswer = shortAnswer,
                        explanation = explanation,
                        steps = steps,
                        latex = latex,
                        codeSnippet = codeSnippet,
                        confidence = confidence,
                        solveMode = SolveMode.fromString(solveModeStr),
                        inputSource = try { InputSource.valueOf(inputSourceStr) } catch (_: Exception) { InputSource.MANUAL_INPUT },
                        timestamp = timestamp,
                        warnings = warnings
                    )
                )
            }
        }
        return list
    }
}
