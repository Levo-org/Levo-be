import { Router } from 'express';
import { requireRole } from '@/middleware/requireRole';
import adminMemberController from '@/controllers/admin/member.controller';

const router = Router();

/**
 * @swagger
 * /admin/members:
 *   get:
 *     tags: [Admin Members]
 *     summary: 회원 목록 조회 (검색/필터/페이지네이션)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 이름/이메일/providerId 검색
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [google, apple, email]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [learner, editor, reviewer, admin]
 *       - in: query
 *         name: targetLanguage
 *         schema:
 *           type: string
 *           enum: [en, ja, zh]
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, elementary, intermediate, advanced]
 *       - in: query
 *         name: onboardingCompleted
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, email, coins]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 회원 목록 조회 성공
 */
router.get('/', requireRole('admin', 'reviewer'), adminMemberController.list);

export default router;
