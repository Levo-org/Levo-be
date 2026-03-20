import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
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
} from './helpers/testDb';

describe('Aggregation consistency (home/stats/profile)', () => {
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

  it('computes profile progress from UserProgress for both home and stats', async () => {
    const vocab1 = await createVocabulary({ word: 'a', meaning: '1' });
    const vocab2 = await createVocabulary({ word: 'b', meaning: '2' });
    const grammar1 = await createGrammar({ title: 'G1' });

    await createProfile(testUser.user._id, 'en', {
      vocabularyProgress: 90,
      grammarProgress: 90,
      conversationProgress: 90,
      listeningProgress: 90,
      readingProgress: 90,
    });
    await createProgress(testUser.user._id, 'en', {
      vocabularyStatus: [
        { wordId: vocab1._id, status: 'completed', correctCount: 3, wrongCount: 0 },
        { wordId: vocab2._id, status: 'learning', correctCount: 1, wrongCount: 0 },
      ],
      grammarStatus: [
        { grammarId: grammar1._id, progress: 100, quizScore: 80 },
      ],
      conversationStatus: [
        { conversationId: new mongoose.Types.ObjectId(), completed: false, pronunciationScore: 0 },
      ],
    });

    const homeRes = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    const statsRes = await request(app)
      .get('/api/v1/stats')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(homeRes.status).toBe(200);
    expect(statsRes.status).toBe(200);

    const expectedProfile = {
      vocabularyProgress: 50,
      grammarProgress: 100,
      conversationProgress: 0,
      listeningProgress: 0,
      readingProgress: 0,
    };

    expect(homeRes.body.data.profile).toMatchObject(expectedProfile);
    expect(statsRes.body.data.profile).toMatchObject(expectedProfile);
  });

  it('ignores stale UserLanguageProfile progress values in favor of computed results', async () => {
    const vocab1 = await createVocabulary({ word: 'x', meaning: 'x' });
    const vocab2 = await createVocabulary({ word: 'y', meaning: 'y' });

    await createProfile(testUser.user._id, 'en', {
      vocabularyProgress: 100,
      grammarProgress: 100,
      conversationProgress: 100,
      listeningProgress: 100,
      readingProgress: 100,
    });
    await createProgress(testUser.user._id, 'en', {
      vocabularyStatus: [
        { wordId: vocab1._id, status: 'completed', correctCount: 3, wrongCount: 0 },
        { wordId: vocab2._id, status: 'learning', correctCount: 1, wrongCount: 0 },
      ],
    });

    const homeRes = await request(app)
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${testUser.token}`);

    const statsRes = await request(app)
      .get('/api/v1/stats')
      .set('Authorization', `Bearer ${testUser.token}`);

    expect(homeRes.status).toBe(200);
    expect(statsRes.status).toBe(200);

    expect(homeRes.body.data.profile.vocabularyProgress).toBe(50);
    expect(statsRes.body.data.profile.vocabularyProgress).toBe(50);
    expect(homeRes.body.data.profile.grammarProgress).toBe(0);
    expect(statsRes.body.data.profile.grammarProgress).toBe(0);
  });
});
