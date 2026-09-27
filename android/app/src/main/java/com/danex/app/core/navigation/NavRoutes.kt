package com.danex.app.core.navigation

sealed class NavRoutes(val route: String) {
    data object Onboarding : NavRoutes("onboarding")
    data object Home : NavRoutes("home")
    data object Settings : NavRoutes("settings")
    data object History : NavRoutes("history")
    data object Camera : NavRoutes("camera")
    data object Result : NavRoutes("result/{solveId}") {
        fun createRoute(solveId: String) = "result/$solveId"
    }
}
