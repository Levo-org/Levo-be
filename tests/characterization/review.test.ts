import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createProgress,
  createVocabulary,
  createGrammar,
  TestUser,
} from '../setup';

describe('Review endpoints — characterization', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
    await createProfile(testUser.user._id, 'en');
  });

  describe('GET /api/v1/review (summary)', () => {
    it('returns all-zero when no progress exists', async () => {
      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        vocabulary: 0,
        grammar: 0,
        conversation: 0,
        total: 0,
      });
    });

    it('counts vocabulary due when lastReviewedAt is null (never reviewed)', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // CHARACTERIZATION: !lastReviewedAt counts as due
      expect(res.body.data.vocabulary).toBe(1);
      expect(res.body.data.total).toBe(1);
    });

    it('counts vocabulary due when nextReviewAt is in the past', async () => {
      const vocab = await createVocabulary();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'completed', correctCount: 3, wrongCount: 0, lastReviewedAt: pastDate, nextReviewAt: pastDate },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vocabulary).toBe(1);
    });

    it('does NOT count vocabulary when nextReviewAt is in the future', async () => {
      const vocab = await createVocabulary();
      const now = new Date();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'completed', correctCount: 3, wrongCount: 0, lastReviewedAt: now, nextReviewAt: futureDate },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.vocabulary).toBe(0);
    });

    it('counts grammar due using same rule as vocabulary (lastReviewedAt null OR nextReviewAt <= now)', async () => {
      const grammar1 = await createGrammar({ title: 'G-due' });
      const grammar2 = await createGrammar({ title: 'G-not-due' });
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          { grammarId: grammar1._id, progress: 50, quizScore: 0, lastReviewedAt: null, nextReviewAt: null },
          { grammarId: grammar2._id, progress: 75, quizScore: 0, lastReviewedAt: new Date(), nextReviewAt: futureDate },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grammar).toBe(1);
    });

    it('counts conversation due when lastReviewedAt is missing OR nextReviewAt is in the past (unified rule)', async () => {
      const convoId1 = new mongoose.Types.ObjectId();
      const convoId2 = new mongoose.Types.ObjectId();
      const convoId3 = new mongoose.Types.ObjectId();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // CHARACTERIZATION: conversation now uses unified due rule — due if !lastReviewedAt OR nextReviewAt <= now
      await createProgress(testUser.user._id, 'en', {
        conversationStatus: [
          // never reviewed -> due
          { conversationId: convoId1, completed: true, pronunciationScore: 80, lastReviewedAt: null, nextReviewAt: null },
          // reviewed but nextReviewAt in past -> due
          { conversationId: convoId2, completed: true, pronunciationScore: 70, lastReviewedAt: now, nextReviewAt: pastDate },
          // reviewed and nextReviewAt in future -> NOT due
          { conversationId: convoId3, completed: true, pronunciationScore: 60, lastReviewedAt: now, nextReviewAt: futureDate },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversation).toBe(2);
    });
  });

  describe('GET /api/v1/review/:category', () => {
    it('returns 400 for invalid category', async () => {
      await createProgress(testUser.user._id, 'en');

      const res = await request(app)
        .get('/api/v1/review/invalid')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(400);
    });

    it('returns empty array when no progress exists', async () => {
      const res = await request(app)
        .get('/api/v1/review/vocabulary')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns due vocabulary items with content populated', async () => {
      const vocab = await createVocabulary({ word: 'test', meaning: '테스트' });
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review/vocabulary')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('content');
      expect(res.body.data[0].content.word).toBe('test');
    });

    it('respects limit parameter', async () => {
      const vocab1 = await createVocabulary({ word: 'a', meaning: '1' });
      const vocab2 = await createVocabulary({ word: 'b', meaning: '2' });
      const vocab3 = await createVocabulary({ word: 'c', meaning: '3' });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab1._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
          { wordId: vocab2._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
          { wordId: vocab3._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      const res = await request(app)
        .get('/api/v1/review/vocabulary?limit=2')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/v1/review (completeReview)', () => {
    it('updates vocabulary on correct answer — advances nextReviewAt', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      const res = await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'vocabulary', contentId: vocab._id.toString(), correct: true });

      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(true);
      expect(res.body.data.xpEarned).toBe(XP_CONFIG.REVIEW_COMPLETE);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus.find(v => v.wordId.toString() === vocab._id.toString());
      expect(item!.correctCount).toBe(1);
      // UPDATED (Task 4): status is now 'learning' until correctCount >= 3
      expect(item!.status).toBe('learning');
      expect(item!.lastReviewedAt).not.toBeNull();
      expect(item!.nextReviewAt).not.toBeNull();
    });

    it('resets nextReviewAt to 1 day on wrong answer', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 2, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      const beforeTime = Date.now();
      const res = await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'vocabulary', contentId: vocab._id.toString(), correct: false });

      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(false);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus.find(v => v.wordId.toString() === vocab._id.toString());
      expect(item!.wrongCount).toBe(1);
      expect(item!.status).toBe('wrong');
      // CHARACTERIZATION: wrong answer resets to REVIEW_INTERVALS_DAYS[0] days
      const nextReview = new Date(item!.nextReviewAt!).getTime();
      const expectedMin = beforeTime + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
      const expectedMax = Date.now() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 + 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
      expect(nextReview).toBeLessThan(expectedMax);
    });

    it('awards XP via UserLanguageProfile on review complete', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'vocabulary', contentId: vocab._id.toString(), correct: true });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(profile!.xp).toBe(XP_CONFIG.REVIEW_COMPLETE);
    });

    it('updates grammar on correct answer — increments progress by 25 (unified with quiz)', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          { grammarId: grammar._id, progress: 50, quizScore: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'grammar', contentId: grammar._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.grammarStatus.find(g => g.grammarId.toString() === grammar._id.toString());
      // UPDATED (Task 4): review now increments grammar.progress by 25, consistent with quiz submit
      expect(item!.progress).toBe(75);
      expect(item!.lastReviewedAt).not.toBeNull();
      expect(item!.nextReviewAt).not.toBeNull();
    });

    it('grammar review wrong answer — resets nextReviewAt but does NOT change progress', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          { grammarId: grammar._id, progress: 75, quizScore: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      const beforeTime = Date.now();
      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'grammar', contentId: grammar._id.toString(), correct: false });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.grammarStatus.find(g => g.grammarId.toString() === grammar._id.toString());
      // CHARACTERIZATION: grammar wrong answer does NOT decrement progress
      expect(item!.progress).toBe(75);
      // CHARACTERIZATION: resets to REVIEW_INTERVALS_DAYS[0] days
      const nextReview = new Date(item!.nextReviewAt!).getTime();
      const expectedMin = beforeTime + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
    });

    it('returns 404 for conversation with no matching record', async () => {
      await createProgress(testUser.user._id, 'en');

      const res = await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'conversation', contentId: 'abc', correct: true });

      // UPDATED (Task 4): conversation is now a supported review category;
      // returns 404 when no matching conversationStatus entry found
      expect(res.status).toBe(404);
    });
  });
});
