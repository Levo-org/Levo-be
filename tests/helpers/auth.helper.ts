import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '@/config';

export type TestRole = 'learner' | 'editor' | 'reviewer' | 'admin';

interface TokenOptions {
  userId?: string;
  email?: string;
  role?: TestRole;
  expiresIn?: string;
}

export function generateTestToken(options: TokenOptions = {}): string {
  const {
    userId = new mongoose.Types.ObjectId().toString(),
    email = `${options.role ?? 'learner'}-${Date.now()}@test.com`,
    expiresIn = '1h',
  } = options;

  return jwt.sign(
    { userId, email },
    // cast to Secret to satisfy type definitions in this test helper
    config.jwt.secret as unknown as jwt.Secret,
    { expiresIn } as jwt.SignOptions,
  );
}

export function generateExpiredToken(userId?: string): string {
  const id = userId ?? new mongoose.Types.ObjectId().toString();
  return jwt.sign(
    { userId: id, email: 'expired@test.com' },
    config.jwt.secret as unknown as jwt.Secret,
    { expiresIn: '0s' } as jwt.SignOptions,
  );
}

export function generateInvalidToken(): string {
  return jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), email: 'invalid@test.com' },
    'wrong-secret-key' as unknown as jwt.Secret,
    { expiresIn: '1h' } as jwt.SignOptions,
  );
}
