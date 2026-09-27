import { Router, Request, Response } from 'express';
import { SolverProvider } from '../providers/solver-provider.interface';

export function createHealthRouter(provider: SolverProvider): Router {
  const router = Router();

  // GET /api/v1/health
  router.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'healthy',
      app: 'DaneX Backend Solver Gateway',
      version: '1.0.0',
      activeProvider: {
        id: provider.id,
        name: provider.name
      },
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
