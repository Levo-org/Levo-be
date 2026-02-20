import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { HomeController } from '@/controllers/home.controller';

const router = Router();
const controller = new HomeController();

/**
 * @swagger
 * /home:
 *   get:
 *     tags: [Home]
 *     summary: 홈 화면 집계 데이터 조회
 *     description: 홈 화면에 필요한 하트, 레슨 진행도, 스트릭, 카테고리 진행률 등을 한 번에 반환
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 홈 데이터 조회 성공
 */
router.get('/', auth, controller.getHome);

export default router;
