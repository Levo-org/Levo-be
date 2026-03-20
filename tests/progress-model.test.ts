import mongoose from 'mongoose';
import UserItemProgress from '@/models/UserItemProgress';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from './setup';

describe('UserItemProgress model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('rejects invalid contentType values', async () => {
    const { user } = await createTestUser();

    const record = new UserItemProgress({
      userId: user._id,
      targetLanguage: 'en',
      contentType: 'invalid',
      contentId: new mongoose.Types.ObjectId(),
      status: 'active',
      masteryState: 'new',
      attemptCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastStudiedAt: null,
      lastResult: null,
      nextReviewAt: null,
      introducedByLessonId: null,
    });

    let error: unknown;

    try {
      await record.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('enforces unique user-language-type-content index', async () => {
    await UserItemProgress.init();

    const { user } = await createTestUser();
    const contentId = new mongoose.Types.ObjectId();

    await UserItemProgress.create({
      userId: user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId,
      status: 'active',
      masteryState: 'learning',
      attemptCount: 1,
      correctCount: 1,
      wrongCount: 0,
      lastStudiedAt: new Date(),
      lastResult: 'correct',
      nextReviewAt: null,
      introducedByLessonId: null,
    });

    let error: unknown;

    try {
      await UserItemProgress.create({
        userId: user._id,
        targetLanguage: 'en',
        contentType: 'vocabulary',
        contentId,
        status: 'active',
        masteryState: 'learning',
        attemptCount: 1,
        correctCount: 1,
        wrongCount: 0,
        lastStudiedAt: new Date(),
        lastResult: 'correct',
        nextReviewAt: null,
        introducedByLessonId: null,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(mongoose.mongo.MongoServerError);
    expect((error as mongoose.mongo.MongoServerError).code).toBe(11000);
  });
});
