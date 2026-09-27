package com.danex.app.features.regioncapture

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.graphics.RectF
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import com.danex.app.MainActivity
import com.danex.app.core.utils.ImageCropHelper
import com.danex.app.core.utils.NormalizedCropRect
import com.danex.app.ocr.TextRecognizerEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Foreground service that manages MediaProjection screen capture
 * with a floating capture button and region selection overlay.
 *
 * Lifecycle:
 * 1. Service starts → shows floating "DX" button
 * 2. User switches to target app, taps floating button
 * 3. Full-screen selection overlay appears
 * 4. User draws region → overlay hides → screen captured
 * 5. FLAG_SECURE check → OCR → result sent to MainActivity
 * 6. Service stops
 */
class RegionCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "danex_region_capture"
        const val NOTIFICATION_ID = 2001
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        const val ACTION_STOP = "com.danex.app.STOP_REGION_CAPTURE"
        const val ACTION_RESULT = "com.danex.app.REGION_CAPTURE_RESULT"

        fun createStartIntent(context: Context, resultCode: Int, data: Intent): Intent {
            return Intent(context, RegionCaptureService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_RESULT_DATA, data)
            }
        }
    }

    private var mediaProjection: MediaProjection? = null
    private var captureManager: ScreenCaptureManager? = null
    private var floatingButton: FloatingCaptureButton? = null
    private var overlayView: RegionSelectOverlayView? = null
    private var windowManager: WindowManager? = null
    private var ocrEngine: TextRecognizerEngine? = null
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        ocrEngine = TextRecognizerEngine()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, -1) ?: -1
        @Suppress("DEPRECATION")
        val resultData: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent?.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
        } else {
            intent?.getParcelableExtra(EXTRA_RESULT_DATA)
        }

        if (resultCode == -1 || resultData == null) {
            stopSelf()
            return START_NOT_STICKY
        }

        // MUST start foreground BEFORE calling getMediaProjection (Android 14+ requirement)
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID, notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // Initialize MediaProjection
        try {
            val projectionManager =
                getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)
        } catch (e: SecurityException) {
            Toast.makeText(this, "Gagal mendapatkan izin tangkapan layar", Toast.LENGTH_SHORT).show()
            stopSelf()
            return START_NOT_STICKY
        }

        // Initialize capture
        val metrics = getScreenMetrics()
        captureManager = ScreenCaptureManager(
            mediaProjection = mediaProjection!!,
            screenWidth = metrics.widthPixels,
            screenHeight = metrics.heightPixels,
            screenDensity = metrics.densityDpi
        )
        captureManager?.initialize()

        // Show floating button (user switches to target app, then taps it)
        showFloatingButton(metrics)

        return START_NOT_STICKY
    }

    // ── Floating Button ─────────────────────────────────────────────────

    private fun showFloatingButton(metrics: DisplayMetrics) {
        floatingButton = FloatingCaptureButton(
            context = this,
            onCaptureRequested = {
                removeFloatingButton()
                showSelectionOverlay()
            }
        )

        val params = FloatingCaptureButton.createLayoutParams()
        params.x = metrics.widthPixels - 200
        params.y = metrics.heightPixels / 2

        windowManager?.addView(floatingButton, params)
    }

    private fun removeFloatingButton() {
        floatingButton?.let { btn ->
            try {
                windowManager?.removeView(btn)
            } catch (_: Exception) { }
        }
        floatingButton = null
    }

    // ── Selection Overlay ───────────────────────────────────────────────

    private fun showSelectionOverlay() {
        overlayView = RegionSelectOverlayView(
            context = this,
            onRegionSelected = { normalizedRect ->
                handleRegionCapture(normalizedRect)
            },
            onCancelled = {
                stopSelf()
            }
        )

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.TOP or Gravity.START

        windowManager?.addView(overlayView, params)
    }

    private fun removeSelectionOverlay() {
        overlayView?.let { view ->
            try {
                windowManager?.removeView(view)
            } catch (_: Exception) { }
        }
        overlayView = null
    }

    // ── Capture & Process ───────────────────────────────────────────────

    private fun handleRegionCapture(normalizedRect: RectF) {
        // Hide overlay immediately so it's not in the screenshot
        overlayView?.visibility = View.INVISIBLE

        serviceScope.launch {
            try {
                // Wait for overlay to disappear from the display
                delay(300)

                // Capture the screen
                val fullBitmap = captureManager?.captureFrame()
                    ?: throw IllegalStateException("Screen capture returned null")

                // FLAG_SECURE detection
                val secureResult = FlagSecureDetector.detect(fullBitmap)
                if (secureResult.isBlocked) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            this@RegionCaptureService,
                            secureResult.reason,
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    stopSelf()
                    return@launch
                }

                // Crop to selected region
                val cropRect = NormalizedCropRect(
                    left = normalizedRect.left,
                    top = normalizedRect.top,
                    right = normalizedRect.right,
                    bottom = normalizedRect.bottom
                )
                val croppedBitmap = ImageCropHelper.cropBitmap(fullBitmap, cropRect)
                val optimizedBitmap = ImageCropHelper.downscaleIfNeeded(croppedBitmap, 1600)

                // OCR
                val ocrResult = ocrEngine?.recognizeText(optimizedBitmap)
                    ?: throw IllegalStateException("OCR engine unavailable")

                // Route decision
                if (ocrResult.routeDecision.useFastPath && ocrResult.fullText.isNotBlank()) {
                    // Fast path: text-only result
                    RegionCaptureResultHolder.pendingText = ocrResult.fullText
                    RegionCaptureResultHolder.pendingImageBytes = null
                    RegionCaptureResultHolder.isImageResult = false
                } else {
                    // Vision path: image + optional OCR text
                    val jpegBytes = ImageCropHelper.compressToJpeg(optimizedBitmap, 85)
                    RegionCaptureResultHolder.pendingText = ocrResult.fullText.ifBlank { null }
                    RegionCaptureResultHolder.pendingImageBytes = jpegBytes
                    RegionCaptureResultHolder.isImageResult = true
                }

                // Bring MainActivity to front with result
                val resultIntent = Intent(this@RegionCaptureService, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    action = ACTION_RESULT
                }
                startActivity(resultIntent)

                stopSelf()

            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@RegionCaptureService,
                        "Gagal memproses tangkapan: ${e.localizedMessage}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
                stopSelf()
            }
        }
    }

    // ── Utilities ───────────────────────────────────────────────────────

    @Suppress("DEPRECATION")
    private fun getScreenMetrics(): DisplayMetrics {
        val metrics = DisplayMetrics()
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        wm.defaultDisplay.getRealMetrics(metrics)
        return metrics
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Tangkapan Wilayah",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Notifikasi aktif saat DaneX menangkap wilayah layar"
            setShowBadge(false)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val stopIntent = Intent(this, RegionCaptureService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("DaneX — Tangkapan Wilayah Aktif")
            .setContentText("Ketuk tombol DX mengambang untuk memilih area soal")
            .setSmallIcon(android.R.drawable.ic_menu_crop)
            .addAction(
                Notification.Action.Builder(
                    null, "Berhenti", stopPendingIntent
                ).build()
            )
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        removeFloatingButton()
        removeSelectionOverlay()
        captureManager?.release()
        captureManager = null
        mediaProjection?.stop()
        mediaProjection = null
        ocrEngine?.close()
        ocrEngine = null
        serviceScope.cancel()
    }
}
