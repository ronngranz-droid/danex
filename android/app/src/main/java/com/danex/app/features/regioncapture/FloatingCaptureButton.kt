package com.danex.app.features.regioncapture

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.abs

/**
 * A small, draggable floating action button that appears over other apps.
 * Tapping it triggers the full-screen region selection overlay.
 * Dragging repositions it on screen.
 */
class FloatingCaptureButton(
    context: Context,
    private val onCaptureRequested: () -> Unit
) : View(context) {

    companion object {
        private const val BUTTON_SIZE_PX = 160 // ~56dp at mdpi
        private const val DRAG_THRESHOLD = 12f

        fun createLayoutParams(): WindowManager.LayoutParams {
            return WindowManager.LayoutParams(
                BUTTON_SIZE_PX,
                BUTTON_SIZE_PX,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
            }
        }
    }

    // Paint objects
    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#2196F3") // DaneX Blue
        style = Paint.Style.FILL
        setShadowLayer(10f, 0f, 4f, Color.parseColor("#55000000"))
    }

    private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 5f
        strokeCap = Paint.Cap.ROUND
    }

    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 22f
        textAlign = Paint.Align.CENTER
        typeface = android.graphics.Typeface.create(
            android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD
        )
    }

    // Drag tracking
    private var dragStartRawX = 0f
    private var dragStartRawY = 0f
    private var lastRawX = 0f
    private var lastRawY = 0f
    private var isDragging = false

    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null) // Required for setShadowLayer
    }

    override fun onDraw(canvas: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val radius = cx - 12f

        // Circle background
        canvas.drawCircle(cx, cy, radius, backgroundPaint)

        // Draw crop icon (4 corner brackets)
        val iconSize = radius * 0.42f
        val left = cx - iconSize
        val top = cy - iconSize - 6f
        val right = cx + iconSize
        val bottom = cy + iconSize - 6f
        val cornerLen = iconSize * 0.45f

        // Top-left corner
        canvas.drawLine(left, top + cornerLen, left, top, iconPaint)
        canvas.drawLine(left, top, left + cornerLen, top, iconPaint)
        // Top-right corner
        canvas.drawLine(right - cornerLen, top, right, top, iconPaint)
        canvas.drawLine(right, top, right, top + cornerLen, iconPaint)
        // Bottom-left corner
        canvas.drawLine(left, bottom - cornerLen, left, bottom, iconPaint)
        canvas.drawLine(left, bottom, left + cornerLen, bottom, iconPaint)
        // Bottom-right corner
        canvas.drawLine(right - cornerLen, bottom, right, bottom, iconPaint)
        canvas.drawLine(right, bottom, right, bottom - cornerLen, iconPaint)

        // Label "DX" below icon
        canvas.drawText("DX", cx, bottom + 28f, labelPaint)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                dragStartRawX = event.rawX
                dragStartRawY = event.rawY
                lastRawX = event.rawX
                lastRawY = event.rawY
                isDragging = false
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = event.rawX - lastRawX
                val dy = event.rawY - lastRawY

                if (!isDragging &&
                    (abs(event.rawX - dragStartRawX) > DRAG_THRESHOLD ||
                     abs(event.rawY - dragStartRawY) > DRAG_THRESHOLD)
                ) {
                    isDragging = true
                }

                if (isDragging) {
                    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                    val params = layoutParams as WindowManager.LayoutParams
                    params.x += dx.toInt()
                    params.y += dy.toInt()
                    wm.updateViewLayout(this, params)
                }

                lastRawX = event.rawX
                lastRawY = event.rawY
                return true
            }
            MotionEvent.ACTION_UP -> {
                if (!isDragging) {
                    performClick()
                    onCaptureRequested()
                }
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
