import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SolverProvider } from './providers/solver-provider.interface';
import { MockSolverProvider } from './providers/mock.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { SlidingWindowRateLimiter } from './ratelimit/rate-limiter';
import { createSolveRouter } from './routes/solve.route';
import { createFollowUpRouter } from './routes/followup.route';
import { createUsageRouter } from './routes/usage.route';
import { createHealthRouter } from './routes/health.route';

dotenv.config();

export interface AppOptions {
  provider?: SolverProvider;
  rateLimiter?: SlidingWindowRateLimiter;
}

export function createApp(options?: AppOptions): Application {
  const app = express();

  // Resolve AI Provider: If GEMINI_API_KEY is present and provider not injected, use Gemini, otherwise Mock
  let provider: SolverProvider;
  if (options?.provider) {
    provider = options.provider;
  } else if (process.env.GEMINI_API_KEY) {
    provider = new GeminiProvider(process.env.GEMINI_API_KEY);
  } else {
    provider = new MockSolverProvider();
  }

  const rateLimiter = options?.rateLimiter || new SlidingWindowRateLimiter(60, 60 * 1000);

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/v1/solve', createSolveRouter(provider, rateLimiter));
  app.use('/api/v1/solve/followup', createFollowUpRouter(provider, rateLimiter));
  app.use('/api/v1/usage', createUsageRouter());
  app.use('/api/v1/health', createHealthRouter(provider));

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: 'ERROR',
      message: 'Endpoint tidak ditemukan'
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      status: 'SERVER_ERROR',
      message: 'Terjadi kesalahan internal server',
      error: err.message
    });
  });

  return app;
}
