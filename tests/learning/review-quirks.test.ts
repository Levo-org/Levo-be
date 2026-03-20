import request from 'supertest';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import { REVIEW_INTERVALS_DAYS } from '@/utils/constants';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createProgress,
  createGrammar,
  createVocabulary,
  TestUser,
} from '../helpers/testDb';

describe('Review quirks — characterization of known behavioral inconsistencies', () => {
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

  describe('Grammar progress increment: unified at +25 for both review and quiz submit', () => {
    it('review.completeReview increments grammar progress by 25', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 50,
            quizScore: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
        ],
      });

      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'grammar', contentId: grammar._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.grammarStatus.find(g => g.grammarId.toString() === grammar._id.toString());
      expect(item!.progress).toBe(75);
    });

    it('grammar.submitQuizAnswer increments grammar progress by 25', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 50,
            quizScore: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
        ],
      });

      await request(app)
        .post(`/api/v1/grammar/${grammar._id}/quiz/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ grammarId: grammar._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.grammarStatus.find(g => g.grammarId.toString() === grammar._id.toString());
      // CHARACTERIZATION: grammar quiz submit uses Math.min(progress + 25, 100)
      expect(item!.progress).toBe(75);
    });

    it('shows no delta: both paths increment by 25', async () => {
      const grammarA = await createGrammar({ title: 'Review Path' });
      const grammarB = await createGrammar({ title: 'Quiz Path' });

      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammarA._id,
            progress: 0,
            quizScore: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
          {
            grammarId: grammarB._id,
            progress: 0,
            quizScore: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
        ],
      });

      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'grammar', contentId: grammarA._id.toString(), correct: true });

      await request(app)
        .post(`/api/v1/grammar/${grammarB._id}/quiz/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ grammarId: grammarB._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const reviewItem = progress!.grammarStatus.find(g => g.grammarId.toString() === grammarA._id.toString());
      const quizItem = progress!.grammarStatus.find(g => g.grammarId.toString() === grammarB._id.toString());

      expect(reviewItem!.progress).toBe(25);
      expect(quizItem!.progress).toBe(25);
      expect(quizItem!.progress - reviewItem!.progress).toBe(0);
    });
  });

  describe('Grammar review wrong answer preserves progress (no decrement)', () => {
    it('grammar wrong via review does NOT change progress value', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 75,
            quizScore: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(),
          },
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
      // CHARACTERIZATION: resets nextReviewAt to REVIEW_INTERVALS_DAYS[0] days
      const nextReview = new Date(item!.nextReviewAt!).getTime();
      const expectedMin = beforeTime + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
    });
  });

  describe('completeReview reads category from req.body, ignores URL :category param', () => {
    it('URL says "vocabulary" but body says "grammar" — grammar gets updated', async () => {
      const grammar = await createGrammar();
      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 10,
            quizScore: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
        ],
      });

      // CHARACTERIZATION: URL :category is "vocabulary" but body.category is "grammar"
      const res = await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'grammar', contentId: grammar._id.toString(), correct: true });

      expect(res.status).toBe(200);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.grammarStatus.find(g => g.grammarId.toString() === grammar._id.toString());
      // CHARACTERIZATION: grammar was updated even though URL said "vocabulary"
      expect(item!.progress).toBe(35);
      expect(item!.lastReviewedAt).not.toBeNull();
    });

    it('URL says "grammar" but body says "vocabulary" — vocabulary gets updated', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      // CHARACTERIZATION: URL :category is "grammar" but body.category is "vocabulary"
      const res = await request(app)
        .post('/api/v1/review/grammar/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'vocabulary', contentId: vocab._id.toString(), correct: true });

      expect(res.status).toBe(200);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus.find(v => v.wordId.toString() === vocab._id.toString());
      // CHARACTERIZATION: vocabulary was updated even though URL said "grammar"
      expect(item!.correctCount).toBe(1);
      expect(item!.status).toBe('learning');
    });
  });

  describe('Vocabulary wrong answer: unified at +1 day for both submit and review', () => {
    it('vocabulary.submitAnswer wrong sets nextReviewAt to +1 day', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        ],
      });

      const beforeTime = Date.now();
      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: false });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus[0];
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(nextReview).toBeGreaterThanOrEqual(beforeTime + oneDayMs - 1000);
      expect(nextReview).toBeLessThanOrEqual(Date.now() + oneDayMs + 1000);
    });

    it('review.completeReview wrong sets nextReviewAt to +1 day', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      const beforeTime = Date.now();
      await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'vocabulary', contentId: vocab._id.toString(), correct: false });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus[0];
      // CHARACTERIZATION: review wrong => nextReviewAt = now + REVIEW_INTERVALS_DAYS[0] days (+1 day)
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const oneDayMs = REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000;
      const expectedMin = beforeTime + oneDayMs - 5000;
      const expectedMax = Date.now() + oneDayMs + 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
      expect(nextReview).toBeLessThan(expectedMax);
    });
  });
});
