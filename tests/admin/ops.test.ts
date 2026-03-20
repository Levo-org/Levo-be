import request from 'supertest';
import app from '@/app';
import { connectTestDb, disconnectTestDb, clearCollections, createVocabulary, createTestUser } from '../setup';
import ImportBatch from '@/models/ImportBatch';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

const BASE_URL = '/api/v1/admin/ops';

describe('Admin Ops API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  it('returns dashboard structure for admin', async () => {
    // create some content and audit logs
    const vocab = await createVocabulary({ status: 'published' });
    await AuditLog.create({ actor: new mongoose.Types.ObjectId(), action: 'publish', entityType: 'vocabulary', entityId: vocab._id });
    await ImportBatch.create({ fileName: 'a.csv', fileType: 'csv', contentType: 'vocabulary', status: 'failed', uploadedBy: new mongoose.Types.ObjectId() });

    const admin = await createTestUser({ role: 'admin' });
    const token = admin.token;
    const res = await request(app).get(`${BASE_URL}/dashboard`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('contentStats');
    expect(res.body.data).toHaveProperty('batchStats');
    expect(res.body.data).toHaveProperty('recentFailures');
    expect(res.body.data).toHaveProperty('recentAuditLogs');
    expect(res.body.data).toHaveProperty('publishingActivity');
  });

  it('returns health info for admin', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const token = admin.token;
    const res = await request(app).get(`${BASE_URL}/health`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('db');
    expect(res.body.data).toHaveProperty('collections');
  });

  it('forbids non-admin access', async () => {
    const editor = await createTestUser({ role: 'editor' });
    const res = await request(app).get(`${BASE_URL}/dashboard`).set('Authorization', `Bearer ${editor.token}`);
    expect(res.status).toBe(403);
  });
});
