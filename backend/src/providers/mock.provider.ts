import { FollowUpMessage, SolverContext, SolverRawResponse } from '../types/solver.types';
import { SolverProvider } from './solver-provider.interface';

export class MockSolverProvider implements SolverProvider {
  readonly id = 'mock-provider';
  readonly name = 'DaneX Deterministic Mock Solver';

  async solveText(prompt: string, context: SolverContext): Promise<SolverRawResponse> {
    const lower = prompt.toLowerCase();

    let outputJson: any;

    // Test case: Incomplete question
    if (lower.includes('soal incomplete') || lower.includes('[incomplete]') || (lower.includes('pilihan jawaban:') && !lower.includes('b.') && !lower.includes('c.'))) {
      outputJson = {
        status: 'INCOMPLETE_QUESTION',
        subject: context.subject || 'general',
        questionType: 'multiple_choice',
        language: context.language || 'id',
        questionExtracted: prompt,
        options: [],
        answerOption: null,
        answer: 'Area soal belum lengkap. Sertakan pertanyaan dan semua pilihan jawaban.',
        shortAnswer: 'Soal Belum Lengkap',
        explanation: 'Format pertanyaan atau pilihan jawaban terpotong sehingga sistem menolak menebak hasil.',
        steps: [],
        confidence: 0.1,
        warnings: ['Pilihan jawaban tidak lengkap']
      };
    }
    // Test case: Biology MCQ
    else if (lower.includes('atp') || lower.includes('organel') || lower.includes('mitokondria')) {
      const isQuick = context.mode === 'QUICK';
      outputJson = {
        status: 'SUCCESS',
        subject: 'biology',
        questionType: 'multiple_choice',
        language: context.language || 'id',
        questionExtracted: 'Organel sel manakah yang berfungsi menghasilkan energi utama berupa ATP?',
        options: [
          { key: 'A', text: 'Nukleus' },
          { key: 'B', text: 'Ribosom' },
          { key: 'C', text: 'Mitokondria' },
          { key: 'D', text: 'Lisosom' },
          { key: 'E', text: 'Badan Golgi' }
        ],
        answerOption: 'C',
        answer: 'Mitokondria',
        shortAnswer: 'C — Mitokondria',
        explanation: isQuick
          ? 'Mitokondria adalah tempat utama respirasi seluler dan sintesis ATP.'
          : 'Mitokondria sering disebut sebagai "the powerhouse of the cell" karena organel ini melangsungkan siklus Krebs dan rantai transpor elektron yang memproduksi sebagian besar molekul ATP sel.',
        steps: isQuick
          ? []
          : [
              '1. Mengidentifikasi fungsi organel: respirasi sel dan produksi energi.',
              '2. Nukleus menyimpan materi genetik (DNA).',
              '3. Ribosom menyintesis protein.',
              '4. Mitokondria mengoksidasi nutrien untuk menghasilkan adenosin trifosfat (ATP).',
              '5. Maka pilihan yang tepat adalah C.'
            ],
        latex: null,
        confidence: 0.98,
        warnings: []
      };
    }
    // Test case: Mathematics calculation & LaTeX
    else if (lower.includes('kuadrat') || lower.includes('akar') || lower.includes('integral') || lower.includes('math') || lower.includes('x^2')) {
      outputJson = {
        status: 'SUCCESS',
        subject: 'mathematics',
        questionType: 'calculation',
        language: context.language || 'id',
        questionExtracted: 'Tentukan akar-akar persamaan kuadrat x^2 - 5x + 6 = 0',
        options: [
          { key: 'A', text: 'x = 1 atau x = 6' },
          { key: 'B', text: 'x = 2 atau x = 3' },
          { key: 'C', text: 'x = -2 atau x = -3' },
          { key: 'D', text: 'x = -1 atau x = -6' }
        ],
        answerOption: 'B',
        answer: 'x = 2 atau x = 3',
        shortAnswer: 'x = 2 atau x = 3',
        explanation: 'Faktorisasi persamaan x^2 - 5x + 6 = (x - 2)(x - 3) = 0.',
        steps: [
          'Persamaan: x^2 - 5x + 6 = 0',
          'Cari dua bilangan dengan hasil kali 6 dan jumlah -5: yaitu -2 dan -3',
          '(x - 2)(x - 3) = 0',
          'x_1 = 2 atau x_2 = 3'
        ],
        latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\implies x_1 = 2, \\, x_2 = 3',
        confidence: 0.99,
        warnings: []
      };
    }
    // Test case: Chemistry Reaction
    else if (lower.includes('reaksi') || lower.includes('kimia') || lower.includes('h2o') || lower.includes('co2')) {
      outputJson = {
        status: 'SUCCESS',
        subject: 'chemistry',
        questionType: 'calculation',
        language: context.language || 'id',
        questionExtracted: 'Setarakan persamaan reaksi pembakaran gas hidrogen dalam oksigen',
        options: [],
        answerOption: null,
        answer: '2H₂ + O₂ → 2H₂O',
        shortAnswer: '2H₂ + O₂ → 2H₂O',
        explanation: 'Untuk menyetarakan atom hidrogen dan oksigen, diperlukan koefisien 2 pada H2 dan 2 pada H2O.',
        steps: [
          'Reaksi belum setara: H₂ + O₂ → H₂O',
          'Jumlah O di kiri = 2, di kanan = 1. Tambahkan koefisien 2 pada H₂O: H₂ + O₂ → 2H₂O',
          'Jumlah H di kanan menjadi 4, tambahkan koefisien 2 pada H₂: 2H₂ + O₂ → 2H₂O'
        ],
        latex: '2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}',
        confidence: 0.97,
        warnings: []
      };
    }
    // Test case: Programming
    else if (lower.includes('python') || lower.includes('javascript') || lower.includes('fungsi') || lower.includes('code') || lower.includes('array')) {
      outputJson = {
        status: 'SUCCESS',
        subject: 'programming',
        questionType: 'programming',
        language: context.language || 'id',
        questionExtracted: 'Buat fungsi Python untuk menghitung jumlah elemen dalam array/list',
        options: [],
        answerOption: null,
        answer: 'Gunakan fungsi sum() atau iterasi for loop.',
        shortAnswer: 'sum(numbers)',
        explanation: 'Fungsi bawaan Python sum() menghitung total seluruh elemen numerik dalam iterable dengan kompleksitas waktu O(n).',
        steps: [
          'Definisikan fungsi dengan parameter list angka.',
          'Gunakan sum(numbers) untuk pendekatan idomatis.',
          'Kembalikan hasil penjumlahan.'
        ],
        codeSnippet: {
          language: 'python',
          code: 'def hitung_total(angka: list[int]) -> int:\n    return sum(angka)\n\nprint(hitung_total([10, 20, 30])) # Output: 60'
        },
        latex: null,
        confidence: 0.99,
        warnings: []
      };
    }
    // General fallback
    else {
      outputJson = {
        status: 'SUCCESS',
        subject: context.subject || 'general',
        questionType: context.questionType || 'general_qa',
        language: context.language || 'id',
        questionExtracted: prompt,
        options: [],
        answerOption: null,
        answer: 'Jawaban atas pertanyaan: ' + prompt,
        shortAnswer: prompt.slice(0, 30),
        explanation: 'Penjelasan terstruktur untuk membantu pemahaman konsep belajar.',
        steps: ['Langkah 1: Analisis pertanyaan.', 'Langkah 2: Perumusan jawaban akademis terverifikasi.'],
        latex: null,
        confidence: 0.95,
        warnings: []
      };
    }

    const rawText = JSON.stringify(outputJson);
    const inputTokens = Math.max(15, Math.ceil(prompt.length / 4));
    const outputTokens = Math.max(25, Math.ceil(rawText.length / 4));

    return {
      rawText,
      inputTokens,
      outputTokens,
      model: 'mock-academic-v1'
    };
  }

