import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';
import User from '@/models/User';

const BOOTSTRAP_TOKEN_TTL_MS = 10 * 60 * 1000;
const PASSWORD_KEY_LEN = 64;
const PASSWORD_SCRYPT_N = 16384;
const PASSWORD_SCRYPT_R = 8;
const PASSWORD_SCRYPT_P = 1;

interface BootstrapTokenState {
  token: string;
  expiresAt: number;
}

let bootstrapTokenState: BootstrapTokenState | null = null;

const generateBootstrapToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const signAccessToken = (userId: string, email: string): string => {
  const secret = config.jwt.secret as jwt.Secret;
  const expiresIn = config.jwt.expiresIn as jwt.SignOptions['expiresIn'];

  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn },
  );
};

const signRefreshToken = (userId: string): string => {
  const secret = config.jwt.refreshSecret as jwt.Secret;
  const expiresIn = config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'];

  return jwt.sign(
    { userId },
    secret,
    { expiresIn },
  );
};

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LEN, {
    N: PASSWORD_SCRYPT_N,
    r: PASSWORD_SCRYPT_R,
    p: PASSWORD_SCRYPT_P,
  }).toString('hex');

  return `${salt}:${derivedKey}`;
};

const verifyPassword = (password: string, storedHash: string): boolean => {
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [salt, expectedKey] = parts;
  if (!salt || !expectedKey) {
    return false;
  }

  const candidateKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LEN, {
    N: PASSWORD_SCRYPT_N,
    r: PASSWORD_SCRYPT_R,
    p: PASSWORD_SCRYPT_P,
  }).toString('hex');

  return safeTimingEqual(expectedKey, candidateKey);
};

const safeTimingEqual = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const ensureBootstrapToken = (): BootstrapTokenState => {
  const now = Date.now();

  if (!bootstrapTokenState || bootstrapTokenState.expiresAt <= now) {
    bootstrapTokenState = {
      token: generateBootstrapToken(),
      expiresAt: now + BOOTSTRAP_TOKEN_TTL_MS,
    };
  }

  return bootstrapTokenState;
};

const validatePassword = (password: string): void => {
  if (password.length < 10) {
    throw ApiError.badRequest('비밀번호는 최소 10자 이상이어야 합니다.');
  }
};

export class AdminAuthController {
  bootstrap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password } = req.body as {
        email?: string;
        name?: string;
        password?: string;
      };

      if (!email || !password) {
        throw ApiError.badRequest('email과 password가 필요합니다.');
      }

      validatePassword(password);

      const normalizedEmail = email.trim().toLowerCase();

      const existingAdminWithPassword = await User.findOne({
        role: 'admin',
        passwordHash: { $exists: true, $ne: '' },
      });

      if (existingAdminWithPassword) {
        throw ApiError.forbidden('이미 관리자 계정이 존재합니다.');
      }

      const existingAdmin = await User.findOne({ role: 'admin' });

      const tokenState = ensureBootstrapToken();

      const bootstrapTokenFromHeader = req.headers['x-bootstrap-token'];
      if (typeof bootstrapTokenFromHeader !== 'string') {
        return ApiResponse.success(res, {
          bootstrapToken: tokenState.token,
          expiresAt: new Date(tokenState.expiresAt).toISOString(),
          note: '이 토큰을 x-bootstrap-token 헤더로 다시 호출하면 관리자 계정이 생성됩니다.',
        });
      }

      if (tokenState.expiresAt <= Date.now()) {
        bootstrapTokenState = null;
        throw ApiError.unauthorized('부트스트랩 토큰이 만료되었습니다. 다시 요청하세요.');
      }

      if (!safeTimingEqual(tokenState.token, bootstrapTokenFromHeader)) {
        throw ApiError.unauthorized('유효하지 않은 부트스트랩 토큰입니다.');
      }

      let user = existingAdmin;

      if (user) {
        if (user.email !== normalizedEmail) {
          throw ApiError.badRequest(`기존 관리자 이메일(${user.email})과 동일한 이메일로만 비밀번호를 설정할 수 있습니다.`);
        }
      } else {
        user = await User.findOne({ email: normalizedEmail });
      }

      if (user) {
        user.role = 'admin';
        user.provider = 'email';
        user.providerId = `admin-email-${Date.now()}`;
        user.passwordHash = hashPassword(password);
        user.onboardingCompleted = true;

        if (name?.trim()) {
          user.name = name.trim();
        }

        await user.save();
      } else {
        user = await User.create({
          email: normalizedEmail,
          name: name?.trim() || 'Levo Admin',
          role: 'admin',
          provider: 'email',
          providerId: `admin-email-${Date.now()}`,
          passwordHash: hashPassword(password),
          activeLanguage: 'en',
          onboardingCompleted: true,
        });
      }

      bootstrapTokenState = null;

      const accessToken = signAccessToken(user._id.toString(), user.email);
      const refreshToken = signRefreshToken(user._id.toString());

      return ApiResponse.success(res, {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: { accessToken, refreshToken },
      }, '관리자 계정 생성 및 로그인 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        throw ApiError.badRequest('email과 password가 필요합니다.');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || !user.passwordHash) {
        throw ApiError.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      if (!['admin', 'editor', 'reviewer'].includes(user.role)) {
        throw ApiError.forbidden('관리자 접근 권한이 없습니다.');
      }

      if (!verifyPassword(password, user.passwordHash)) {
        throw ApiError.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      const accessToken = signAccessToken(user._id.toString(), user.email);
      const refreshToken = signRefreshToken(user._id.toString());

      return ApiResponse.success(res, {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: { accessToken, refreshToken },
      }, '로그인 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        throw ApiError.badRequest('refreshToken이 필요합니다.');
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw ApiError.unauthorized('유효하지 않은 사용자입니다.');
      }

      if (!['admin', 'editor', 'reviewer'].includes(user.role)) {
        throw ApiError.forbidden('관리자 접근 권한이 없습니다.');
      }

      const newAccessToken = signAccessToken(user._id.toString(), user.email);
      const newRefreshToken = signRefreshToken(user._id.toString());

      return ApiResponse.success(res, {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      }, '토큰 갱신 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(ApiError.unauthorized('토큰 갱신에 실패했습니다.'));
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return ApiResponse.success(res, null, '로그아웃 성공');
    } catch (err) {
      next(err);
    }
  };
}
