import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { CoinController } from '@/controllers/coin.controller';

const router = Router();
const controller = new CoinController();

/**
 * @swagger
 * /coins:
 *   get:
 *     tags: [Coin]
 *     summary: 보유 코인 + 거래 내역 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 코인 정보 조회 성공
 */
router.get('/', auth, controller.getStatus);

/**
 * @swagger
 * /coins/earn:
 *   post:
 *     tags: [Coin]
 *     summary: 코인 획득 (광고/출석/초대)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [ad_watch, daily_check, friend_invite]
 *     responses:
 *       200:
 *         description: 코인 획득 성공
 */
router.post('/earn', auth, controller.earn);

/**
 * @swagger
 * /coins/spend:
 *   post:
 *     tags: [Coin]
 *     summary: 코인 사용 (아이템 구매)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item]
 *             properties:
 *               item:
 *                 type: string
 *                 enum: [heart_single, heart_full, streak_shield, hint_5, profile_border]
 *     responses:
 *       200:
 *         description: 코인 사용 성공
 */
router.post('/spend', auth, controller.spend);

export default router;
