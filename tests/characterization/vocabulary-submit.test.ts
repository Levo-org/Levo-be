import request from 'supertest';
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
  TestUser,
} from '../setup';

describe('POST /api/v1/vocabulary/:id/answer — characterization', () => {
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

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/vocabulary/abc/answer')
      .send({ wordId: 'abc', correct: true });
    expect(res.status).toBe(401);
  });

  it('returns 404 for nonexistent word', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post(`/api/v1/vocabulary/${fakeId}/answer`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ wordId: fakeId, correct: true, targetLanguage: 'en' })
      .query({ targetLanguage: 'en' });

    expect(res.status).toBe(404);
  });

  describe('first answer (new word)', () => {
    it('creates vocabularyStatus entry on first correct answer', async () => {
      const vocab = await createVocabulary({ word: 'dog', meaning: '개' });

      const res = await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(true);
      expect(res.body.data.vocabularyStatus).toBeDefined();
      expect(res.body.data.vocabularyStatus.status).toBe('learning');
      expect(res.body.data.vocabularyStatus.correctCount).toBe(1);
      expect(res.body.data.vocabularyStatus.wrongCount).toBe(0);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(progress).not.toBeNull();
      expect(progress!.vocabularyStatus).toHaveLength(1);
    });

    it('creates vocabularyStatus entry on first wrong answer with wrong status', async () => {
      const vocab = await createVocabulary({ word: 'fox', meaning: '여우' });

      const res = await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: false });

      expect(res.status).toBe(200);
      expect(res.body.data.vocabularyStatus.status).toBe('wrong');
      expect(res.body.data.vocabularyStatus.correctCount).toBe(0);
      expect(res.body.data.vocabularyStatus.wrongCount).toBe(1);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      // CHARACTERIZATION: wrong first answer also adds wrongAnswers entry
      expect(progress!.wrongAnswers).toHaveLength(1);
      expect(progress!.wrongAnswers[0].type).toBe('vocabulary');
      expect(progress!.wrongAnswers[0].question).toBe('fox');
      expect(progress!.wrongAnswers[0].correctAnswer).toBe('여우');
    });

    it('creates UserProgress if none exists', async () => {
      const vocab = await createVocabulary();

      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(progress).not.toBeNull();
    });
  });

  describe('subsequent answers (existing entry)', () => {
    it('transitions to "completed" after 3 correct answers', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 2, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      const res = await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      expect(res.status).toBe(200);
      // CHARACTERIZATION: correctCount >= 3 => status 'completed'
      expect(res.body.data.vocabularyStatus.status).toBe('completed');
      expect(res.body.data.vocabularyStatus.correctCount).toBe(3);
    });

    it('stays "learning" with correctCount < 3', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      const res = await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      expect(res.status).toBe(200);
      expect(res.body.data.vocabularyStatus.status).toBe('learning');
      expect(res.body.data.vocabularyStatus.correctCount).toBe(2);
    });

    it('sets nextReviewAt based on REVIEW_INTERVALS_DAYS[correctCount-1] on correct', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 0, wrongCount: 0, lastReviewedAt: null, nextReviewAt: null },
        ],
      });

      const beforeTime = Date.now();
      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const item = progress!.vocabularyStatus[0];
      // CHARACTERIZATION: intervalIndex = Math.min(correctCount - 1, len - 1) => REVIEW_INTERVALS_DAYS[0] for first correct
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const expectedDays = REVIEW_INTERVALS_DAYS[0];
      const expectedMin = beforeTime + expectedDays * 24 * 60 * 60 * 1000 - 5000;
      const expectedMax = Date.now() + expectedDays * 24 * 60 * 60 * 1000 + 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
      expect(nextReview).toBeLessThan(expectedMax);
    });

    it('sets nextReviewAt to +REVIEW_INTERVALS_DAYS[0] (1 day) on wrong answer', async () => {
      const vocab = await createVocabulary();
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 2, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
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
      expect(item.status).toBe('wrong');
      // UPDATED (Task 4): vocabulary submit wrong answer now sets nextReviewAt to REVIEW_INTERVALS_DAYS[0] (+1 day),
      // consistent with review.completeReview wrong answer behavior
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const expectedMin = beforeTime + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
      const expectedMax = Date.now() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 + 5000;
      expect(nextReview).toBeGreaterThanOrEqual(expectedMin);
      expect(nextReview).toBeLessThanOrEqual(expectedMax);
    });

    it('pushes wrongAnswer entry on wrong answer for existing word', async () => {
      const vocab = await createVocabulary({ word: 'tree', meaning: '나무' });
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: new Date() },
        ],
      });

      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: false });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(progress!.wrongAnswers).toHaveLength(1);
      // CHARACTERIZATION: userAnswer is always empty string ''
      expect(progress!.wrongAnswers[0].userAnswer).toBe('');
    });
  });

  describe('XP award', () => {
    it('awards XP_CONFIG.QUIZ_CORRECT on correct answer', async () => {
      const vocab = await createVocabulary();

      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: true });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(profile!.xp).toBe(XP_CONFIG.QUIZ_CORRECT);
    });

    it('does NOT award XP on wrong answer', async () => {
      const vocab = await createVocabulary();

      await request(app)
        .post(`/api/v1/vocabulary/${vocab._id}/answer`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ targetLanguage: 'en' })
        .send({ wordId: vocab._id.toString(), correct: false });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(profile!.xp).toBe(0);
    });
  });
});
