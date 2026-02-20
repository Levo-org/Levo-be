import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { ConversationController } from '@/controllers/conversation.controller';

const router = Router();
const controller = new ConversationController();

/**
 * @swagger
 * /conversations:
 *   get:
 *     tags: [Conversation]
 *     summary: 회화 상황 목록 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *     responses:
 *       200:
 *         description: 회화 목록 조회 성공
 */
router.get('/', auth, controller.getList);

/**
 * @swagger
 * /conversations/{id}:
 *   get:
 *     tags: [Conversation]
 *     summary: 대화문 상세 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 대화문 상세 조회 성공
 */
router.get('/:id', auth, controller.getDetail);

/**
 * @swagger
 * /conversations/{id}/practice:
 *   post:
 *     tags: [Conversation]
 *     summary: 발음 연습 결과 저장
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
 *               dialogIndex:
 *                 type: number
 *               pronunciationScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: 결과 저장 성공
 */
router.post('/:id/practice', auth, controller.submitPractice);

export default router;