  async solveImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    context: SolverContext
  ): Promise<SolverRawResponse> {
    const inputPrompt = prompt || 'Analisis diagram atau soal dalam gambar';
    const result = await this.solveText(inputPrompt, context);
    return {
      ...result,
      inputTokens: result.inputTokens + 250, // Image vision token cost estimate
      model: 'mock-vision-v1'
    };
  }

  async solveFollowUp(
    history: FollowUpMessage[],
    context: SolverContext
  ): Promise<SolverRawResponse> {
    const lastUserMessage = history.filter(h => h.role === 'user').pop()?.content || 'Penjelasan lebih lanjut';
    
    const outputJson = {
      status: 'SUCCESS',
      subject: context.subject || 'general',
      questionType: 'general_qa',
      language: context.language || 'id',
      questionExtracted: lastUserMessage,
      options: [],
      answerOption: null,
      answer: `Penjelasan mendalam untuk: "${lastUserMessage}"`,
      shortAnswer: 'Penjelasan Tambahan',
      explanation: 'Konsep ini penting dipahami dengan melihat hubungan sebab-akibat antar komponen soal.',
      steps: [
        'Konsep Dasar: Perhatikan prinsip fundamental materi.',
        'Aplikasi: Terapkan rumus atau konsep langsung pada variabel soal.',
        'Kesimpulan: Hasil ini konsisten dengan hukum keilmuan terkait.'
      ],
      latex: null,
      confidence: 0.96,
      warnings: []
    };

    const rawText = JSON.stringify(outputJson);
    return {
      rawText,
      inputTokens: 120,
      outputTokens: 180,
      model: 'mock-academic-v1'
    };
  }
}
