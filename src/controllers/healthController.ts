import { Router, Request, Response } from 'express';
import { HealthService } from '../services/healthService';

const router = Router();
const healthService = new HealthService();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get application health status
 *     description: Returns the health status of the application, including database and Redis connections
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Application health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                   description: Overall health status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-14T12:00:00.000Z"
 *                   description: Current server timestamp
 *                 message:
 *                   type: string
 *                   example: "Server is healthy"
 *                   description: Health status message
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         message:
 *                           type: string
 *                           example: "Connected"
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         message:
 *                           type: string
 *                           example: "Connected"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (_req: Request, res: Response) => {
  const health = await healthService.getHealthStatus();
  res.status(200).json(health);
});

export default router;
