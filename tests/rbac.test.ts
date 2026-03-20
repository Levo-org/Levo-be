import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '@/app';
import { config } from '@/config';
import User from '@/models/User';
import { connectTestDb, disconnectTestDb, clearCollections } from './setup';

const generateTestToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );
};

describe('RBAC — admin routes', () => {
  beforeAll(async () => {
    await connectTestDb();
    process.env.JWT_SECRET = config.jwt.secret;
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  const createUserWithRole = async (role: 'learner' | 'editor' | 'reviewer' | 'admin') => {
    const user = await User.create({
      email: `${role}-${Date.now()}@example.com`,
      name: `${role}-user`,
      profileImage: '',
      provider: 'google',
      providerId: `${role}-${Date.now()}`,
      activeLanguage: 'en',
      isPremium: false,
      coins: 0,
      onboardingCompleted: true,
      role,
    });

    return user;
  };

  it('allows admin token', async () => {
    const adminUser = await createUserWithRole('admin');
    const token = generateTestToken(adminUser._id.toString(), adminUser.email);

    const res = await request(app)
      .get('/api/v1/admin/health')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('role', 'admin');
  });

  it('allows editor token', async () => {
    const editorUser = await createUserWithRole('editor');
    const token = generateTestToken(editorUser._id.toString(), editorUser.email);

    const res = await request(app)
      .get('/api/v1/admin/health')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('role', 'editor');
  });

  it('allows reviewer token', async () => {
    const reviewerUser = await createUserWithRole('reviewer');
    const token = generateTestToken(reviewerUser._id.toString(), reviewerUser.email);

    const res = await request(app)
      .get('/api/v1/admin/health')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('role', 'reviewer');
  });

  it('denies learner token', async () => {
    const learnerUser = await createUserWithRole('learner');
    const token = generateTestToken(learnerUser._id.toString(), learnerUser.email);

    const res = await request(app)
      .get('/api/v1/admin/health')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'FORBIDDEN');
  });

  it('denies request with no token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/health');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('denies request with invalid token', async () => {
    const invalidToken = jwt.sign(
      { userId: 'invalid', email: 'invalid@test.com' },
      'wrong-secret',
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/api/v1/admin/health')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });
});
