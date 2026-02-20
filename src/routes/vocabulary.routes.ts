import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { VocabularyController } from '@/controllers/vocabulary.controller';

const router = Router();
const controller = new VocabularyController();

/**
 * @swagger
 * /vocabulary:
 *   get:
 *     tags: [Vocabulary]
 *     summary: 단어 목록 조회 (사용자 활성 언어 기준)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, learning, completed, wrong]
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: 단어 목록 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /vocabulary/flashcards:
 *   get:
 *     tags: [Vocabulary]
 *     summary: 플래시카드 세트 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: 플래시카드 세트 조회 성공
 */
router.get('/flashcards', auth, controller.getFlashcards);

/**
 * @swagger
 * /vocabulary/{id}:
 *   get:
 *     tags: [Vocabulary]
 *     summary: 단어 상세 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 단어 상세 조회 성공
 */
router.get('/:id', auth, controller.getDetail);

/**
 * @swagger
 * /vocabulary/{id}/answer:
 *   post:
 *     tags: [Vocabulary]
 *     summary: 플래시카드 정답/오답 기록
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
 *             required: [correct]
 *             properties:
 *               correct:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 정답/오답 기록 성공
 */
router.post('/:id/answer', auth, controller.submitAnswer);

export default router;
