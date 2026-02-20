import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';

const router = Router();
const controller = new AuthController();

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Google OAuth 로그인/회원가입
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google OAuth ID 토큰
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
router.post('/google', controller.googleLogin);

/**
 * @swagger
 * /auth/apple:
 *   post:
 *     tags: [Auth]
 *     summary: Apple OAuth 로그인/회원가입
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
router.post('/apple', controller.appleLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Access Token 갱신
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 */
router.post('/refresh', controller.refresh);

/**
 * @swagger
 * /auth/dev-login:
 *   post:
 *     tags: [Auth]
 *     summary: "[개발용] 테스트 로그인 (토큰 없이 바로 JWT 발급)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@levo.com
 *               name:
 *                 type: string
 *                 example: 테스트유저
 *     responses:
 *       200:
 *         description: 개발용 로그인 성공
 */
router.post('/dev-login', controller.devLogin);

export default router;
