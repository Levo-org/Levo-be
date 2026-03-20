import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createStreak,
  createProgress,
  createLesson,
  createVocabulary,
  TestUser,
} from '../setup';

describe('GET /api/v1/home — characterization', () => {
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
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/home');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns home data with empty progress (new user)', async () => {
    await createProfile(testUser.user._id, 'en');

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data).toHaveProperty('streak');
    expect(res.body.data).toHaveProperty('nextLesson');
    expect(res.body.data).toHaveProperty('todaySummary');

    expect(res.body.data.user).toMatchObject({
      name: 'Test User',
      coins: 100,
      isPremium: false,
    });

    // CHARACTERIZATION: streak defaults when no UserStreak record
    expect(res.body.data.streak).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      todayCompleted: false,
    });

    // CHARACTERIZATION: todaySummary with no progress
    expect(res.body.data.todaySummary).toEqual({
      studied: false,
      completedLessons: 0,
      learnedWords: 0,
    });
  });

  it('returns nextLesson from currentLessonId when set', async () => {
    const lesson = await createLesson({ lessonTitle: 'Current Lesson' });
    await createProfile(testUser.user._id, 'en');
    await createProgress(testUser.user._id, 'en', {
      currentLessonId: lesson._id,
    });

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.nextLesson).not.toBeNull();
    expect(res.body.data.nextLesson.lessonTitle).toBe('Current Lesson');
    expect(res.body.data.nextLesson).toHaveProperty('_id');
    expect(res.body.data.nextLesson).toHaveProperty('unitNumber');
    expect(res.body.data.nextLesson).toHaveProperty('estimatedMinutes');
    expect(res.body.data.nextLesson).toHaveProperty('xpReward');
  });

  it('falls back to first incomplete lesson when currentLessonId is not set', async () => {
    const lesson1 = await createLesson({ order: 1, lessonTitle: 'L1' });
    const lesson2 = await createLesson({ order: 2, lessonTitle: 'L2', lessonNumber: 2 });

    await createProfile(testUser.user._id, 'en');
    await createProgress(testUser.user._id, 'en', {
      completedLessons: [lesson1._id],
      currentLessonId: null,
    });

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    // CHARACTERIZATION: falls back to first non-completed lesson by order
    expect(res.body.data.nextLesson).not.toBeNull();
    expect(res.body.data.nextLesson.lessonTitle).toBe('L2');
  });

  it('returns null nextLesson when all lessons are completed', async () => {
    const lesson = await createLesson();
    await createProfile(testUser.user._id, 'en');
    await createProgress(testUser.user._id, 'en', {
      completedLessons: [lesson._id],
      currentLessonId: null,
    });

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.nextLesson).toBeNull();
  });

  it('counts learnedWords from vocabularyStatus with status "completed"', async () => {
    const vocab1 = await createVocabulary({ word: 'hello', meaning: '안녕' });
    const vocab2 = await createVocabulary({ word: 'world', meaning: '세계' });
    const vocab3 = await createVocabulary({ word: 'cat', meaning: '고양이' });

    await createProfile(testUser.user._id, 'en');
    await createProgress(testUser.user._id, 'en', {
      vocabularyStatus: [
        { wordId: vocab1._id, status: 'completed', correctCount: 3, wrongCount: 0 },
        { wordId: vocab2._id, status: 'learning', correctCount: 1, wrongCount: 0 },
        { wordId: vocab3._id, status: 'wrong', correctCount: 0, wrongCount: 1 },
      ],
    });

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    // CHARACTERIZATION: only "completed" status counts as learnedWords
    expect(res.body.data.todaySummary.learnedWords).toBe(1);
    expect(res.body.data.todaySummary.completedLessons).toBe(0);
  });

  it('respects targetLanguage query parameter', async () => {
    await createProfile(testUser.user._id, 'ja');

    const res = await request(app)
      .get('/api/v1/home?targetLanguage=ja')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).not.toBeNull();
  });

  it('returns profile fields from UserLanguageProfile', async () => {
    await createProfile(testUser.user._id, 'en', {
      level: 'intermediate',
      xp: 500,
      userLevel: 3,
      hearts: 3,
      vocabularyProgress: 40,
      grammarProgress: 20,
    });

    const res = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    // UPDATED (Task 3): profile progress values are now derived from UserProgress,
    // not from stored UserLanguageProfile fields. No vocab/grammar entries → 0%.
    expect(res.body.data.profile).toMatchObject({
      level: 'intermediate',
      userLevel: 3,
      xp: 500,
      hearts: 3,
      vocabularyProgress: 0,
      grammarProgress: 0,
      conversationProgress: 0,
      listeningProgress: 0,
      readingProgress: 0,
    });
  });
});
