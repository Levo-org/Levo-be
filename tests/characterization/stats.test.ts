import request from 'supertest';
import app from '@/app';
import WrongAnswerEntry from '@/models/WrongAnswerEntry';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createStreak,
  createProgress,
  createVocabulary,
  createGrammar,
  TestUser,
} from '../setup';

describe('GET /api/v1/stats — characterization', () => {
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
    // 3 vocab + 1 grammar + 0 convo = 4 total
    expect(res.body.data.categoryRatio.vocabulary).toBe(75); // 3/4 * 100
    expect(res.body.data.categoryRatio.grammar).toBe(25);    // 1/4 * 100
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
    // UPDATED (Task 3): progress values are now derived from UserProgress,
    // not from stored UserLanguageProfile fields. No progress entries → 0%.
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
