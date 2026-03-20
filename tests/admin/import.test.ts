import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import ImportBatch from '@/models/ImportBatch';
import Vocabulary from '@/models/Vocabulary';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from '../setup';

describe('Admin Import API', () => {
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => { await connectTestDb(); });
  afterAll(async () => { await disconnectTestDb(); });
  beforeEach(async () => {
    await clearCollections();
    const admin = await createTestUser({ role: 'admin' });
    const editor = await createTestUser({ role: 'editor' });
    adminToken = admin.token;
    editorToken = editor.token;
  });

  const uploadCsv = (csvContent: string, fileName = 'test.csv', token = adminToken) => {
    return request(app)
      .post('/api/v1/admin/import/upload')
      .set('Authorization', `Bearer ${token}`)
      .query({ contentType: 'vocabulary', targetLanguage: 'en' })
      .attach('file', Buffer.from(csvContent), { filename: fileName });
  };

  it('uploads valid CSV and returns preview with batchId and counts', async () => {
    const csv = 'word,meaning,partOfSpeech\nhello,안녕,noun\nworld,세계,noun\n';
    const res = await uploadCsv(csv);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.batchId).toBeDefined();
    expect(data.validRows).toBe(2);
    expect(data.invalidRows).toBe(0);
    expect(Array.isArray(data.preview)).toBe(true);
    const batch = await ImportBatch.findById(data.batchId);
    expect(batch).not.toBeNull();
    expect(batch!.status).toBe('staged');
  });

  it('reports error rows for CSV missing required fields', async () => {
    const csv = 'word,meaning,partOfSpeech\n,빈의미,noun\nfoo,,noun\n';
    const res = await uploadCsv(csv);
    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.invalidRows).toBeGreaterThanOrEqual(1);
    const preview = data.preview as any[];
    const invalid = preview.filter((p) => p.status === 'invalid');
    expect(invalid.length).toBeGreaterThanOrEqual(1);
    expect(invalid[0].errors.length).toBeGreaterThanOrEqual(1);
  });

  it('detects duplicate rows when same word exists in DB', async () => {
    await Vocabulary.create({ targetLanguage: 'en', word: 'apple', meaning: '사과', partOfSpeech: 'noun', level: 'beginner', chapter: 1, exampleSentence: '', exampleTranslation: '', audioUrl: '', order: 1 });
    const csv = 'word,meaning,partOfSpeech\napple,사과2,noun\nbanana,바나나,noun\n';
    const res = await uploadCsv(csv);
    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.duplicateRows).toBe(1);
    const preview = data.preview as any[];
    const dup = preview.find((p) => p.data.word === 'apple');
    expect(dup.status).toBe('duplicate');
  });

  it('confirms staged batch and creates content documents', async () => {
    const csv = 'word,meaning,partOfSpeech\ncar,자동차,noun\n';
    const uploadRes = await uploadCsv(csv);
    const batchId = uploadRes.body.data.batchId;

    const { user, token } = await createTestUser({ role: 'admin' });
    const res = await request(app)
      .post(`/api/v1/admin/import/${batchId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const batch = await ImportBatch.findById(batchId);
    expect(batch).not.toBeNull();
    expect(batch!.status).toBe('completed');
    
    const vocab = await Vocabulary.findOne({ word: 'car' });
    expect(vocab).not.toBeNull();
    expect(vocab!.status).toBe('draft');
    expect(vocab!.sourceType).toBe('csv_import');
  });

  it('cancels staged batch', async () => {
    const csv = 'word,meaning,partOfSpeech\nbike,자전거,noun\n';
    const uploadRes = await uploadCsv(csv);
    const batchId = uploadRes.body.data.batchId;

    const { user, token } = await createTestUser({ role: 'editor' });
    const res = await request(app)
      .post(`/api/v1/admin/import/${batchId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    const batch = await ImportBatch.findById(batchId);
    expect(batch).not.toBeNull();
    expect(batch!.status).toBe('cancelled');
  });

  it('lists batches with pagination', async () => {
    
    for (let i = 0; i < 3; i++) {
      const csv = `word,meaning,partOfSpeech\nword${i},의미${i},noun\n`;
      await uploadCsv(csv);
    }

    const res = await request(app)
      .get('/api/v1/admin/import/batches')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toBeDefined();
  });

  it('gets batch detail and error summary', async () => {
    const csv = 'word,meaning,partOfSpeech\n,의미,noun\n';
    const uploadRes = await uploadCsv(csv);
    const batchId = uploadRes.body.data.batchId;

    const res = await request(app)
      .get(`/api/v1/admin/import/${batchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batch._id).toBe(batchId);
    expect(res.body.data.errorSummary).toBeDefined();
  });

  it('gets batch errors', async () => {
    const csv = 'word,meaning,partOfSpeech\n,의미,noun\n';
    const uploadRes = await uploadCsv(csv);
    const batchId = uploadRes.body.data.batchId;

    const res = await request(app)
      .get(`/api/v1/admin/import/${batchId}/errors`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.errors)).toBe(true);
  });

  it('rejects invalid file type', async () => {
    const csv = 'word,meaning\na,b\n';
    const res = await uploadCsv(csv, 'bad.txt');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires auth for upload', async () => {
    const csv = 'word,meaning\nfoo,bar\n';
    const res = await request(app)
      .post('/api/v1/admin/import/upload')
      .query({ contentType: 'vocabulary', targetLanguage: 'en' })
      .attach('file', Buffer.from(csv), { filename: 'test.csv' });

    expect(res.status).toBe(401);
  });

  it('confirming an already-cancelled batch returns error', async () => {
    const csv = 'word,meaning,partOfSpeech\ntram,전차,noun\n';
    const uploadRes = await uploadCsv(csv);
    const batchId = uploadRes.body.data.batchId;

    const { user, token } = await createTestUser({ role: 'admin' });
    await request(app)
      .post(`/api/v1/admin/import/${batchId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const res = await request(app)
      .post(`/api/v1/admin/import/${batchId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
