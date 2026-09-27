import { DaneXStructuredOutput, DaneXStructuredOutputSchema } from '../schemas/solver.schema';
import { SolverRawResponse } from '../types/solver.types';

export class AnswerValidator {
  static validate(rawResponse: SolverRawResponse): DaneXStructuredOutput {
    let parsed: any;

    try {
      let jsonString = rawResponse.rawText.trim();
      // Remove markdown code fences if model enclosed JSON in ```json ... ```
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsed = JSON.parse(jsonString);
    } catch (parseError: any) {
      return {
        status: 'ERROR',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: 'Format respon tidak dapat diparsing',
        options: [],
        answerOption: null,
        answer: 'Terjadi kesalahan format saat memproses jawaban AI.',
        shortAnswer: 'Gagal Memproses Respon',
        explanation: 'AI mengembalikan output yang tidak sesuai format JSON standar.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: ['JSON parse error: ' + parseError.message]
      };
    }

    // Validate with Zod
    const validationResult = DaneXStructuredOutputSchema.safeParse(parsed);

    if (!validationResult.success) {
      const issues = validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return {
        status: 'ERROR',
        subject: parsed.subject || 'general',
        questionType: parsed.questionType || 'general_qa',
        language: parsed.language || 'id',
        questionExtracted: parsed.questionExtracted || '',
        options: parsed.options || [],
        answerOption: parsed.answerOption || null,
        answer: parsed.answer || 'Validasi schema gagal.',
        shortAnswer: 'Schema Invalid',
        explanation: 'Respon solver tidak memenuhi schema DaneX standar.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0.2,
        warnings: issues
      };
    }

    const data = validationResult.data;

    // MCQ Consistency Verification:
    if (data.questionType === 'multiple_choice' && data.options && data.options.length > 0) {
      if (data.answerOption) {
        const optionExists = data.options.some(
          opt => opt.key.toUpperCase() === data.answerOption?.toUpperCase()
        );
        if (!optionExists) {
          data.warnings.push(
            `Kunci jawaban '${data.answerOption}' tidak ditemukan di daftar pilihan ${data.options.map(o => o.key).join(', ')}.`
          );
          if (data.status === 'SUCCESS') {
            data.status = 'LOW_CONFIDENCE';
          }
        }
      }

      // If MCQ has only 1 option or options are truncated
      if (data.options.length < 2 && data.status === 'SUCCESS') {
        data.status = 'OPTIONS_INCOMPLETE';
        data.warnings.push('Pilihan jawaban kurang dari 2. Kemungkinan area soal terpotong.');
      }
    }

    // Confidence threshold guard
    if (data.confidence < 0.6 && data.status === 'SUCCESS') {
      data.status = 'LOW_CONFIDENCE';
      data.warnings.push('Tingkat keyakinan solver di bawah ambang batas (60%).');
    }

    return data;
  }
}
