import request from 'supertest';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createProgress,
  createLesson,
  createStreak,
  TestUser,
} from '../setup';

describe('POST /api/v1/lessons/:id/complete — characterization', () => {
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
    // The @ts-nocheck on streak.controller.ts hides this type error.
    // The validation error propagates through the catch block as a 400.
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

    // CHARACTERIZATION: even though the endpoint returns 400, the progress, profile,
    // user coins, and CoinTransaction are already saved because there are no
    // transactions — each await save() commits independently
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
    // CHARACTERIZATION: XP is saved before recordStudy throws
    // Level 1 requires 100 XP; 120 >= 100 => level-up happens, xp = 120 - 100 = 20
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
    expect(user!.coins).toBe(125); // 100 initial + 25

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
    expect(user!.coins).toBe(115); // 100 + 15
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
    // CHARACTERIZATION: level 1 requires 100 XP (level * 100); 120 XP >= 100 => level up
    expect(profile!.userLevel).toBe(2);
    // CHARACTERIZATION: remaining XP after level-up = xp - requiredXp (120 - 100 = 20)
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

    // CHARACTERIZATION: recordStudy creates a UserStreak with weeklyRecord: {},
    // then tries weeklyRecord[dayOfWeek] = true, which fails on save.
    // The streak record IS created (via UserStreak.create) but the subsequent
    // save with weeklyRecord mutation fails.
    const streak = await UserStreak.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
    expect(streak).not.toBeNull();
    // currentStreak was incremented in memory but save failed, so it depends on
    // whether the initial create or the failed save is what persists
    // The create sets currentStreak: 0, then recordStudy does streak.currentStreak += 1
    // then streak.save() fails — so the DB has the initial create values
    expect(streak!.currentStreak).toBe(0);
  });
});
