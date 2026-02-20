import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User';

export const auth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('인증 토큰이 필요합니다.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string };

    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      throw ApiError.unauthorized('유효하지 않은 사용자입니다.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('유효하지 않은 토큰입니다.'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('토큰이 만료되었습니다.'));
    } else {
      next(error);
    }
  }
};

// 선택적 인증 (로그인 안 해도 됨)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string };
    const user = await User.findById(decoded.userId).select('-__v');
    if (user) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
