import { Router, Request, Response } from 'express';
import { FollowUpRequestSchema } from '../schemas/solver.schema';
import { AnswerValidator } from '../validators/answer.validator';
import { globalUsageTracker } from '../usage/tracker';
import { SolverProvider } from '../providers/solver-provider.interface';
import { FollowUpMessage, SolverContext } from '../types/solver.types';
import { SlidingWindowRateLimiter } from '../ratelimit/rate-limiter';

export function createFollowUpRouter(
  provider: SolverProvider,
  rateLimiter: SlidingWindowRateLimiter
): Router {
  const router = Router();

  // POST /api/v1/solve/followup
  router.post('/', async (req: Request, res: Response): Promise<void> => {
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
        answer: 'Terlalu banyak permintaan follow-up.',
        shortAnswer: 'Rate Limit',
        explanation: 'Mohon tunggu beberapa detik sebelum mengajukan pertanyaan lanjutan.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: []
      });
      return;
    }

    const parseResult = FollowUpRequestSchema.safeParse(req.body);
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
        answer: 'Parameter follow-up tidak valid.',
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

    const { history, followUpQuestion, mode, language } = parseResult.data;

    const fullHistory: FollowUpMessage[] = [
      ...history,
      { role: 'user', content: followUpQuestion }
    ];

    const context: SolverContext = {
      language: language || 'id',
      mode,
      clientIp
    };

    try {
      const rawResponse = await provider.solveFollowUp(fullHistory, context);
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
        questionExtracted: followUpQuestion,
        options: [],
        answerOption: null,
        answer: 'Gagal memproses pertanyaan lanjutan.',
        shortAnswer: 'Error Follow-up',
        explanation: error.message || 'Terjadi kesalahan sistem.',
        steps: [],
        latex: null,
        codeSnippet: null,
        confidence: 0,
        warnings: [error.message || 'Follow-up processing error']
      });
    }
  });

  return router;
}
