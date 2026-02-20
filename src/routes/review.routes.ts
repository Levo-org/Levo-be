import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { ReviewController } from '@/controllers/review.controller';

const router = Router();
const controller = new ReviewController();

/**
 * @swagger
 * /review:
 *   get:
 *     tags: [Review]
 *     summary: 복습 대시보드 (카테고리별 현황)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 복습 대시보드 조회 성공
 */
router.get('/', auth, controller.getSummary);

/**
 * @swagger
 * /review/{category}:
 *   get:
 *     tags: [Review]
 *     summary: 카테고리별 복습 항목
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, quiz]
 *     responses:
 *       200:
 *         description: 복습 항목 조회 성공
 */
router.get('/:category', auth, controller.getByCategory);

/**
 * @swagger
 * /review/{category}/complete:
 *   post:
 *     tags: [Review]
 *     summary: 복습 완료 기록
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 복습 완료 기록 성공
 */
router.post('/:category/complete', auth, controller.completeReview);

export default router;
