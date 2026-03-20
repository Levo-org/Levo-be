import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { requireRole } from '@/middleware/requireRole';
import { ApiResponse } from '@/utils/ApiResponse';
import importRoutes from '@/routes/admin/import.routes';
import contentRoutes from '@/routes/admin/content.routes';
import workflowRoutes from '@/routes/admin/workflow.routes';
import opsRoutes from '@/routes/admin/ops.routes';

const router = Router();

router.use(auth, requireRole('admin', 'reviewer', 'editor'));

router.get('/health', (req, res) => {
  return ApiResponse.success(res, { status: 'ok', role: req.user!.role });
});

router.use('/import', importRoutes);

router.use('/content', contentRoutes);
router.use('/workflow', workflowRoutes);
router.use('/ops', opsRoutes);

export default router;
