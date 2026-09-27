package com.danex.app.core.di

import android.content.Context
import com.danex.app.core.network.RetrofitClient
import com.danex.app.data.preferences.SettingsDataStore
import com.danex.app.data.remote.api.DaneXApiService
import com.danex.app.data.repository.SettingsRepository
import com.danex.app.data.repository.SettingsRepositoryImpl
import com.danex.app.data.repository.SolverRepositoryImpl
import com.danex.app.domain.repository.SolverRepository

interface AppContainer {
    val settingsRepository: SettingsRepository
    val apiService: DaneXApiService
    val solverRepository: SolverRepository
    val outputAutomationHandler: com.danex.app.core.automation.OutputAutomationHandler
    val historyRepository: com.danex.app.data.repository.HistoryRepository
}

class DefaultAppContainer(private val appContext: Context) : AppContainer {

    private val settingsDataStore: SettingsDataStore by lazy {
        SettingsDataStore(appContext)
    }

    private val dbHelper: com.danex.app.data.local.DaneXDbHelper by lazy {
        com.danex.app.data.local.DaneXDbHelper(appContext)
    }

    override val settingsRepository: SettingsRepository by lazy {
        SettingsRepositoryImpl(settingsDataStore)
    }

    override val apiService: DaneXApiService by lazy {
        RetrofitClient.createApiService()
    }

    override val solverRepository: SolverRepository by lazy {
        SolverRepositoryImpl(apiService)
    }

    override val outputAutomationHandler: com.danex.app.core.automation.OutputAutomationHandler by lazy {
        com.danex.app.core.automation.DefaultOutputAutomationHandler(appContext)
    }

    override val historyRepository: com.danex.app.data.repository.HistoryRepository by lazy {
        com.danex.app.data.repository.HistoryRepositoryImpl(dbHelper, apiService)
    }
}
