import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { UserController } from '@/controllers/user.controller';

const router = Router();
const controller = new UserController();

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [User]
 *     summary: 내 프로필 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 */
router.get('/me', auth, controller.getMe);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [User]
 *     summary: 프로필 수정
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 */
router.patch('/me', auth, controller.updateMe);

/**
 * @swagger
 * /users/me/settings:
 *   patch:
 *     tags: [User]
 *     summary: 설정 변경
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyGoalMinutes:
 *                 type: number
 *                 enum: [5, 10, 15, 20]
 *               notificationEnabled:
 *                 type: boolean
 *               notificationHour:
 *                 type: number
 *               soundEnabled:
 *                 type: boolean
 *               effectsEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 설정 변경 성공
 */
router.patch('/me/settings', auth, controller.updateSettings);

/**
 * @swagger
 * /users/me/language:
 *   patch:
 *     tags: [User]
 *     summary: 활성 학습 언어 변경
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetLanguage]
 *             properties:
 *               targetLanguage:
 *                 type: string
 *                 enum: [en, ja, zh]
 *     responses:
 *       200:
 *         description: 언어 변경 성공 (새 프로필 자동 생성 포함)
 */
router.patch('/me/language', auth, controller.changeLanguage);

/**
 * @swagger
 * /users/me/onboarding:
 *   post:
 *     tags: [User]
 *     summary: 온보딩 완료 (언어+레벨+목표+알림 일괄 설정)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetLanguage, level, dailyGoalMinutes]
 *             properties:
 *               targetLanguage:
 *                 type: string
 *                 enum: [en, ja, zh]
 *               level:
 *                 type: string
 *                 enum: [beginner, elementary, intermediate, advanced]
 *               dailyGoalMinutes:
 *                 type: number
 *                 enum: [5, 10, 15, 20]
 *               notificationEnabled:
 *                 type: boolean
 *                 default: true
 *               notificationHour:
 *                 type: number
 *                 default: 7
 *     responses:
 *       201:
 *         description: 온보딩 완료
 */
router.post('/me/onboarding', auth, controller.completeOnboarding);

export default router;
