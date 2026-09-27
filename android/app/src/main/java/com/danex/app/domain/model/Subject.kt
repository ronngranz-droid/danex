package com.danex.app.domain.model

enum class Subject(val id: String, val displayName: String, val category: String) {
    MATHEMATICS("mathematics", "Matematika", "STEM"),
    PHYSICS("physics", "Fisika", "STEM"),
    CHEMISTRY("chemistry", "Kimia", "STEM"),
    BIOLOGY("biology", "Biologi", "STEM"),
    INDONESIAN("indonesian", "Bahasa Indonesia", "Language"),
    ENGLISH("english", "Bahasa Inggris", "Language"),
    HISTORY("history", "Sejarah", "Humanities"),
    GEOGRAPHY("geography", "Geografi", "Social"),
    ECONOMICS("economics", "Ekonomi", "Social"),
    ACCOUNTING("accounting", "Akuntansi", "Social"),
    INFORMATICS("informatics", "Informatika", "Technology"),
    PROGRAMMING("programming", "Pemrograman", "Technology"),
    GENERAL("general", "Umum", "General");

    companion object {
        fun fromString(value: String?): Subject {
            return entries.firstOrNull { 
                it.id.equals(value, ignoreCase = true) || it.name.equals(value, ignoreCase = true) 
            } ?: GENERAL
        }
    }
}
