package com.danex.app.features.floating

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.danex.app.MainActivity
import com.danex.app.domain.model.SolveResult
import kotlin.math.abs

/**
 * A floating, draggable card that overlays other applications displaying
 * quick academic solutions with step expansion and dismissal.
 */
@SuppressLint("ViewConstructor")
class FloatingResultView(
    context: Context,
    private val result: SolveResult,
    private val onDismiss: () -> Unit
) : LinearLayout(context) {

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false

    init {
        orientation = VERTICAL
        val paddingPx = dpToPx(16)
        setPadding(paddingPx, paddingPx, paddingPx, paddingPx)

        // Background styling: Dark surface with rounded corners and border
        val backgroundDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dpToPx(16).toFloat()
            setColor(Color.parseColor("#1E293B")) // Slate 800
            setStroke(dpToPx(1), Color.parseColor("#334155")) // Slate 700
        }
        background = backgroundDrawable
        elevation = dpToPx(8).toFloat()

        buildViewHierarchy()
    }

    private fun buildViewHierarchy() {
        // ── Header Row (Subject Tag + Mode + Close Button) ──
        val headerRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }

        val subjectBadge = TextView(context).apply {
            text = result.subject.displayName
            textSize = 11f
            setTextColor(Color.parseColor("#38BDF8")) // Sky 400
            val badgeBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(6).toFloat()
                setColor(Color.parseColor("#0C4A6E")) // Sky 900
            }
            background = badgeBg
            val hPad = dpToPx(8)
            val vPad = dpToPx(3)
            setPadding(hPad, vPad, hPad, vPad)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }
        headerRow.addView(subjectBadge)

        val spacer = View(context).apply {
            layoutParams = LayoutParams(0, 1, 1f)
        }
        headerRow.addView(spacer)

        val closeButton = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#94A3B8"))
            layoutParams = LayoutParams(dpToPx(28), dpToPx(28))
            setOnClickListener { onDismiss() }
        }
        headerRow.addView(closeButton)
        addView(headerRow)

        // ── Question snippet ──
        val questionView = TextView(context).apply {
            text = result.questionExtracted
            textSize = 13f
            setTextColor(Color.parseColor("#E2E8F0"))
            maxLines = 2
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = dpToPx(8)
            }
        }
        addView(questionView)

        // ── Highlighted Short Answer ──
        val answerView = TextView(context).apply {
            text = result.formattedShortNotification
            textSize = 16f
            setTextColor(Color.parseColor("#10B981")) // Emerald 500
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = dpToPx(8)
            }
        }
        addView(answerView)

        // ── Scrollable explanation if present ──
        if (result.explanation.isNotBlank()) {
            val scrollView = ScrollView(context).apply {
                layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(100)).apply {
                    topMargin = dpToPx(8)
                }
            }
            val explanationView = TextView(context).apply {
                text = result.explanation
                textSize = 12f
                setTextColor(Color.parseColor("#94A3B8")) // Slate 400
                setLineSpacing(0f, 1.2f)
            }
            scrollView.addView(explanationView)
            addView(scrollView)
        }

        // ── Action Row (Buka Solusi Lengkap) ──
        val openAppButton = Button(context).apply {
            text = "Buka Solusi Lengkap"
            textSize = 12f
            setTextColor(Color.WHITE)
            val btnBg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(8).toFloat()
                setColor(Color.parseColor("#2563EB")) // Blue 600
            }
            background = btnBg
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, dpToPx(38)).apply {
                topMargin = dpToPx(10)
            }
            setOnClickListener {
                val intent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                context.startActivity(intent)
                onDismiss()
            }
        }
        addView(openAppButton)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val params = layoutParams as WindowManager.LayoutParams

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                initialX = params.x
                initialY = params.y
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                isDragging = false
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = (event.rawX - initialTouchX).toInt()
                val dy = (event.rawY - initialTouchY).toInt()
                if (!isDragging && (abs(dx) > 10 || abs(dy) > 10)) {
                    isDragging = true
                }
                if (isDragging) {
                    params.x = initialX + dx
                    params.y = initialY + dy
                    wm.updateViewLayout(this, params)
                }
                return true
            }
            MotionEvent.ACTION_UP -> {
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun dpToPx(dp: Int): Int {
        val density = context.resources.displayMetrics.density
        return (dp * density).toInt()
    }

    companion object {
        fun createLayoutParams(context: Context): WindowManager.LayoutParams {
            val widthPx = (context.resources.displayMetrics.widthPixels * 0.90f).toInt()
            return WindowManager.LayoutParams(
                widthPx,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER_HORIZONTAL or Gravity.TOP
                y = 120
            }
        }
    }
}
