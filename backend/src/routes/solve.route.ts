import { Router, Request, Response } from 'express';
import { SolveTextRequestSchema, SolveVisionRequestSchema } from '../schemas/solver.schema';
import { LanguageClassifier } from '../classifiers/language.classifier';
import { SubjectClassifier } from '../classifiers/subject.classifier';
import { QuestionTypeClassifier } from '../classifiers/question-type.classifier';
import { SubjectRouter } from '../solvers/subject.router';
import { AnswerValidator } from '../validators/answer.validator';
import { SlidingWindowRateLimiter } from '../ratelimit/rate-limiter';
import { globalUsageTracker } from '../usage/tracker';
import { SolverProvider } from '../providers/solver-provider.interface';
import { SolverContext } from '../types/solver.types';

export function createSolveRouter(
  provider: SolverProvider,
  rateLimiter: SlidingWindowRateLimiter
): Router {
  const router = Router();
  const subjectRouter = new SubjectRouter(provider);

  // POST /api/v1/solve/text
  router.post('/text', async (req: Request, res: Response): Promise<void> => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = rateLimiter.check(clientIp);

    if (!rateCheck.allowed) {
      globalUsageTracker.recordError();
      res.status(429).json({
        status: 'RATE_LIMITED',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: '',
        options: [],
        answerOption: null,
        answer: 'Terlalu banyak permintaan dalam waktu singkat. Mohon tunggu beberapa saat.',
        shortAnswer: 'Rate Limit',
        explanation: 'Sistem membatasi frekuensi request untuk menjaga kestabilan dan kuota solver.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: [`Reset dalam ${Math.ceil(rateCheck.resetMs / 1000)} detik`]
      });
      return;
    }

    const parseResult = SolveTextRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      globalUsageTracker.recordError();
      res.status(400).json({
        status: 'ERROR',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: '',
        options: [],
        answerOption: null,
        answer: 'Input permintaan tidak valid.',
        shortAnswer: 'Input Invalid',
        explanation: parseResult.error.issues.map(i => i.message).join(', '),
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      });
      return;
    }

    const { prompt, mode, language, explanationLength } = parseResult.data;

    // Automatic classification if not predetermined
    const detectedLanguage = language || LanguageClassifier.detectLanguage(prompt);
    const detectedSubject = SubjectClassifier.detectSubject(prompt);
    const detectedQuestionType = QuestionTypeClassifier.detectQuestionType(prompt);

    const context: SolverContext = {
      language: detectedLanguage,
      subject: detectedSubject,
      questionType: detectedQuestionType,
      mode,
      explanationLength,
      clientIp
    };

    try {
      const rawResponse = await subjectRouter.routeAndSolve(prompt, context);
      const validatedOutput = AnswerValidator.validate(rawResponse);

      globalUsageTracker.recordUsage(
        rawResponse.inputTokens,
        rawResponse.outputTokens,
        validatedOutput.status === 'ERROR'
      );

      res.status(200).json(validatedOutput);
    } catch (error: any) {
      globalUsageTracker.recordError();
      res.status(500).json({
        status: 'SERVER_ERROR',
        subject: detectedSubject,
        questionType: detectedQuestionType,
        language: detectedLanguage,
        questionExtracted: prompt,
        options: [],
        answerOption: null,
        answer: 'Terjadi kendala pada sistem penyelesai.',
        shortAnswer: 'Kendala Server',
        explanation: error.message || 'Terjadi kesalahan internal saat menghubungkan solver.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: [error.message || 'Unknown server error']
      });
    }
  });

  // POST /api/v1/solve/vision
  router.post('/vision', async (req: Request, res: Response): Promise<void> => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = rateLimiter.check(clientIp);

    if (!rateCheck.allowed) {
      globalUsageTracker.recordError();
      res.status(429).json({
        status: 'RATE_LIMITED',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: '',
        options: [],
        answerOption: null,
        answer: 'Terlalu banyak permintaan vision dalam waktu singkat.',
        shortAnswer: 'Rate Limit',
        explanation: 'Mohon tunggu beberapa detik sebelum melakukan pemindaian gambar berikutnya.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: []
      });
      return;
    }

    const parseResult = SolveVisionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      globalUsageTracker.recordError();
      res.status(400).json({
        status: 'ERROR',
        subject: 'general',
        questionType: 'general_qa',
        language: 'id',
        questionExtracted: '',
        options: [],
        answerOption: null,
        answer: 'Data gambar atau parameter vision tidak valid.',
        shortAnswer: 'Input Invalid',
        explanation: parseResult.error.issues.map(i => i.message).join(', '),
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: []
      });
      return;
    }

    const { imageBase64, mimeType, prompt, mode, language, explanationLength } = parseResult.data;

    const context: SolverContext = {
      language: language || 'id',
      mode,
      explanationLength,
      clientIp
    };

    try {
      const rawResponse = await provider.solveImage(
        imageBase64,
        mimeType,
        prompt || '',
        context
      );
      const validatedOutput = AnswerValidator.validate(rawResponse);

      globalUsageTracker.recordUsage(
        rawResponse.inputTokens,
        rawResponse.outputTokens,
        validatedOutput.status === 'ERROR'
      );

      res.status(200).json(validatedOutput);
    } catch (error: any) {
      globalUsageTracker.recordError();
      res.status(500).json({
        status: 'SERVER_ERROR',
        subject: 'general',
        questionType: 'general_qa',
        language: language || 'id',
        questionExtracted: prompt || '',
        options: [],
        answerOption: null,
        answer: 'Gagal memproses gambar soal via Vision AI.',
        shortAnswer: 'Vision Error',
        explanation: error.message || 'Gagal memproses visual.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: [error.message || 'Vision processing error']
      });
    }
  });

  return router;
}
