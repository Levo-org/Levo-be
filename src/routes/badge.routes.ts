import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { BadgeController } from '@/controllers/badge.controller';

const router = Router();
const controller = new BadgeController();

/**
 * @swagger
 * /badges:
 *   get:
 *     tags: [Badge]
 *     summary: 전체 뱃지 + 획득 여부 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, streak, learning, level, special]
 *     responses:
 *       200:
 *         description: 뱃지 목록 조회 성공
 */
router.get('/', auth, controller.getList);

export default router;
