import { Router, Request, Response } from 'express';
import { globalUsageTracker } from '../usage/tracker';

export function createUsageRouter(): Router {
  const router = Router();

  // GET /api/v1/usage
  router.get('/', (_req: Request, res: Response): void => {
    const stats = globalUsageTracker.getStats();
    res.status(200).json(stats);
  });

  return router;
}
