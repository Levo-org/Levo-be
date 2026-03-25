import { Router } from 'express';
import { requireRole } from '@/middleware/requireRole';
import adminContentController from '@/controllers/admin/content.controller';

const router = Router();

/**
 * @swagger
 * /admin/content/stats/summary:
 *   get:
 *     tags: [Admin Content]
 *     summary: 콘텐츠 통계 요약 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 콘텐츠 통계 조회 성공
 */
router.get(
  '/stats/summary',
  requireRole('editor', 'reviewer', 'admin'),
  adminContentController.getStats,
);

/**
 * @swagger
 * /admin/content/{contentType}:
 *   get:
 *     tags: [Admin Content]
 *     summary: 콘텐츠 목록 조회 (필터/검색/페이지네이션)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, in_review, approved, published, archived]
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
 *         name: chapter
 *         description: vocabulary 콘텐츠에만 적용되는 챕터 필터
 *         schema:
 *           type: number
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: updatedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 콘텐츠 목록 조회 성공
 */
router.get(
  '/:contentType',
  requireRole('editor', 'reviewer', 'admin'),
  adminContentController.list,
);

/**
 * @swagger
 * /admin/content/{contentType}/{id}:
 *   get:
 *     tags: [Admin Content]
 *     summary: 콘텐츠 상세 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 콘텐츠 상세 조회 성공
 *       404:
 *         description: 콘텐츠를 찾을 수 없음
 */
router.get(
  '/:contentType/:id',
  requireRole('editor', 'reviewer', 'admin'),
  adminContentController.getDetail,
);

/**
 * @swagger
 * /admin/content/{contentType}:
 *   post:
 *     tags: [Admin Content]
 *     summary: 새 콘텐츠 생성 (draft 상태)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 콘텐츠 생성 성공
 */
router.post(
  '/:contentType',
  requireRole('editor', 'admin'),
  adminContentController.create,
);

/**
 * @swagger
 * /admin/content/{contentType}/{id}:
 *   put:
 *     tags: [Admin Content]
 *     summary: 콘텐츠 수정 (draft/in_review 상태만 가능)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
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
 *     responses:
 *       200:
 *         description: 콘텐츠 수정 성공
 *       400:
 *         description: 게시된 콘텐츠는 수정 불가
 *       404:
 *         description: 콘텐츠를 찾을 수 없음
 */
router.put(
  '/:contentType/:id',
  requireRole('editor', 'admin'),
  adminContentController.update,
);

/**
 * @swagger
 * /admin/content/{contentType}/{id}:
 *   delete:
 *     tags: [Admin Content]
 *     summary: 콘텐츠 보관 (soft delete → archived)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 콘텐츠 보관 처리 성공
 *       404:
 *         description: 콘텐츠를 찾을 수 없음
 */
router.delete(
  '/:contentType/:id',
  requireRole('admin'),
  adminContentController.delete,
);

export default router;
