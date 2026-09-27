package com.danex.app.domain.model

enum class SolveMode(val id: String, val displayName: String, val description: String) {
    QUICK(
        id = "QUICK",
        displayName = "Mode Cepat",
        description = "Jawaban instan langsung ke inti dengan penjelasan minimal."
    ),
    LEARN(
        id = "LEARN",
        displayName = "Mode Belajar",
        description = "Langkah penyelesaian lengkap, konsep materi, dan rumus terkait."
    );

    companion object {
        fun fromString(value: String?): SolveMode {
            return entries.firstOrNull { 
                it.id.equals(value, ignoreCase = true) 
            } ?: QUICK
        }
    }
}
