import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { StatsController } from '@/controllers/stats.controller';

const router = Router();
const controller = new StatsController();

/**
 * @swagger
 * /stats:
 *   get:
 *     tags: [Stats]
 *     summary: 학습 통계 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, all]
 *           default: week
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 */
router.get('/', auth, controller.getStats);

export default router;
