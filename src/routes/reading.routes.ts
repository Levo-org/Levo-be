import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { ReadingController } from '@/controllers/reading.controller';

const router = Router();
const controller = new ReadingController();

/**
 * @swagger
 * /reading:
 *   get:
 *     tags: [Reading]
 *     summary: 읽기 지문 목록 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *     responses:
 *       200:
 *         description: 읽기 지문 목록 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /reading/{id}:
 *   get:
 *     tags: [Reading]
 *     summary: 지문 상세 + 퀴즈
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 지문 상세 조회 성공
 */
router.get('/:id', auth, controller.getDetail);

/**
 * @swagger
 * /reading/{id}/quiz/answer:
 *   post:
 *     tags: [Reading]
 *     summary: 독해 퀴즈 정답 제출
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
 *             required: [quizIndex, selectedAnswer]
 *             properties:
 *               quizIndex:
 *                 type: number
 *               selectedAnswer:
 *                 type: number
 *     responses:
 *       200:
 *         description: 정답 제출 성공
 */
router.post('/:id/quiz/answer', auth, controller.submitQuizAnswer);

export default router;
