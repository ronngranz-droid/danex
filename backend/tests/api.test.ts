import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { MockSolverProvider } from '../src/providers/mock.provider';
import { SlidingWindowRateLimiter } from '../src/ratelimit/rate-limiter';
import { globalUsageTracker } from '../src/usage/tracker';

describe('DaneX Backend API Integration Tests', () => {
  let app: any;
  let provider: MockSolverProvider;

  beforeEach(() => {
    provider = new MockSolverProvider();
    const rateLimiter = new SlidingWindowRateLimiter(100, 60000);
    app = createApp({ provider, rateLimiter });
    globalUsageTracker.reset();
  });

  it('GET /api/v1/health returns healthy status and active provider', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.activeProvider.id).toBe('mock-provider');
  });

  it('POST /api/v1/solve/text solves Biology MCQ accurately', async () => {
    const res = await request(app)
      .post('/api/v1/solve/text')
      .send({
        prompt: 'Organel sel manakah yang berfungsi menghasilkan energi ATP?',
        mode: 'QUICK'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.subject).toBe('biology');
    expect(res.body.questionType).toBe('multiple_choice');
    expect(res.body.answerOption).toBe('C');
    expect(res.body.answer).toBe('Mitokondria');
    expect(res.body.shortAnswer).toBe('C — Mitokondria');
    expect(res.body.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('POST /api/v1/solve/text solves Mathematics problem with standard LaTeX', async () => {
    const res = await request(app)
      .post('/api/v1/solve/text')
      .send({
        prompt: 'Tentukan akar-akar persamaan kuadrat x^2 - 5x + 6 = 0',
        mode: 'LEARN'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.subject).toBe('mathematics');
    expect(res.body.latex).toBeTruthy();
    expect(res.body.latex).toContain('\\frac');
    expect(res.body.steps.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/solve/text identifies Incomplete Question and rejects guessing', async () => {
    const res = await request(app)
      .post('/api/v1/solve/text')
      .send({
        prompt: 'Soal incomplete pilihan jawaban: A. Satu',
        mode: 'QUICK'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCOMPLETE_QUESTION');
    expect(res.body.answerOption).toBeNull();
    expect(res.body.answer).toContain('Area soal belum lengkap');
  });

  it('POST /api/v1/solve/followup answers contextual follow-up questions', async () => {
    const res = await request(app)
      .post('/api/v1/solve/followup')
      .send({
        history: [
          { role: 'user', content: 'Manakah organel penghasil ATP?' },
          { role: 'assistant', content: 'C — Mitokondria' }
        ],
        followUpQuestion: 'Jelaskan mengapa bukan ribosom?',
        mode: 'LEARN'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.explanation).toBeTruthy();
  });

  it('POST /api/v1/solve/vision solves multimodal image questions with diagram context', async () => {
    const dummyBase64 = Buffer.from('fake-jpeg-image-content-for-testing').toString('base64');
    const res = await request(app)
      .post('/api/v1/solve/vision')
      .send({
        imageBase64: dummyBase64,
        mimeType: 'image/jpeg',
        prompt: 'Perhatikan gambar diagram organel respirasi sel penghasil ATP',
        mode: 'LEARN'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.subject).toBe('biology');
    expect(res.body.answer).toBe('Mitokondria');
    expect(res.body.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('GET /api/v1/usage reflects token consumption', async () => {
    // Perform one solve request to consume tokens
    await request(app)
      .post('/api/v1/solve/text')
      .send({ prompt: 'Hitung kuadrat akar x^2' });

    const res = await request(app).get('/api/v1/usage');
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBeGreaterThanOrEqual(1);
    expect(res.body.totalTokens).toBeGreaterThan(0);
    expect(res.body.budgetTokens).toBe(1_000_000);
    expect(res.body.remainingTokens).toBeLessThan(1_000_000);
  });
});
