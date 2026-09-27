package com.danex.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.danex.app.MainActivity
import com.danex.app.core.di.AppContainer
import com.danex.app.features.home.HomeScreen
import com.danex.app.features.home.HomeViewModel
import com.danex.app.features.onboarding.OnboardingScreen
import com.danex.app.features.onboarding.OnboardingViewModel
import com.danex.app.features.regioncapture.RegionCaptureResultHolder
import com.danex.app.features.settings.SettingsScreen
import com.danex.app.features.settings.SettingsViewModel

@Composable
fun DaneXNavHost(
    container: AppContainer,
    startDestination: String,
    modifier: Modifier = Modifier,
    initialQuestionText: String? = null,
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable(NavRoutes.Onboarding.route) {
            val viewModel: OnboardingViewModel = viewModel(
                factory = OnboardingViewModel.provideFactory(container.settingsRepository)
            )
            OnboardingScreen(
                viewModel = viewModel,
                onComplete = {
                    navController.navigate(NavRoutes.Home.route) {
                        popUpTo(NavRoutes.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        composable(NavRoutes.Home.route) {
            val viewModel: HomeViewModel = viewModel(
                factory = HomeViewModel.provideFactory(
                    container.solverRepository,
                    container.settingsRepository,
                    container.outputAutomationHandler,
                    container.historyRepository
                )
            )

            // Auto-solve from intent text (PROCESS_TEXT, ACTION_SEND)
            androidx.compose.runtime.LaunchedEffect(initialQuestionText) {
                if (!initialQuestionText.isNullOrBlank()) {
                    viewModel.onInputTextChanged(initialQuestionText)
                    viewModel.submitQuestion(com.danex.app.domain.model.InputSource.SELECTED_TEXT)
                }
            }

            // Auto-solve from pending input holder (Camera scan Image/Text, etc.)
            androidx.compose.runtime.LaunchedEffect(navController.currentBackStackEntry) {
                val pending = com.danex.app.core.utils.PendingSolveInputHolder.consumePendingInput()
                if (pending != null) {
                    when (pending) {
                        is com.danex.app.domain.model.QuestionInput.Text -> {
                            viewModel.onInputTextChanged(pending.content)
                            viewModel.submitQuestion(pending.source)
                        }
                        is com.danex.app.domain.model.QuestionInput.Image -> {
                            viewModel.executeSolve(pending)
                        }
                    }
                } else {
                    val savedStateHandle = navController.currentBackStackEntry?.savedStateHandle
                    val text = savedStateHandle?.get<String>("scanned_text")
                    if (!text.isNullOrBlank()) {
                        viewModel.onInputTextChanged(text)
                        viewModel.submitQuestion(com.danex.app.domain.model.InputSource.CAMERA_SCAN)
                        savedStateHandle.remove<String>("scanned_text")
                    }
                }
            }

            // Auto-solve from region capture result
            val activity = LocalContext.current as? MainActivity
            val hasRegionResult = activity?.hasRegionCaptureResult?.value ?: false
            androidx.compose.runtime.LaunchedEffect(hasRegionResult) {
                if (hasRegionResult) {
                    val result = RegionCaptureResultHolder.consumeResult()
                    if (result != null) {
                        when (result) {
                            is RegionCaptureResultHolder.CaptureResult.TextResult -> {
                                viewModel.onInputTextChanged(result.text)
                                viewModel.submitQuestion(com.danex.app.domain.model.InputSource.REGION_CAPTURE)
                            }
                            is RegionCaptureResultHolder.CaptureResult.ImageResult -> {
                                val input = com.danex.app.domain.model.QuestionInput.Image(
                                    imageBytes = result.imageBytes,
                                    mimeType = "image/jpeg",
                                    extractedOcrText = result.ocrText,
                                    source = com.danex.app.domain.model.InputSource.REGION_CAPTURE
                                )
                                viewModel.executeSolve(input)
                            }
                        }
                    }
                    activity?.hasRegionCaptureResult?.value = false
                }
            }

            HomeScreen(
                viewModel = viewModel,
                onNavigateToCamera = {
                    navController.navigate(NavRoutes.Camera.route)
                },
                onNavigateToSettings = {
                    navController.navigate(NavRoutes.Settings.route)
                },
                onNavigateToHistory = {
                    navController.navigate(NavRoutes.History.route)
                },
                onSolveRequested = { _ ->
                    // Solve requested: will route to result in Phase 3
                }
            )
        }

        composable(NavRoutes.Settings.route) {
            val viewModel: SettingsViewModel = viewModel(
                factory = SettingsViewModel.provideFactory(
                    container.settingsRepository,
                    container.historyRepository
                )
            )
            SettingsScreen(
                viewModel = viewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(NavRoutes.Camera.route) {
            val cameraViewModel: com.danex.app.features.camera.CameraViewModel = viewModel(
                factory = com.danex.app.features.camera.CameraViewModel.provideFactory()
            )
            com.danex.app.features.camera.CameraScreen(
                viewModel = cameraViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onSolveReady = { questionInput ->
                    com.danex.app.core.utils.PendingSolveInputHolder.pendingInput = questionInput
                    navController.popBackStack()
                }
            )
        }

        composable(NavRoutes.History.route) {
            val historyViewModel: com.danex.app.features.history.HistoryViewModel = viewModel(
                factory = com.danex.app.features.history.HistoryViewModel.provideFactory(
                    container.historyRepository
                )
            )
            com.danex.app.features.history.HistoryScreen(
                viewModel = historyViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
