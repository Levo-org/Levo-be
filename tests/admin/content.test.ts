import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '@/app';
import { config } from '@/config';
import User from '@/models/User';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import ExampleSentence from '@/models/ExampleSentence';
import AuditLog from '@/models/AuditLog';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup';

const BASE_URL = '/api/v1/admin/content';

const generateTestToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    config.jwt.secret,
    { expiresIn: '1h' },
  );
};

const createUserWithRole = async (role: 'learner' | 'editor' | 'reviewer' | 'admin') => {
  const user = await User.create({
    email: `${role}-${Date.now()}-${Math.random()}@example.com`,
    name: `${role}-user`,
    profileImage: '',
    provider: 'google',
    providerId: `${role}-${Date.now()}-${Math.random()}`,
    activeLanguage: 'en',
    isPremium: false,
    coins: 0,
    onboardingCompleted: true,
    role,
  });
  const token = generateTestToken(user._id.toString(), user.email);
  return { user, token };
};

describe('Admin Content API', () => {
  let adminToken: string;
  let adminUser: InstanceType<typeof User>;
  let editorToken: string;
  let editorUser: InstanceType<typeof User>;
  let reviewerToken: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
    const admin = await createUserWithRole('admin');
    adminToken = admin.token;
    adminUser = admin.user;
    const editor = await createUserWithRole('editor');
    editorToken = editor.token;
    editorUser = editor.user;
    const reviewer = await createUserWithRole('reviewer');
    reviewerToken = reviewer.token;
  });

  describe('GET /:contentType — List with pagination', () => {
    it('returns paginated vocabulary list with default params', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'apple', pronunciation: 'aepl', meaning: '사과', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1 },
        { targetLanguage: 'en', word: 'banana', pronunciation: 'bənænə', meaning: '바나나', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 2 },
        { targetLanguage: 'en', word: 'cherry', pronunciation: 'tʃɛri', meaning: '체리', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 3 },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('respects page and limit params', async () => {
      for (let i = 0; i < 5; i++) {
        await Vocabulary.create({
          targetLanguage: 'en', word: `word-${i}`, pronunciation: '', meaning: `meaning-${i}`,
          partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: i,
        });
      }

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?page=2&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('clamps limit to 100 when exceeding max', async () => {
      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?limit=500`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });
  });

  describe('GET /:contentType — Filters', () => {
    it('filters by status', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'draft-word', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1, status: 'draft' },
        { targetLanguage: 'en', word: 'published-word', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 2, status: 'published' },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?status=draft`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].word).toBe('draft-word');
    });

    it('filters by targetLanguage', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'english', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1 },
        { targetLanguage: 'ja', word: 'japanese', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 2 },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?targetLanguage=ja`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].word).toBe('japanese');
    });

    it('filters by level', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'easy', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1 },
        { targetLanguage: 'en', word: 'hard', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'advanced', chapter: 1, order: 2 },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?level=advanced`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].word).toBe('hard');
    });
  });

  describe('GET /:contentType — Text search', () => {
    it('searches vocabulary by word', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'elephant', pronunciation: '', meaning: '코끼리', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1 },
        { targetLanguage: 'en', word: 'ant', pronunciation: '', meaning: '개미', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 2 },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?search=eleph`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].word).toBe('elephant');
    });

    it('searches grammar by title', async () => {
      await Grammar.create([
        { targetLanguage: 'en', title: 'Present Perfect', level: 'intermediate', order: 1 },
        { targetLanguage: 'en', title: 'Past Simple', level: 'beginner', order: 2 },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/grammar?search=perfect`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Present Perfect');
    });

    it('search is case-insensitive', async () => {
      await Vocabulary.create({
        targetLanguage: 'en', word: 'Apple', pronunciation: '', meaning: '사과',
        partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
      });

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary?search=apple`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /:contentType/:id — Detail', () => {
    it('returns full document with populated refs', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'test-word', pronunciation: 'tɛst',
        meaning: '테스트', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        createdBy: adminUser._id,
      });

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.word).toBe('test-word');
      expect(res.body.data.createdBy).toMatchObject({
        name: adminUser.name,
        email: adminUser.email,
      });
    });

    it('returns 404 for non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`${BASE_URL}/vocabulary/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /:contentType — Create', () => {
    it('creates vocabulary in draft status and creates audit log', async () => {
      const body = {
        targetLanguage: 'en',
        word: 'newword',
        pronunciation: 'njuːwɜːrd',
        meaning: '새단어',
        partOfSpeech: 'noun',
        level: 'beginner',
        chapter: 1,
        order: 1,
      };

      const res = await request(app)
        .post(`${BASE_URL}/vocabulary`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.word).toBe('newword');
      expect(res.body.data.createdBy.toString()).toBe(editorUser._id.toString());

      const auditLogs = await AuditLog.find({ entityId: res.body.data._id });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('create');
    });

    it('rejects creation by reviewer (no write permission)', async () => {
      const body = {
        targetLanguage: 'en',
        word: 'forbidden',
        pronunciation: '',
        meaning: '금지',
        partOfSpeech: 'noun',
        level: 'beginner',
        chapter: 1,
        order: 1,
      };

      const res = await request(app)
        .post(`${BASE_URL}/vocabulary`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send(body);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /:contentType/:id — Update', () => {
    it('updates draft content and creates audit log with changedFields', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'old-word', pronunciation: '',
        meaning: '옛단어', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        status: 'draft', createdBy: editorUser._id,
      });

      const res = await request(app)
        .put(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ word: 'new-word', meaning: '새단어' });

      expect(res.status).toBe(200);
      expect(res.body.data.word).toBe('new-word');
      expect(res.body.data.meaning).toBe('새단어');

      const auditLogs = await AuditLog.find({ entityId: vocab._id, action: 'update' });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].changedFields).toBeDefined();
      expect(auditLogs[0].changedFields!.word).toMatchObject({ from: 'old-word', to: 'new-word' });
    });

    it('allows updating in_review content', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'review-word', pronunciation: '',
        meaning: '리뷰', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        status: 'in_review',
      });

      const res = await request(app)
        .put(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ meaning: '수정된 리뷰' });

      expect(res.status).toBe(200);
      expect(res.body.data.meaning).toBe('수정된 리뷰');
    });

    it('rejects update on published content with 400', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'published-word', pronunciation: '',
        meaning: '출판됨', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        status: 'published',
      });

      const res = await request(app)
        .put(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ meaning: '변경 시도' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects update on approved content with 400', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'approved-word', pronunciation: '',
        meaning: '승인됨', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        status: 'approved',
      });

      const res = await request(app)
        .put(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ meaning: '변경 시도' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:contentType/:id — Archive', () => {
    it('archives content and creates audit log', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'to-delete', pronunciation: '',
        meaning: '삭제대상', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
        status: 'draft',
      });

      const res = await request(app)
        .delete(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const archived = await Vocabulary.findById(vocab._id);
      expect(archived!.status).toBe('archived');

      const auditLogs = await AuditLog.find({ entityId: vocab._id, action: 'archive' });
      expect(auditLogs).toHaveLength(1);
    });

    it('rejects delete by editor (admin only)', async () => {
      const vocab = await Vocabulary.create({
        targetLanguage: 'en', word: 'no-delete', pronunciation: '',
        meaning: '삭제불가', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1,
      });

      const res = await request(app)
        .delete(`${BASE_URL}/vocabulary/${vocab._id}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`${BASE_URL}/vocabulary/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /stats/summary — Content statistics', () => {
    it('returns correct counts per content type per status', async () => {
      await Vocabulary.create([
        { targetLanguage: 'en', word: 'w1', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 1, status: 'draft' },
        { targetLanguage: 'en', word: 'w2', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 2, status: 'draft' },
        { targetLanguage: 'en', word: 'w3', pronunciation: '', meaning: 'm', partOfSpeech: 'noun', level: 'beginner', chapter: 1, order: 3, status: 'published' },
      ]);

      await Grammar.create([
        { targetLanguage: 'en', title: 'G1', level: 'beginner', order: 1, status: 'published' },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/stats/summary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vocabulary).toMatchObject({ draft: 2, published: 1 });
      expect(res.body.data.grammar).toMatchObject({ published: 1 });
    });

    it('returns empty objects for content types with no data', async () => {
      const res = await request(app)
        .get(`${BASE_URL}/stats/summary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vocabulary).toEqual({});
      expect(res.body.data.grammar).toEqual({});
      expect(res.body.data.exampleSentence).toEqual({});
    });
  });

  describe('Invalid content type', () => {
    it('returns 400 for unknown content type', async () => {
      const res = await request(app)
        .get(`${BASE_URL}/invalid`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Access control — learner denied', () => {
    it('denies learner access to content list', async () => {
      const learner = await createUserWithRole('learner');

      const res = await request(app)
        .get(`${BASE_URL}/vocabulary`)
        .set('Authorization', `Bearer ${learner.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('ExampleSentence content type', () => {
    it('lists and searches exampleSentence by originalText', async () => {
      await ExampleSentence.create([
        { targetLanguage: 'en', topic: 'food', level: 'beginner', originalText: 'I like apples', translation: '나는 사과를 좋아한다', normalizedKey: 'i like apples' },
        { targetLanguage: 'en', topic: 'food', level: 'beginner', originalText: 'She eats bread', translation: '그녀는 빵을 먹는다', normalizedKey: 'she eats bread' },
      ]);

      const res = await request(app)
        .get(`${BASE_URL}/exampleSentence?search=apples`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].originalText).toBe('I like apples');
    });
  });
});
