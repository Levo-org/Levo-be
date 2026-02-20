import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { StreakController } from '@/controllers/streak.controller';

const router = Router();
const controller = new StreakController();

/**
 * @swagger
 * /streak:
 *   get:
 *     tags: [Streak]
 *     summary: 스트릭 상세 정보 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 스트릭 조회 성공
 */
router.get('/', auth, controller.getStatus);

/**
 * @swagger
 * /streak/shield:
 *   post:
 *     tags: [Streak]
 *     summary: 스트릭 실드 사용
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 실드 사용 성공
 */
router.post('/shield', auth, controller.useShield);

export default router;
