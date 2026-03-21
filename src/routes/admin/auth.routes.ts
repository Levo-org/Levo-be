import { Router } from 'express';
import { AdminAuthController } from '@/controllers/admin/auth.controller';

const router = Router();
const controller = new AdminAuthController();

router.post('/bootstrap', controller.bootstrap);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

export default router;
