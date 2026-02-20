import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { GrammarController } from '@/controllers/grammar.controller';

const router = Router();
const controller = new GrammarController();

/**
 * @swagger
 * /grammar:
 *   get:
 *     tags: [Grammar]
 *     summary: 문법 토픽 목록 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *     responses:
 *       200:
 *         description: 문법 목록 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /grammar/{id}:
 *   get:
 *     tags: [Grammar]
 *     summary: 문법 상세 (공식+예문+설명)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 문법 상세 조회 성공
 */
router.get('/:id', auth, controller.getDetail);

/**
 * @swagger
 * /grammar/{id}/quiz:
 *   get:
 *     tags: [Grammar]
 *     summary: 문법 퀴즈 문제 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 퀴즈 목록 조회 성공
 */
router.get('/:id/quiz', auth, controller.getQuiz);

/**
 * @swagger
 * /grammar/{id}/quiz/answer:
 *   post:
 *     tags: [Grammar]
 *     summary: 문법 퀴즈 정답 제출
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
