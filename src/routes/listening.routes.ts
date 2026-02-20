import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { ListeningController } from '@/controllers/listening.controller';

const router = Router();
const controller = new ListeningController();

/**
 * @swagger
 * /listening:
 *   get:
 *     tags: [Listening]
 *     summary: 듣기 문제 목록 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *     responses:
 *       200:
 *         description: 듣기 문제 목록 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /listening/{id}/answer:
 *   post:
 *     tags: [Listening]
 *     summary: 받아쓰기 정답 제출
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answer]
 *             properties:
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: 정답 제출 성공
 */
router.post('/:id/answer', auth, controller.submitAnswer);

export default router;
