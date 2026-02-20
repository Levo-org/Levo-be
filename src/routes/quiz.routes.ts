import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { QuizController } from '@/controllers/quiz.controller';

const router = Router();
const controller = new QuizController();

/**
 * @swagger
 * /quiz/daily:
 *   get:
 *     tags: [Quiz]
 *     summary: 오늘의 종합 퀴즈 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 퀴즈 조회 성공
 */
router.get('/daily', auth, controller.getDailyQuiz);

/**
 * @swagger
 * /quiz/answer:
 *   post:
 *     tags: [Quiz]
 *     summary: 퀴즈 정답 제출
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: number
 *               selectedAnswer:
 *                 type: number
 *     responses:
 *       200:
 *         description: 정답 제출 성공
 */
router.post('/answer', auth, controller.submitAnswer);

/**
 * @swagger
 * /quiz/complete:
 *   post:
 *     tags: [Quiz]
 *     summary: 퀴즈 세션 완료
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               totalQuestions:
 *                 type: number
 *     responses:
 *       200:
 *         description: 퀴즈 세션 완료 성공
 */
router.post('/complete', auth, controller.completeQuiz);

export default router;
