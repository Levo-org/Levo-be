import request from 'supertest';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG, COIN_CONFIG } from '@/utils/constants';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createProgress,
  createLesson,
  createStreak,
  createVocabulary,
  TestUser,
} from '../helpers/testDb';

describe('Vocabulary Submit + Lesson Completion — characterization', () => {
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

  describe('POST /api/v1/vocabulary/:id/answer', () => {
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
      // CHARACTERIZATION: intervalIndex = Math.min(correctCount - 1, len - 1) => REVIEW_INTERVALS_DAYS[0]
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const expectedDays = REVIEW_INTERVALS_DAYS[0];
      const expectedMin = beforeTime + expectedDays * 24 * 60 * 60 * 1000 - 5000;
      const expectedMax = Date.now() + expectedDays * 24 * 60 * 60 * 1000 + 5000;
      expect(nextReview).toBeGreaterThan(expectedMin);
      expect(nextReview).toBeLessThan(expectedMax);
    });

    it('sets nextReviewAt = now + REVIEW_INTERVALS_DAYS[0] (+1 day) on wrong answer', async () => {
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
      // Task 4: vocabulary submit wrong sets nextReviewAt = now + REVIEW_INTERVALS_DAYS[0] (+1 day), unified with review
      const nextReview = new Date(item.nextReviewAt!).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(nextReview).toBeGreaterThanOrEqual(beforeTime + oneDayMs - 1000);
      expect(nextReview).toBeLessThanOrEqual(Date.now() + oneDayMs + 1000);
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

  describe('POST /api/v1/lessons/:id/complete', () => {
    beforeEach(async () => {
      testUser = await createTestUser({ coins: 100 });
      await createProfile(testUser.user._id, 'en', { xp: 0, userLevel: 1 });
    });

    it('returns 401 without auth token', async () => {
      const lesson = await createLesson();
      const res = await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent lesson', async () => {
      const fakeId = '000000000000000000000000';
      const res = await request(app)
        .post(`/api/v1/lessons/${fakeId}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 80, correctAnswers: 4, totalQuizzes: 5 });

      expect(res.status).toBe(404);
    });

    it('fails with VALIDATION_ERROR due to StreakController.recordStudy weeklyRecord schema mismatch', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en', {
        currentLessonId: lesson._id,
        completedLessons: [],
      });

      const res = await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      // CHARACTERIZATION: lesson complete fails because StreakController.recordStudy
      // treats weeklyRecord as a plain object (weeklyRecord[dayOfWeek] = true)
      // but the UserStreak schema defines weeklyRecord as an array of subdocuments.
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/weeklyRecord/);
    });

    it('still updates UserProgress before streak failure (non-transactional)', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en', {
        currentLessonId: lesson._id,
        completedLessons: [],
      });

      const res = await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      // CHARACTERIZATION: even though the endpoint returns 400, the progress is already saved
      expect(res.status).toBe(400);

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(progress!.completedLessons.map(l => l.toString())).toContain(lesson._id.toString());
      expect(progress!.currentLessonId).toBeNull();
    });

    it('still awards XP before streak failure', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      // CHARACTERIZATION: XP is saved before recordStudy throws — level-up happens
      expect(profile!.xp).toBe(20);
      expect(profile!.userLevel).toBe(2);
    });

    it('still awards coins and creates CoinTransaction before streak failure', async () => {
      const lesson = await createLesson({ coinReward: 25 });
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const user = await User.findById(testUser.user._id);
      // CHARACTERIZATION: coins saved before streak error
      expect(user!.coins).toBe(125);

      const txn = await CoinTransaction.findOne({ userId: testUser.user._id });
      expect(txn).not.toBeNull();
      expect(txn!.type).toBe('earn');
      expect(txn!.amount).toBe(25);
      expect(txn!.reason).toBe('lesson_complete');
      expect(txn!.balanceAfter).toBe(125);
    });

    it('uses COIN_CONFIG.LESSON_COMPLETE (15) fallback when coinReward is 0', async () => {
      const lesson = await createLesson({ coinReward: 0 });
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const user = await User.findById(testUser.user._id);
      // CHARACTERIZATION: coinReward=0 is falsy => falls back to COIN_CONFIG.LESSON_COMPLETE (15)
      expect(user!.coins).toBe(115);
    });

    it('does not duplicate lessonId in completedLessons on repeated complete', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en', {
        currentLessonId: lesson._id,
        completedLessons: [lesson._id],
      });

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      const matches = progress!.completedLessons.filter(l => l.toString() === lesson._id.toString());
      // CHARACTERIZATION: controller checks includes() before pushing, so no duplicates
      expect(matches).toHaveLength(1);
    });

    it('creates UserProgress if none exists', async () => {
      const lesson = await createLesson();

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(progress).not.toBeNull();
      expect(progress!.completedLessons.map(l => l.toString())).toContain(lesson._id.toString());
      expect(progress!.currentLessonId).toBeNull();
    });

    it('triggers level-up when xp >= level * 100', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      // CHARACTERIZATION: level 1 requires 100 XP; 120 XP >= 100 => level up
      expect(profile!.userLevel).toBe(2);
      expect(profile!.xp).toBe(20);
    });

    it('does NOT level-up when xp < required (level * 100)', async () => {
      const lesson = await createLesson();
      await UserLanguageProfile.findOneAndUpdate(
        { userId: testUser.user._id, targetLanguage: 'en' },
        { userLevel: 2, xp: 0 },
      );
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const profile = await UserLanguageProfile.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      // CHARACTERIZATION: level 2 requires 200 XP; 120 < 200 => no level-up
      expect(profile!.userLevel).toBe(2);
      expect(profile!.xp).toBe(120);
    });

    it('recordStudy creates UserStreak if none exists, but save fails on weeklyRecord', async () => {
      const lesson = await createLesson();
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      // CHARACTERIZATION: recordStudy creates a UserStreak then tries
      // weeklyRecord[dayOfWeek] = true which fails on save
      const streak = await UserStreak.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
      expect(streak).not.toBeNull();
      expect(streak!.currentStreak).toBe(0);
    });
  });
});
