package com.danex.app.features.regioncapture

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.view.MotionEvent
import android.view.View
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Full-screen overlay view for selecting a region of the screen to capture.
 *
 * States:
 * - IDLE: Dim background with instruction text. User draws a rectangle by dragging.
 * - DRAWING: User is actively dragging to create a selection rectangle.
 * - ADJUSTING: Rectangle complete with corner resize handles and action buttons.
 * - CAPTURED: Transparent state (overlay hidden) during screen capture.
 */
class RegionSelectOverlayView(
    context: Context,
    private val onRegionSelected: (RectF) -> Unit,
    private val onCancelled: () -> Unit
) : View(context) {

    private enum class State {
        IDLE, DRAWING, ADJUSTING, CAPTURED
    }

    private enum class HandleType {
        NONE, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, MOVE
    }

    // Current state
    private var state = State.IDLE
    private val selectionRect = RectF()
    private var activeHandle = HandleType.NONE
    private var lastTouchX = 0f
    private var lastTouchY = 0f
    private var startX = 0f
    private var startY = 0f

    // Constants
    private val handleRadius = 22f
    private val handleHitRadius = 52f
    private val minSelectionSize = 120f
    private val buttonHeight = 52f
    private val buttonWidth = 180f
    private val buttonGap = 20f

    // Paints
    private val dimPaint = Paint().apply {
        color = Color.parseColor("#99000000")
        style = Paint.Style.FILL
    }

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#2196F3")
        style = Paint.Style.STROKE
        strokeWidth = 4f
    }

    private val cornerBracketPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 6f
        strokeCap = Paint.Cap.ROUND
    }

    private val handleFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    private val handleStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#2196F3")
        style = Paint.Style.STROKE
        strokeWidth = 3f
    }

    private val instructionPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 42f
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }

    private val subInstructionPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#BBFFFFFF")
        textSize = 28f
        textAlign = Paint.Align.CENTER
    }

    private val captureButtonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#2196F3")
        style = Paint.Style.FILL
    }

    private val cancelButtonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#55FFFFFF")
        style = Paint.Style.FILL
    }

    private val buttonTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 30f
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }

    private val sizeLabelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#CCFFFFFF")
        textSize = 24f
        textAlign = Paint.Align.CENTER
    }

    // Button hit regions
    private val captureButtonRect = RectF()
    private val cancelButtonRect = RectF()
    private val idleCancelRect = RectF()

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val x = event.x
        val y = event.y

        when (event.action) {
            MotionEvent.ACTION_DOWN -> handleActionDown(x, y)
            MotionEvent.ACTION_MOVE -> handleActionMove(x, y)
            MotionEvent.ACTION_UP -> handleActionUp()
        }
        return true
    }

    private fun handleActionDown(x: Float, y: Float) {
        when (state) {
            State.IDLE -> {
                // Check idle cancel button
                if (!idleCancelRect.isEmpty && idleCancelRect.contains(x, y)) {
                    onCancelled()
                    return
                }
                state = State.DRAWING
                startX = x
                startY = y
                selectionRect.set(x, y, x, y)
            }
            State.ADJUSTING -> {
                // Check capture button
                if (!captureButtonRect.isEmpty && captureButtonRect.contains(x, y)) {
                    onCaptureClicked()
                    return
                }
                // Check cancel button
                if (!cancelButtonRect.isEmpty && cancelButtonRect.contains(x, y)) {
                    onCancelled()
                    return
                }
                // Check resize handles
                activeHandle = detectHandle(x, y)
                if (activeHandle == HandleType.NONE) {
                    // Start new selection
                    state = State.DRAWING
                    startX = x
                    startY = y
                    selectionRect.set(x, y, x, y)
                }
                lastTouchX = x
                lastTouchY = y
            }
            else -> {}
        }
    }

    private fun handleActionMove(x: Float, y: Float) {
        when (state) {
            State.DRAWING -> {
                selectionRect.set(
                    min(startX, x), min(startY, y),
                    max(startX, x), max(startY, y)
                )
                invalidate()
            }
            State.ADJUSTING -> {
                val dx = x - lastTouchX
                val dy = y - lastTouchY
                adjustSelection(activeHandle, dx, dy)
                lastTouchX = x
                lastTouchY = y
                invalidate()
            }
            else -> {}
        }
    }

    private fun handleActionUp() {
        when (state) {
            State.DRAWING -> {
                normalizeRect()
                state = if (selectionRect.width() >= minSelectionSize &&
                    selectionRect.height() >= minSelectionSize
                ) {
                    State.ADJUSTING
                } else {
                    selectionRect.setEmpty()
                    State.IDLE
                }
                activeHandle = HandleType.NONE
                invalidate()
            }
            State.ADJUSTING -> {
                activeHandle = HandleType.NONE
                invalidate()
            }
            else -> {}
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()

        when (state) {
            State.IDLE -> drawIdleState(canvas, w, h)
            State.DRAWING -> drawDrawingState(canvas, w, h)
            State.ADJUSTING -> drawAdjustingState(canvas, w, h)
            State.CAPTURED -> { /* Fully transparent */ }
        }
    }

    // ── Drawing states ──────────────────────────────────────────────────

    private fun drawIdleState(canvas: Canvas, w: Float, h: Float) {
        canvas.drawRect(0f, 0f, w, h, dimPaint)
        canvas.drawText("Seret untuk memilih area soal", w / 2, h / 2 - 24, instructionPaint)
        canvas.drawText("Geser jari di layar untuk menggambar kotak seleksi", w / 2, h / 2 + 24, subInstructionPaint)

        // Cancel button at bottom
        val cancelY = h - 130f
        idleCancelRect.set(w / 2 - 100, cancelY, w / 2 + 100, cancelY + 50f)
        canvas.drawRoundRect(idleCancelRect, 25f, 25f, cancelButtonPaint)
        canvas.drawText("Batal", idleCancelRect.centerX(), idleCancelRect.centerY() + 10f, buttonTextPaint)
    }

    private fun drawDrawingState(canvas: Canvas, w: Float, h: Float) {
        drawDimWithCutout(canvas, w, h)
        canvas.drawRect(selectionRect, borderPaint)
        drawCornerBrackets(canvas)
    }

    private fun drawAdjustingState(canvas: Canvas, w: Float, h: Float) {
        drawDimWithCutout(canvas, w, h)
        canvas.drawRect(selectionRect, borderPaint)
        drawCornerBrackets(canvas)

        // Corner handles
        drawHandle(canvas, selectionRect.left, selectionRect.top)
        drawHandle(canvas, selectionRect.right, selectionRect.top)
        drawHandle(canvas, selectionRect.left, selectionRect.bottom)
        drawHandle(canvas, selectionRect.right, selectionRect.bottom)

        // Size label above selection
        val sizeLabel = "${selectionRect.width().toInt()} x ${selectionRect.height().toInt()}"
        canvas.drawText(sizeLabel, selectionRect.centerX(), selectionRect.top - 16f, sizeLabelPaint)

        // Action buttons below selection
        drawActionButtons(canvas, w, h)
    }

    // ── Helper drawing functions ────────────────────────────────────────

    private fun drawDimWithCutout(canvas: Canvas, w: Float, h: Float) {
        // Four rectangles around the selection
        canvas.drawRect(0f, 0f, w, selectionRect.top, dimPaint)
        canvas.drawRect(0f, selectionRect.bottom, w, h, dimPaint)
        canvas.drawRect(0f, selectionRect.top, selectionRect.left, selectionRect.bottom, dimPaint)
        canvas.drawRect(selectionRect.right, selectionRect.top, w, selectionRect.bottom, dimPaint)
    }

    private fun drawCornerBrackets(canvas: Canvas) {
        val bracketLen = min(40f, min(selectionRect.width(), selectionRect.height()) * 0.25f)
        val r = selectionRect

        // Top-left
        canvas.drawLine(r.left, r.top + bracketLen, r.left, r.top, cornerBracketPaint)
        canvas.drawLine(r.left, r.top, r.left + bracketLen, r.top, cornerBracketPaint)
        // Top-right
        canvas.drawLine(r.right - bracketLen, r.top, r.right, r.top, cornerBracketPaint)
        canvas.drawLine(r.right, r.top, r.right, r.top + bracketLen, cornerBracketPaint)
        // Bottom-left
        canvas.drawLine(r.left, r.bottom - bracketLen, r.left, r.bottom, cornerBracketPaint)
        canvas.drawLine(r.left, r.bottom, r.left + bracketLen, r.bottom, cornerBracketPaint)
        // Bottom-right
        canvas.drawLine(r.right - bracketLen, r.bottom, r.right, r.bottom, cornerBracketPaint)
        canvas.drawLine(r.right, r.bottom, r.right, r.bottom - bracketLen, cornerBracketPaint)
    }

    private fun drawHandle(canvas: Canvas, x: Float, y: Float) {
        canvas.drawCircle(x, y, handleRadius, handleFillPaint)
        canvas.drawCircle(x, y, handleRadius, handleStrokePaint)
    }

    private fun drawActionButtons(canvas: Canvas, screenWidth: Float, screenHeight: Float) {
        var buttonY = selectionRect.bottom + 56f
        // Ensure buttons don't go off-screen
        if (buttonY + buttonHeight > screenHeight - 40f) {
            buttonY = selectionRect.top - buttonHeight - 56f
        }

        val captureLeft = screenWidth / 2 - buttonWidth - buttonGap / 2
        captureButtonRect.set(captureLeft, buttonY, captureLeft + buttonWidth, buttonY + buttonHeight)
        canvas.drawRoundRect(captureButtonRect, 28f, 28f, captureButtonPaint)
        canvas.drawText("Tangkap", captureButtonRect.centerX(), captureButtonRect.centerY() + 10f, buttonTextPaint)

        val cancelLeft = screenWidth / 2 + buttonGap / 2
        cancelButtonRect.set(cancelLeft, buttonY, cancelLeft + buttonWidth, buttonY + buttonHeight)
        canvas.drawRoundRect(cancelButtonRect, 28f, 28f, cancelButtonPaint)
        canvas.drawText("Batal", cancelButtonRect.centerX(), cancelButtonRect.centerY() + 10f, buttonTextPaint)
    }

    // ── Handle detection & adjustment ───────────────────────────────────

    private fun detectHandle(x: Float, y: Float): HandleType {
        val r = selectionRect
        if (dist(x, y, r.left, r.top) < handleHitRadius) return HandleType.TOP_LEFT
        if (dist(x, y, r.right, r.top) < handleHitRadius) return HandleType.TOP_RIGHT
        if (dist(x, y, r.left, r.bottom) < handleHitRadius) return HandleType.BOTTOM_LEFT
        if (dist(x, y, r.right, r.bottom) < handleHitRadius) return HandleType.BOTTOM_RIGHT
        if (r.contains(x, y)) return HandleType.MOVE
        return HandleType.NONE
    }

    private fun adjustSelection(handle: HandleType, dx: Float, dy: Float) {
        when (handle) {
            HandleType.TOP_LEFT -> {
                selectionRect.left += dx
                selectionRect.top += dy
            }
            HandleType.TOP_RIGHT -> {
                selectionRect.right += dx
                selectionRect.top += dy
            }
            HandleType.BOTTOM_LEFT -> {
                selectionRect.left += dx
                selectionRect.bottom += dy
            }
            HandleType.BOTTOM_RIGHT -> {
                selectionRect.right += dx
                selectionRect.bottom += dy
            }
            HandleType.MOVE -> selectionRect.offset(dx, dy)
            HandleType.NONE -> {}
        }
        enforceMinimumSize()
    }

    private fun enforceMinimumSize() {
        if (selectionRect.width() < minSelectionSize) {
            selectionRect.right = selectionRect.left + minSelectionSize
        }
        if (selectionRect.height() < minSelectionSize) {
            selectionRect.bottom = selectionRect.top + minSelectionSize
        }
    }

    private fun normalizeRect() {
        val l = min(selectionRect.left, selectionRect.right)
        val t = min(selectionRect.top, selectionRect.bottom)
        val r = max(selectionRect.left, selectionRect.right)
        val b = max(selectionRect.top, selectionRect.bottom)
        selectionRect.set(l, t, r, b)
    }

    private fun dist(x1: Float, y1: Float, x2: Float, y2: Float): Float {
        val dx = x1 - x2
        val dy = y1 - y2
        return sqrt((dx * dx + dy * dy).toDouble()).toFloat()
    }

    // ── Actions ─────────────────────────────────────────────────────────

    private fun onCaptureClicked() {
        state = State.CAPTURED
        invalidate()

        // Normalize selection rect to 0..1 screen coordinates
        val normalizedRect = RectF(
            selectionRect.left / width,
            selectionRect.top / height,
            selectionRect.right / width,
            selectionRect.bottom / height
        )
        onRegionSelected(normalizedRect)
    }

    fun resetState() {
        state = State.IDLE
        selectionRect.setEmpty()
        activeHandle = HandleType.NONE
        captureButtonRect.setEmpty()
        cancelButtonRect.setEmpty()
        idleCancelRect.setEmpty()
        invalidate()
    }
}
