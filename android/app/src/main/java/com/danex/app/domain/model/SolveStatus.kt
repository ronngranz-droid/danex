package com.danex.app.domain.model

enum class SolveStatus(val displayName: String, val isTerminal: Boolean, val isError: Boolean) {
    IDLE("Siap", true, false),
    READING("Membaca soal...", false, false),
    UNDERSTANDING("Menganalisis pertanyaan...", false, false),
    SOLVING("Menyelesaikan soal...", false, false),
    VERIFYING("Memvalidasi hasil...", false, false),
    SUCCESS("Selesai", true, false),
    INCOMPLETE_QUESTION("Area soal belum lengkap. Sertakan pertanyaan dan semua pilihan jawaban.", true, true),
    OPTIONS_INCOMPLETE("Pilihan jawaban tidak lengkap atau terpotong.", true, true),
    LOW_CONFIDENCE("Tingkat keyakinan rendah. Periksa kembali kejelasan teks soal.", true, true),
    CAPTURE_NOT_ALLOWED("Aplikasi ini membatasi tangkapan layar. Gunakan Camera Scan atau ketik soal.", true, true),
    OCR_FAILED("Gagal mengenali teks. Coba gunakan Vision AI atau foto ulang.", true, true),
    NO_INTERNET("Tidak ada koneksi internet. Periksa jaringan Anda.", true, true),
    RATE_LIMITED("Batas permintaan tercapai. Silakan coba sesaat lagi.", true, true),
    SERVER_ERROR("Terjadi kendala pada server penyelesai.", true, true),
    ERROR("Terjadi kesalahan yang tidak terduga.", true, true)
}
