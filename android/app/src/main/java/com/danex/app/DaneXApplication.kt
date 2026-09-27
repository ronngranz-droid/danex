package com.danex.app

import android.app.Application
import com.danex.app.core.di.AppContainer
import com.danex.app.core.di.DefaultAppContainer

class DaneXApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(applicationContext)
    }
}
