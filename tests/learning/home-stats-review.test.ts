import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import WrongAnswerEntry from '@/models/WrongAnswerEntry';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
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
  createGrammar,
  TestUser,
} from '../helpers/testDb';

describe('Home / Stats / Review — characterization', () => {
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

  describe('GET /api/v1/home', () => {
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
      // CHARACTERIZATION: profile shape returned by home endpoint
      expect(res.body.data.profile).toMatchObject({
        level: 'intermediate',
        userLevel: 3,
        xp: 500,
        hearts: 3,
        // Task 3: progress is now derived from UserProgress, not stored in UserLanguageProfile
        vocabularyProgress: 0,
        grammarProgress: 0,
        conversationProgress: 0,
        listeningProgress: 0,
        readingProgress: 0,
      });
    });
  });

  describe('GET /api/v1/stats', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/stats');
      expect(res.status).toBe(401);
    });

    it('returns 404 when no language profile exists', async () => {
      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns stats with empty progress', async () => {
      await createProfile(testUser.user._id, 'en');

      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('profile');
      expect(res.body.data).toHaveProperty('streak');
      expect(res.body.data).toHaveProperty('learning');
      expect(res.body.data).toHaveProperty('categoryRatio');
      expect(res.body.data).toHaveProperty('period');

      // CHARACTERIZATION: default period is 'all'
      expect(res.body.data.period).toBe('all');

      expect(res.body.data.learning).toEqual({
        completedLessons: 0,
        learnedWords: 0,
        learningWords: 0,
        completedGrammar: 0,
        totalGrammar: 0,
        completedConversations: 0,
        totalConversations: 0,
        wrongAnswers: 0,
      });

      // CHARACTERIZATION: categoryRatio is all-zero when no items exist
      expect(res.body.data.categoryRatio).toEqual({
        vocabulary: 0,
        grammar: 0,
        conversation: 0,
      });
    });

    it('returns streak defaults when no streak record exists', async () => {
      await createProfile(testUser.user._id, 'en');

      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // CHARACTERIZATION: streak defaults when no UserStreak exists
      expect(res.body.data.streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        weeklyRecord: [],
      });
    });

    it('computes learning counts from vocabularyStatus/grammarStatus/conversationStatus', async () => {
      const vocab1 = await createVocabulary({ word: 'a', meaning: '1' });
      const vocab2 = await createVocabulary({ word: 'b', meaning: '2' });
      const vocab3 = await createVocabulary({ word: 'c', meaning: '3' });
      const grammar1 = await createGrammar({ title: 'G1' });
      const grammar2 = await createGrammar({ title: 'G2' });

      await createProfile(testUser.user._id, 'en');
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab1._id, status: 'completed', correctCount: 3, wrongCount: 0 },
          { wordId: vocab2._id, status: 'learning', correctCount: 1, wrongCount: 0 },
          { wordId: vocab3._id, status: 'wrong', correctCount: 0, wrongCount: 2 },
        ],
        grammarStatus: [
          { grammarId: grammar1._id, progress: 100, quizScore: 80 },
          { grammarId: grammar2._id, progress: 50, quizScore: 40 },
        ],
        conversationStatus: [
          { conversationId: vocab1._id, completed: true, pronunciationScore: 80 },
          { conversationId: vocab2._id, completed: false, pronunciationScore: 0 },
        ],
        wrongAnswers: [
          { type: 'vocabulary', contentId: vocab3._id, question: 'c', userAnswer: 'x', correctAnswer: '3', createdAt: new Date() },
        ],
      });

      await WrongAnswerEntry.create({
        userId: testUser.user._id,
        targetLanguage: 'en',
        contentType: 'vocabulary',
        contentId: vocab3._id,
        question: 'c',
        correctAnswer: '3',
        lastUserAnswer: 'x',
        wrongCount: 1,
        lastWrongAt: new Date(),
        remediationStatus: 'pending',
      });

      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);

      // CHARACTERIZATION: learnedWords = vocab with status 'completed'
      expect(res.body.data.learning.learnedWords).toBe(1);
      // CHARACTERIZATION: learningWords = vocab with status 'learning'
      expect(res.body.data.learning.learningWords).toBe(1);
      // CHARACTERIZATION: completedGrammar = grammar with progress >= 100
      expect(res.body.data.learning.completedGrammar).toBe(1);
      expect(res.body.data.learning.totalGrammar).toBe(2);
      // CHARACTERIZATION: completedConversations = conversation with completed: true
      expect(res.body.data.learning.completedConversations).toBe(1);
      expect(res.body.data.learning.totalConversations).toBe(2);
      expect(res.body.data.learning.wrongAnswers).toBe(1);
    });

    it('computes categoryRatio as percentage of total items', async () => {
      const vocab1 = await createVocabulary({ word: 'x', meaning: 'x' });
      const vocab2 = await createVocabulary({ word: 'y', meaning: 'y' });
      const vocab3 = await createVocabulary({ word: 'z', meaning: 'z' });
      const grammar1 = await createGrammar({ title: 'G1' });

      await createProfile(testUser.user._id, 'en');
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          { wordId: vocab1._id, status: 'new', correctCount: 0, wrongCount: 0 },
          { wordId: vocab2._id, status: 'new', correctCount: 0, wrongCount: 0 },
          { wordId: vocab3._id, status: 'new', correctCount: 0, wrongCount: 0 },
        ],
        grammarStatus: [
          { grammarId: grammar1._id, progress: 0, quizScore: 0 },
        ],
      });

      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // CHARACTERIZATION: categoryRatio = Math.round(count/total * 100)
      expect(res.body.data.categoryRatio.vocabulary).toBe(75);
      expect(res.body.data.categoryRatio.grammar).toBe(25);
      expect(res.body.data.categoryRatio.conversation).toBe(0);
    });

    it('respects period query param (passed through, no filtering)', async () => {
      await createProfile(testUser.user._id, 'en');

      const res = await request(app)
        .get('/api/v1/stats?period=week')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // CHARACTERIZATION: period is echoed back but does NOT filter data
      expect(res.body.data.period).toBe('week');
    });

    it('returns profile fields matching UserLanguageProfile', async () => {
      await createProfile(testUser.user._id, 'en', {
        level: 'advanced',
        xp: 1200,
        userLevel: 5,
        vocabularyProgress: 80,
        grammarProgress: 60,
        conversationProgress: 40,
        listeningProgress: 20,
        readingProgress: 10,
      });

      const res = await request(app)
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile).toMatchObject({
        level: 'advanced',
        userLevel: 5,
        xp: 1200,
        vocabularyProgress: 0,
        grammarProgress: 0,
        conversationProgress: 0,
        listeningProgress: 0,
        readingProgress: 0,
      });
    });
  });

  describe('GET /api/v1/review (summary)', () => {
    beforeEach(async () => {
      await createProfile(testUser.user._id, 'en');
    });

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

    it('counts grammar due using same rule as vocabulary', async () => {
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

    it('counts conversation due when lastReviewedAt is null or nextReviewAt is in the past', async () => {
      const convoId1 = new mongoose.Types.ObjectId();
      const convoId2 = new mongoose.Types.ObjectId();
      const convoId3 = new mongoose.Types.ObjectId();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      await createProgress(testUser.user._id, 'en', {
        conversationStatus: [
          { conversationId: convoId1, completed: true, pronunciationScore: 80, lastReviewedAt: null, nextReviewAt: null },
          { conversationId: convoId2, completed: true, pronunciationScore: 70, lastReviewedAt: now, nextReviewAt: pastDate },
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
    beforeEach(async () => {
      await createProfile(testUser.user._id, 'en');
    });

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

  describe('POST /api/v1/review/:category/complete', () => {
    beforeEach(async () => {
      await createProfile(testUser.user._id, 'en');
    });

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
      // Task 4: correctCount=1 < MASTERY_CORRECT_THRESHOLD(3), so status stays 'learning'
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

    it('returns 400 for unsupported category (e.g. conversation)', async () => {
      await createProgress(testUser.user._id, 'en');

      const res = await request(app)
        .post('/api/v1/review/vocabulary/complete')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ category: 'conversation', contentId: 'abc', correct: true });

      // Task 4: conversation is now a supported category, but contentId 'abc' is not found → 404
      expect(res.status).toBe(404);
    });
  });
});
