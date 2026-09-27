package com.danex.app.features.floating

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.view.WindowManager
import com.danex.app.domain.model.SolveResult

object FloatingResultManager {

    private var activeFloatingView: FloatingResultView? = null

    fun showFloatingResult(context: Context, result: SolveResult) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            return
        }

        val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return

        // Dismiss existing floating card if any
        dismiss()

        val floatingView = FloatingResultView(
            context = context,
            result = result,
            onDismiss = { dismiss() }
        )

        val params = FloatingResultView.createLayoutParams(context)

        try {
            wm.addView(floatingView, params)
            activeFloatingView = floatingView
        } catch (_: Exception) {
            // WindowManager permission or lifecycle error
        }
    }

    fun dismiss() {
        activeFloatingView?.let { view ->
            try {
                val wm = view.context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                wm.removeView(view)
            } catch (_: Exception) {}
        }
        activeFloatingView = null
    }

    fun isShowing(): Boolean = activeFloatingView != null
}
