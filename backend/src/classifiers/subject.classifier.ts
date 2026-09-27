import { SubjectType } from '../types/solver.types';

export class SubjectClassifier {
  static detectSubject(text: string): SubjectType {
    const lower = text.toLowerCase();

    // Programming markers
    if (
      /\b(def |function|console\.log|import |class |public static void|array|var |let |const |<html>|<script>|syntax error|debugging|python|javascript|php|sql|select \* from)\b/i.test(lower) ||
      lower.includes('output dari program') ||
      lower.includes('kode berikut')
    ) {
      return 'programming';
    }

    // Chemistry markers
    if (
      /\b(mol|molaritas|larutan|asam|basa|ph|senyawa|unsur|isotop|reaksi kimia|oksidasi|reduksi|stoikiometri|ikatan kovalen|ikatan ion|h2o|co2|nacl|h2so4|ch4)\b/i.test(lower) ||
      lower.includes('setarakan reaksi')
    ) {
      return 'chemistry';
    }

    // Physics markers
    if (
      /\b(kecepatan|percepatan|massa|gravitasi|gaya newton|energi kinetik|energi potensial|hambatan|resistor|ohm|tegangan listrik|medan magnet|frekuensi|panjang gelombang|termodinamika|joule|watt)\b/i.test(lower) ||
      /\b(m\/s|m\/s\^2|kg m\/s)\b/.test(lower)
    ) {
      return 'physics';
    }

    // Biology markers
    if (
      /\b(organel|mitokondria|ribosom|kloroplas|nukleus|dna|rna|sel hewan|sel tumbuhan|fotosintesis|respirasi seluler|enzim|kromosom|ekosistem|rantai makanan|populasi|genetika|meiosis|mitosis)\b/i.test(lower)
    ) {
      return 'biology';
    }

    // Mathematics markers
    if (
      /\b(akar|kuadrat|integral|turunan|limit|trigonometri|sinus|cosinus|tangen|matriks|vektor|logaritma|persamaan kuadrat|faktorisasi|gradien|median|modus|aljabar|geometri|peluang)\b/i.test(lower) ||
      /[0-9]+\s*[\+\-\*\/=]\s*[0-9]+/.test(lower) ||
      lower.includes('\\frac') ||
      lower.includes('x^2')
    ) {
      return 'mathematics';
    }

    // Accounting & Economics markers
    if (/\b(jurnal umum|debit|kredit|neraca saldo|laporan laba rugi|buku besar|aktiva|pasiva)\b/i.test(lower)) {
      return 'accounting';
    }
    if (/\b(inflasi|permintaan|penawaran|kurva|pdb|suku bunga|kebijakan moneter|fiskal|pasar monopoli|elastisitas)\b/i.test(lower)) {
      return 'economics';
    }

    // Geography markers
    if (/\b(lempeng tektonik|vulkanisme|seisme|iklim|cuaca|kartografi|sungai|danau|litosfer|hidrosfer|atmosfer)\b/i.test(lower)) {
      return 'geography';
    }

    // History markers
    if (/\b(perang dunia|proklamasi|kemerdekaan|kerajaan majapahit|voc|revolusi|perjanjian renville|bpupki|orde baru|reformasi)\b/i.test(lower)) {
      return 'history';
    }

    // Indonesian language markers
    if (/\b(majas|gagasan utama|ide pokok|kalimat efektif|kalimat utama|kata baku|antonim|sinonim|teks eksposisi|teks narasi|cerpen)\b/i.test(lower)) {
      return 'indonesian';
    }

    // English language markers
    if (/\b(tenses|passive voice|conditional sentence|narrative text|recount text|adjective clause|direct speech)\b/i.test(lower)) {
      return 'english';
    }

    return 'general';
  }
}
