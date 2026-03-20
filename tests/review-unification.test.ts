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
  createVocabulary,
  createGrammar,
  createConversation,
  TestUser,
} from './setup';

describe('Review unification', () => {
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

  it('counts due reviews for vocabulary, grammar, and conversation with unified rule', async () => {
    const vocab = await createVocabulary({ word: 'due', meaning: '기한' });
    const grammar = await createGrammar({ title: 'Due Grammar' });
    const conversation = await createConversation({ title: 'Due Conversation' });
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await createProgress(testUser.user._id, 'en', {
      vocabularyStatus: [
        { wordId: vocab._id, status: 'learning', correctCount: 1, wrongCount: 0, lastReviewedAt: new Date(), nextReviewAt: pastDate },
      ],
      grammarStatus: [
        {
          grammarId: grammar._id,
          progress: 25,
          quizScore: 1,
          lastReviewedAt: new Date(),
          nextReviewAt: pastDate,
          masteryState: 'learning',
          correctCount: 1,
          wrongCount: 0,
        },
      ],
      conversationStatus: [
        {
          conversationId: conversation._id,
          completed: true,
          pronunciationScore: 80,
          lastReviewedAt: new Date(),
          masteryState: 'learning',
          correctCount: 1,
          wrongCount: 0,
          nextReviewAt: pastDate,
        },
      ],
    });

    const res = await request(app)
      .get('/api/v1/review')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      vocabulary: 1,
      grammar: 1,
      conversation: 1,
      total: 3,
    });
  });

  it('sets conversation nextReviewAt after submitPractice', async () => {
    const conversation = await createConversation({ title: 'Scheduling Conversation' });
    const beforeTime = Date.now();

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation._id}/practice`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .query({ targetLanguage: 'en' })
      .send({ conversationId: conversation._id.toString(), pronunciationScore: 85, correct: true });

    expect(res.status).toBe(200);
    expect(res.body.data.conversationStatus).toBeDefined();

    const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
    const item = progress!.conversationStatus.find(
      (entry) => entry.conversationId.toString() === conversation._id.toString(),
    );

    const nextReview = new Date(item!.nextReviewAt!).getTime();
    const expectedMin = beforeTime + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
    const expectedMax = Date.now() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 + 5000;
    expect(nextReview).toBeGreaterThan(expectedMin);
    expect(nextReview).toBeLessThan(expectedMax);
  });

  it('increments grammar review scheduling with unified rule', async () => {
    const grammar = await createGrammar({ title: 'Grammar Review' });
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await createProgress(testUser.user._id, 'en', {
      grammarStatus: [
        {
          grammarId: grammar._id,
          progress: 25,
          quizScore: 1,
          lastReviewedAt: new Date(),
          nextReviewAt: pastDate,
          masteryState: 'learning',
          correctCount: 1,
          wrongCount: 0,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/review/grammar/complete')
      .set('Authorization', `Bearer ${testUser.token}`)
      .query({ targetLanguage: 'en' })
      .send({ category: 'grammar', contentId: grammar._id.toString(), correct: true });

    expect(res.status).toBe(200);

    const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
    const item = progress!.grammarStatus.find(
      (entry) => entry.grammarId.toString() === grammar._id.toString(),
    );

    expect(item!.correctCount).toBe(2);
    const nextReview = new Date(item!.nextReviewAt!).getTime();
    const expectedMin = Date.now() + REVIEW_INTERVALS_DAYS[1] * 24 * 60 * 60 * 1000 - 5000;
    const expectedMax = Date.now() + REVIEW_INTERVALS_DAYS[1] * 24 * 60 * 60 * 1000 + 5000;
    expect(nextReview).toBeGreaterThan(expectedMin);
    expect(nextReview).toBeLessThan(expectedMax);
  });

  it('sets conversation masteryState to wrong on incorrect review', async () => {
    const conversation = await createConversation({ title: 'Conversation Review' });
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await createProgress(testUser.user._id, 'en', {
      conversationStatus: [
        {
          conversationId: conversation._id,
          completed: true,
          pronunciationScore: 90,
          lastReviewedAt: new Date(),
          masteryState: 'learning',
          correctCount: 1,
          wrongCount: 0,
          nextReviewAt: pastDate,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/review/conversation/complete')
      .set('Authorization', `Bearer ${testUser.token}`)
      .query({ targetLanguage: 'en' })
      .send({ category: 'conversation', contentId: conversation._id.toString(), correct: false });

    expect(res.status).toBe(200);

    const progress = await UserProgress.findOne({ userId: testUser.user._id, targetLanguage: 'en' });
    const item = progress!.conversationStatus.find(
      (entry) => entry.conversationId.toString() === conversation._id.toString(),
    );

    expect(item!.masteryState).toBe('wrong');
    const nextReview = new Date(item!.nextReviewAt!).getTime();
    const expectedMin = Date.now() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 - 5000;
    const expectedMax = Date.now() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000 + 5000;
    expect(nextReview).toBeGreaterThan(expectedMin);
    expect(nextReview).toBeLessThan(expectedMax);
  });
});
