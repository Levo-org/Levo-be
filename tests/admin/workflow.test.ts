import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import Vocabulary from '@/models/Vocabulary';
import AuditLog from '@/models/AuditLog';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from '../setup';

describe('Admin workflow API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  const createVocabularyItem = async (status: string, overrides: Record<string, unknown> = {}) => {
    return Vocabulary.create({
      targetLanguage: 'en',
      word: `word-${Date.now()}`,
      pronunciation: 'wɜːrd',
      meaning: '단어',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'Sample sentence.',
      exampleTranslation: '샘플 문장',
      audioUrl: '',
      order: 1,
      status,
      sourceType: 'manual',
      ...overrides,
    });
  };

  it('editor submits draft for review', async () => {
    const { user, token } = await createTestUser({ role: 'editor' });
    const item = await createVocabularyItem('draft', { createdBy: user._id });

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'in_review' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_review');
    const log = await AuditLog.findOne({ entityId: item._id, action: 'submit_review' });
    expect(log).not.toBeNull();
  });

  it('reviewer approves in_review content', async () => {
    const { user, token } = await createTestUser({ role: 'reviewer' });
    const item = await createVocabularyItem('in_review', { createdBy: user._id });

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.reviewedBy).toBeDefined();
    const log = await AuditLog.findOne({ entityId: item._id, action: 'approve' });
    expect(log).not.toBeNull();
  });

  it('admin publishes approved content', async () => {
    const { user, token } = await createTestUser({ role: 'admin' });
    const item = await createVocabularyItem('approved', { createdBy: user._id });

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'published' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedBy).toBeDefined();
    expect(res.body.data.publishedAt).toBeDefined();
    const log = await AuditLog.findOne({ entityId: item._id, action: 'publish' });
    expect(log).not.toBeNull();
  });

  it('editor cannot publish approved content', async () => {
    const { user, token } = await createTestUser({ role: 'editor' });
    const item = await createVocabularyItem('approved', { createdBy: user._id });

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'published' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid transitions', async () => {
    const { user, token } = await createTestUser({ role: 'admin' });
    const item = await createVocabularyItem('draft', { createdBy: user._id });

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'published' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('batch transition returns partial success', async () => {
    const { user, token } = await createTestUser({ role: 'reviewer' });
    const first = await createVocabularyItem('draft', { createdBy: user._id });
    const second = await createVocabularyItem('published', { createdBy: user._id });

    const res = await request(app)
      .post('/api/v1/admin/workflow/batch-transition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contentType: 'vocabulary',
        ids: [first._id.toString(), second._id.toString()],
        targetStatus: 'in_review',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.succeeded).toBe(1);
    expect(res.body.data.failed).toHaveLength(1);
  });

  it('queries audit logs by entity, action, and date range', async () => {
    const { user, token } = await createTestUser({ role: 'admin' });
    const item = await createVocabularyItem('draft', { createdBy: user._id });

    await createVocabularyItem('draft');

    await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'in_review' });

    const from = new Date(Date.now() - 1000 * 60).toISOString();
    const to = new Date(Date.now() + 1000 * 60).toISOString();

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ entityType: 'vocabulary', entityId: item._id.toString(), action: 'submit_review', from, to });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('fetches audit history for content item', async () => {
    const { user, token } = await createTestUser({ role: 'admin' });
    const item = await createVocabularyItem('draft', { createdBy: user._id });

    await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'in_review' });

    const res = await request(app)
      .get(`/api/v1/admin/workflow/audit-log/vocabulary/${item._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('supports audit log queries by actor', async () => {
    const { user, token } = await createTestUser({ role: 'admin' });
    const item = await createVocabularyItem('draft', { createdBy: user._id });

    await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${item._id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'in_review' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ actor: user._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('rejects audit log query with invalid entityId', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ entityId: 'invalid-id' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects audit log history with invalid entityId', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log/vocabulary/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects audit log query with invalid actor id', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ actor: 'invalid-id' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects audit log query with invalid from date', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: 'invalid-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects audit log query with invalid to date', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .get('/api/v1/admin/workflow/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .query({ to: 'invalid-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns empty result for batch transition with empty ids', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .post('/api/v1/admin/workflow/batch-transition')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'vocabulary', ids: [], targetStatus: 'in_review' });

    expect(res.status).toBe(200);
    expect(res.body.data.succeeded).toBe(0);
    expect(res.body.data.failed).toHaveLength(0);
  });

  it('rejects batch transition with missing fields', async () => {
    const { token } = await createTestUser({ role: 'admin' });

    const res = await request(app)
      .post('/api/v1/admin/workflow/batch-transition')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'vocabulary' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for non-existent content', async () => {
    const { token } = await createTestUser({ role: 'admin' });
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/v1/admin/workflow/vocabulary/${id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetStatus: 'in_review' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
