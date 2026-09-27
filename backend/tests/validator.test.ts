import { describe, it, expect } from 'vitest';
import { AnswerValidator } from '../src/validators/answer.validator';
import { SolverRawResponse } from '../src/types/solver.types';

describe('AnswerValidator Test Suite', () => {
  it('validates a correct structured JSON response', () => {
    const raw: SolverRawResponse = {
      rawText: JSON.stringify({
        status: 'SUCCESS',
        subject: 'biology',
        questionType: 'multiple_choice',
        language: 'id',
        questionExtracted: 'Organel penghasil ATP',
        options: [
          { key: 'A', text: 'Nukleus' },
          { key: 'B', text: 'Ribosom' },
          { key: 'C', text: 'Mitokondria' }
        ],
        answerOption: 'C',
        answer: 'Mitokondria',
        shortAnswer: 'C — Mitokondria',
        explanation: 'Mitokondria adalah respirasi sel.',
        steps: ['Langkah 1'],
        latex: null,
        confidence: 0.95,
        warnings: []
      }),
      inputTokens: 20,
      outputTokens: 40,
      model: 'test-model'
    };

    const validated = AnswerValidator.validate(raw);
    expect(validated.status).toBe('SUCCESS');
    expect(validated.answerOption).toBe('C');
    expect(validated.answer).toBe('Mitokondria');
    expect(validated.confidence).toBe(0.95);
  });

  it('strips markdown code blocks (```json ... ```)', () => {
    const raw: SolverRawResponse = {
      rawText: '```json\n{"status":"SUCCESS","subject":"mathematics","questionType":"calculation","language":"id","questionExtracted":"2+2","options":[],"answer":"4","shortAnswer":"4","explanation":"2+2=4","steps":[],"confidence":0.99,"warnings":[]}\n```',
      inputTokens: 10,
      outputTokens: 20,
      model: 'test-model'
    };

    const validated = AnswerValidator.validate(raw);
    expect(validated.status).toBe('SUCCESS');
    expect(validated.answer).toBe('4');
  });

  it('handles malformed JSON gracefully', () => {
    const raw: SolverRawResponse = {
      rawText: 'This is not JSON at all! Just raw plain text.',
      inputTokens: 10,
      outputTokens: 10,
      model: 'test-model'
    };

    const validated = AnswerValidator.validate(raw);
    expect(validated.status).toBe('ERROR');
    expect(validated.shortAnswer).toBe('Gagal Memproses Respon');
    expect(validated.warnings.length).toBeGreaterThan(0);
  });

  it('downgrades status to LOW_CONFIDENCE if confidence < 0.6', () => {
    const raw: SolverRawResponse = {
      rawText: JSON.stringify({
        status: 'SUCCESS',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: 'Soal buram',
        options: [],
        answer: 'Kemungkinan X',
        shortAnswer: 'X',
        explanation: 'Kurang yakin karena teks buram',
        steps: [],
        confidence: 0.45,
        warnings: []
      }),
      inputTokens: 10,
      outputTokens: 20,
      model: 'test-model'
    };

    const validated = AnswerValidator.validate(raw);
    expect(validated.status).toBe('LOW_CONFIDENCE');
    expect(validated.warnings.some(w => w.includes('ambang batas'))).toBe(true);
  });

  it('detects missing MCQ option key and flags LOW_CONFIDENCE', () => {
    const raw: SolverRawResponse = {
      rawText: JSON.stringify({
        status: 'SUCCESS',
        subject: 'biology',
        questionType: 'multiple_choice',
        language: 'id',
        questionExtracted: 'Soal',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' }
        ],
        answerOption: 'E', // E is not in options A or B!
        answer: 'Option E',
        shortAnswer: 'E',
        explanation: 'Penjelasan',
        steps: [],
        confidence: 0.9,
        warnings: []
      }),
      inputTokens: 10,
      outputTokens: 20,
      model: 'test-model'
    };

    const validated = AnswerValidator.validate(raw);
    expect(validated.status).toBe('LOW_CONFIDENCE');
    expect(validated.warnings.some(w => w.includes('tidak ditemukan'))).toBe(true);
  });
});
