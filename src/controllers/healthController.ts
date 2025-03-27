import { Router, Request, Response } from 'express';
import { HealthService } from '../services/healthService';

const router = Router();
const healthService = new HealthService();

router.get('/', async (_req: Request, res: Response) => {
  const health = await healthService.getHealthStatus();
  res.status(200).json(health);
});

export default router;
