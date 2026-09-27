package com.danex.app.ui.katex

import android.annotation.SuppressLint
import android.graphics.Color
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun KatexView(
    latex: String,
    modifier: Modifier = Modifier,
    isDarkTheme: Boolean = isSystemInDarkTheme()
) {
    val cleanLatex = remember(latex) {
        latex
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", " ")
            .trim()
    }

    AndroidView(
        factory = { context ->
            WebView(context).apply {
                setBackgroundColor(Color.TRANSPARENT)
                setLayerType(WebView.LAYER_TYPE_HARDWARE, null)
                settings.javaScriptEnabled = true
                settings.allowFileAccess = true
                settings.domStorageEnabled = true
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = true

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        val js = "renderLatex('$cleanLatex', $isDarkTheme);"
                        view?.evaluateJavascript(js, null)
                    }
                }

                loadUrl("file:///android_asset/katex/template.html")
            }
        },
        update = { webView ->
            val js = "renderLatex('$cleanLatex', $isDarkTheme);"
            webView.evaluateJavascript(js, null)
        },
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 60.dp, max = 220.dp)
    )
}
