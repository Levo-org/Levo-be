import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { SubscriptionController } from '@/controllers/subscription.controller';

const router = Router();
const controller = new SubscriptionController();

/**
 * @swagger
 * /subscription:
 *   get:
 *     tags: [Subscription]
 *     summary: 현재 구독 상태 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 구독 상태 조회 성공
 */
router.get('/', auth, controller.getStatus);

/**
 * @swagger
 * /subscription/subscribe:
 *   post:
 *     tags: [Subscription]
 *     summary: 프리미엄 구독 시작
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, receipt, platform]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               receipt:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [apple, google]
 *     responses:
 *       201:
 *         description: 구독 시작 성공
 */
router.post('/subscribe', auth, controller.subscribe);

/**
 * @swagger
 * /subscription/cancel:
 *   post:
 *     tags: [Subscription]
 *     summary: 구독 취소
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 구독 취소 성공
 */
router.post('/cancel', auth, controller.cancel);

export default router;
