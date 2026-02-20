import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { ApiResponse } from '@/utils/ApiResponse';
import User from '@/models/User';

export class AuthController {
  /** Google OAuth 로그인 */
  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Google idToken 검증 로직 구현
      const { idToken } = req.body;
      return ApiResponse.success(res, { message: 'Google 로그인 - 구현 예정', idToken });
    } catch (err) { next(err); }
  };

  /** Apple OAuth 로그인 */
  appleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      return ApiResponse.success(res, { message: 'Apple 로그인 - 구현 예정', idToken });
    } catch (err) { next(err); }
  };

  /** 토큰 갱신 */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      return ApiResponse.success(res, { message: '토큰 갱신 - 구현 예정', refreshToken });
    } catch (err) { next(err); }
  };

  /** [개발용] 테스트 로그인 — Swagger에서 JWT 발급 받아 테스트 가능 */
  devLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email = 'test@levo.com', name = '테스트유저' } = req.body;

      // 기존 유저 찾기 또는 생성
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          name,
          provider: 'email',
          providerId: `dev_${Date.now()}`,
          activeLanguage: 'en',
        });
      }

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.refreshSecret,
        { expiresIn: '30d' }
      );

      return ApiResponse.success(res, {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          activeLanguage: user.activeLanguage,
          isNewUser: !user.onboardingCompleted,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 604800,
        },
      }, '개발용 로그인 성공');
    } catch (err) { next(err); }
  };
}
