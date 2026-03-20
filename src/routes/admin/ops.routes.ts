import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { requireRole } from '@/middleware/requireRole';
import { OpsController } from '@/controllers/admin/ops.controller';

const router = Router();
const opsController = new OpsController();

router.use(auth, requireRole('admin'));

/**
 * @swagger
 * /admin/ops/dashboard:
 *   get:
 *     tags: [Admin - Ops]
 *     summary: Get aggregated ops dashboard data
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', opsController.getDashboard);

/**
 * @swagger
 * /admin/ops/health:
 *   get:
 *     tags: [Admin - Ops]
 *     summary: Get health status
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Health status
 */
router.get('/health', opsController.getHealth);

export default router;
