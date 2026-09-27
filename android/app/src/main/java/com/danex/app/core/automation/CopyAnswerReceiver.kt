package com.danex.app.core.automation

import android.content.BroadcastReceiver
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast

class CopyAnswerReceiver : BroadcastReceiver() {

    companion object {
        const val EXTRA_ANSWER_TEXT = "extra_answer_text"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val answerText = intent.getStringExtra(EXTRA_ANSWER_TEXT) ?: return
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("DaneX Answer", answerText)
        clipboard.setPrimaryClip(clip)

        Toast.makeText(context, "Jawaban disalin ke papan klip", Toast.LENGTH_SHORT).show()
    }
}
