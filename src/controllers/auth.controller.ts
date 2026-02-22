// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User';

const googleClient = new OAuth2Client(config.oauth.googleClientId);

export class AuthController {
  /** Google OAuth 로그인 */
  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      if (!idToken) throw ApiError.badRequest('idToken이 필요합니다.');

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.oauth.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw ApiError.unauthorized('유효하지 않은 Google 토큰입니다.');
      }

      const { email, name, picture, sub: googleId } = payload;

      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = await User.create({
          email,
          name: name || email.split('@')[0],
          profileImage: picture || '',
          provider: 'google',
          providerId: googleId,
          activeLanguage: 'en',
        });
      }

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      return ApiResponse.success(res, {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          activeLanguage: user.activeLanguage,
          isPremium: user.isPremium,
          coins: user.coins,
          isNewUser: !user.onboardingCompleted,
        },
        tokens: { accessToken, refreshToken },
      }, isNewUser ? '회원가입 완료' : '로그인 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(ApiError.unauthorized('Google 인증에 실패했습니다.'));
    }
  };

  /** Apple OAuth 로그인 */
  appleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken, name: appleUserName } = req.body;
      if (!idToken) throw ApiError.badRequest('idToken이 필요합니다.');

      const decoded: any = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.payload) {
        throw ApiError.unauthorized('유효하지 않은 Apple 토큰입니다.');
      }
      const { sub: appleId, email } = decoded.payload;
      if (!email) throw ApiError.unauthorized('Apple 토큰에 이메일이 없습니다.');

      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = await User.create({
          email,
          name: appleUserName || email.split('@')[0],
          provider: 'apple',
          providerId: appleId,
          activeLanguage: 'en',
        });
      }

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      return ApiResponse.success(res, {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          activeLanguage: user.activeLanguage,
          isPremium: user.isPremium,
          coins: user.coins,
          isNewUser: !user.onboardingCompleted,
        },
        tokens: { accessToken, refreshToken },
      }, isNewUser ? '회원가입 완료' : '로그인 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(ApiError.unauthorized('Apple 인증에 실패했습니다.'));
    }
  };

  /** 토큰 갱신 */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw ApiError.badRequest('refreshToken이 필요합니다.');

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);
      if (!user) throw ApiError.unauthorized('유효하지 않은 사용자입니다.');

      const newAccessToken = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      const newRefreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      return ApiResponse.success(res, {
        tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      }, '토큰 갱신 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(ApiError.unauthorized('토큰 갱신에 실패했습니다.'));
    }
  };

  /** [개발용] 테스트 로그인 */
  devLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email = 'test@levo.com', name = '테스트유저' } = req.body;

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email, name,
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
        tokens: { accessToken, refreshToken, expiresIn: 604800 },
      }, '개발용 로그인 성공');
    } catch (err) { next(err); }
  };
}
