package com.danex.app.domain.model

enum class QuestionType(val id: String, val displayName: String) {
    MULTIPLE_CHOICE("multiple_choice", "Pilihan Ganda"),
    MULTIPLE_ANSWER("multiple_answer", "Pilihan Ganda Kompleks"),
    TRUE_FALSE("true_false", "Benar / Salah"),
    SHORT_ANSWER("short_answer", "Isian Singkat"),
    ESSAY("essay", "Uraian / Esai"),
    CALCULATION("calculation", "Perhitungan"),
    DEFINITION("definition", "Definisi / Konsep"),
    TRANSLATION("translation", "Terjemahan"),
    PROGRAMMING("programming", "Kode / Pemrograman"),
    GENERAL_QA("general_qa", "Tanya Jawab Umum");

    companion object {
        fun fromString(value: String?): QuestionType {
            return entries.firstOrNull { 
                it.id.equals(value, ignoreCase = true) || it.name.equals(value, ignoreCase = true) 
            } ?: GENERAL_QA
        }
    }
}
