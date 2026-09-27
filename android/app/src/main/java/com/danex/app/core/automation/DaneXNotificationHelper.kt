package com.danex.app.core.automation

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.danex.app.MainActivity
import com.danex.app.domain.model.SolveResult

object DaneXNotificationHelper {

    const val CHANNEL_SOLUTIONS = "danex_solutions_channel"
    const val NOTIFICATION_ID_BASE = 1000

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_SOLUTIONS,
                "Solusi Belajar DaneX",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifikasi saat jawaban dan solusi soal selesai diproses"
                enableVibration(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun showSolutionNotification(context: Context, result: SolveResult) {
        createNotificationChannels(context)

        // Content intent: Open MainActivity
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            result.id.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Copy action intent
        val copyIntent = Intent(context, CopyAnswerReceiver::class.java).apply {
            putExtra(CopyAnswerReceiver.EXTRA_ANSWER_TEXT, result.formattedShortNotification)
        }
        val copyPendingIntent = PendingIntent.getBroadcast(
            context,
            result.id.hashCode() + 1,
            copyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = "${result.subject.displayName} • ${result.formattedShortNotification}"
        val text = result.explanation.take(160)

        val notification = NotificationCompat.Builder(context, CHANNEL_SOLUTIONS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText("${result.questionExtracted}\n\n${result.explanation}"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openPendingIntent)
            .setAutoCancel(true)
            .addAction(
                android.R.drawable.ic_menu_save,
                "Salin Jawaban",
                copyPendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_view,
                "Buka Solusi",
                openPendingIntent
            )
            .build()

        try {
            val manager = NotificationManagerCompat.from(context)
            manager.notify(NOTIFICATION_ID_BASE + (result.id.hashCode() % 1000), notification)
        } catch (_: SecurityException) {
            // Permission POST_NOTIFICATIONS not granted
        }
    }
}
