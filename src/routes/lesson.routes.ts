import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { LessonController } from '@/controllers/lesson.controller';

const router = Router();
const controller = new LessonController();

/**
 * @swagger
 * /lessons:
 *   get:
 *     tags: [Lesson]
 *     summary: 레슨 맵 조회 (유닛별 + 잠금 상태)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 레슨 맵 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     tags: [Lesson]
 *     summary: 레슨 미리보기 (상세 정보)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 레슨 상세 조회 성공
 */
router.get('/:id', auth, controller.getDetail);

/**
 * @swagger
 * /lessons/{id}/start:
 *   post:
 *     tags: [Lesson]
 *     summary: 레슨 시작
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 레슨 시작 성공
 */
router.post('/:id/start', auth, controller.start);

/**
 * @swagger
 * /lessons/{id}/complete:
 *   post:
 *     tags: [Lesson]
 *     summary: 레슨 완료 (XP/코인 지급)
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
 *             properties:
 *               score:
 *                 type: number
 *               correctCount:
 *                 type: number
 *               totalQuestions:
 *                 type: number
 *               timeSpentSeconds:
 *                 type: number
 *     responses:
 *       200:
 *         description: 레슨 완료 성공
 */
router.post('/:id/complete', auth, controller.complete);

export default router;
