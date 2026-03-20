import { Router } from 'express';
import { requireRole } from '@/middleware/requireRole';
import { WorkflowController } from '@/controllers/admin/workflow.controller';

const router = Router();
const controller = new WorkflowController();

/**
 * @swagger
 * /admin/workflow/{contentType}/{id}/transition:
 *   post:
 *     tags: [AdminWorkflow]
 *     summary: 콘텐츠 상태 전환
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
 *             required: [targetStatus]
 *             properties:
 *               targetStatus:
 *                 type: string
 *                 enum: [draft, in_review, approved, published, archived]
 *     responses:
 *       200:
 *         description: 상태 전환 성공
 */
router.post(
  '/:contentType/:id/transition',
  requireRole('admin', 'reviewer', 'editor'),
  controller.transition,
);

/**
 * @swagger
 * /admin/workflow/batch-transition:
 *   post:
 *     tags: [AdminWorkflow]
 *     summary: 콘텐츠 상태 배치 전환
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contentType, ids, targetStatus]
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [vocabulary, grammar, conversation, listening, reading, exampleSentence]
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetStatus:
 *                 type: string
 *                 enum: [draft, in_review, approved, published, archived]
 *     responses:
 *       200:
 *         description: 배치 전환 결과
 */
router.post(
  '/batch-transition',
  requireRole('admin', 'reviewer', 'editor'),
  controller.batchTransition,
);

/**
 * @swagger
 * /admin/workflow/audit-log:
 *   get:
 *     tags: [AdminWorkflow]
 *     summary: 감사 로그 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: 감사 로그 조회 성공
 */
router.get(
  '/audit-log',
  requireRole('admin', 'reviewer', 'editor'),
  controller.getAuditLogs,
);

/**
 * @swagger
 * /admin/workflow/audit-log/{entityType}/{entityId}:
 *   get:
 *     tags: [AdminWorkflow]
 *     summary: 특정 콘텐츠 감사 로그 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 감사 로그 조회 성공
 */
router.get(
  '/audit-log/:entityType/:entityId',
  requireRole('admin', 'reviewer', 'editor'),
  controller.getAuditLogByEntity,
);

export default router;
