import { Router } from 'express';
import multer from 'multer';
import { requireRole } from '@/middleware/requireRole';
import { ImportController } from '@/controllers/admin/import.controller';
import { ApiError } from '@/utils/ApiError';

const router = Router();
const controller = new ImportController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv = file.originalname.toLowerCase().endsWith('.csv');
    const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx');
    if (!isCsv && !isXlsx) {
      return cb(ApiError.badRequest('CSV 또는 XLSX 파일만 업로드할 수 있습니다.'));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /admin/import/upload:
 *   post:
 *     tags: [AdminImport]
 *     summary: CSV/XLSX 업로드 및 검증 미리보기
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, exampleSentence]
 *       - in: query
 *         name: targetLanguage
 *         required: true
 *         schema:
 *           type: string
 *           enum: [en, ja, zh]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 업로드 및 검증 성공
 */
router.post('/upload', requireRole('admin', 'editor'), upload.single('file'), controller.upload);

/**
 * @swagger
 * /admin/import/{batchId}/confirm:
 *   post:
 *     tags: [AdminImport]
 *     summary: 임포트 배치 확정
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 임포트 확정 성공
 */
router.post('/:batchId/confirm', requireRole('admin', 'editor'), controller.confirm);

/**
 * @swagger
 * /admin/import/{batchId}/cancel:
 *   post:
 *     tags: [AdminImport]
 *     summary: 임포트 배치 취소
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 임포트 취소 성공
 */
router.post('/:batchId/cancel', requireRole('admin', 'editor'), controller.cancel);

/**
 * @swagger
 * /admin/import/batches:
 *   get:
 *     tags: [AdminImport]
 *     summary: 임포트 배치 목록 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, conversation, exampleSentence]
 *     responses:
 *       200:
 *         description: 임포트 배치 목록 조회 성공
 */
router.get('/batches', requireRole('admin', 'editor'), controller.list);

/**
 * @swagger
 * /admin/import/{batchId}:
 *   get:
 *     tags: [AdminImport]
 *     summary: 임포트 배치 상세 조회
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 임포트 배치 상세 조회 성공
 */
router.get('/:batchId', requireRole('admin', 'editor'), controller.detail);

/**
 * @swagger
 * /admin/import/{batchId}/errors:
 *   get:
 *     tags: [AdminImport]
 *     summary: 임포트 오류 목록 다운로드
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 임포트 오류 목록 조회 성공
 */
router.get('/:batchId/errors', requireRole('admin', 'editor'), controller.errors);

export default router;
