import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { HeartController } from '@/controllers/heart.controller';

const router = Router();
const controller = new HeartController();

/**
 * @swagger
 * /hearts:
 *   get:
 *     tags: [Heart]
 *     summary: 현재 하트 상태 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 하트 상태 조회 성공
 */
router.get('/', auth, controller.getStatus);

/**
 * @swagger
 * /hearts/use:
 *   post:
 *     tags: [Heart]
 *     summary: 하트 1개 소모
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 하트 소모 성공
 */
router.post('/use', auth, controller.useHeart);

/**
 * @swagger
 * /hearts/refill:
 *   post:
 *     tags: [Heart]
 *     summary: 하트 충전 (광고/코인)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method]
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [ad, coin_single, coin_full]
 *     responses:
 *       200:
 *         description: 하트 충전 성공
 */
router.post('/refill', auth, controller.refillHearts);

export default router;
