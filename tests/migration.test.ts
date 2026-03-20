import mongoose from 'mongoose';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProgress,
  createVocabulary,
  createGrammar,
  createConversation,
  createLesson,
  TestUser,
} from './setup';
import UserItemProgress from '@/models/UserItemProgress';
import { migrateToItemProgress } from '@/scripts/migrate-to-item-progress';

let testUser: TestUser;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearCollections();
  testUser = await createTestUser();
});

describe('migrateToItemProgress', () => {
  describe('field mapping', () => {
    it('migrates vocabularyStatus entries to UserItemProgress with correct field mapping', async () => {
      const vocab = await createVocabulary({ word: 'migrate1', order: 1 });
      const lesson = await createLesson();
      const now = new Date();
      const reviewAt = new Date(Date.now() + 86400000);

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 5,
            wrongCount: 2,
            lastReviewedAt: now,
            nextReviewAt: reviewAt,
            introducedByLessonId: lesson._id,
            lastPracticedInLessonId: lesson._id,
          },
        ],
      });

      const stats = await migrateToItemProgress();

      expect(stats.totalProgressDocs).toBe(1);
      expect(stats.vocabularyOps).toBe(1);

      const item = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });

      expect(item).not.toBeNull();
      expect(item!.targetLanguage).toBe('en');
      expect(item!.masteryState).toBe('learning');
      expect(item!.correctCount).toBe(5);
      expect(item!.wrongCount).toBe(2);
      expect(item!.attemptCount).toBe(7);
      expect(item!.lastStudiedAt!.getTime()).toBe(now.getTime());
      expect(item!.nextReviewAt!.getTime()).toBe(reviewAt.getTime());
      expect(item!.lastResult).toBe('correct');
      expect(item!.introducedByLessonId!.toString()).toBe(lesson._id.toString());
      expect(item!.lastPracticedInLessonId!.toString()).toBe(lesson._id.toString());
      expect(item!.status).toBe('active');
    });

    it('migrates grammarStatus entries with correct masteryState mapping', async () => {
      const grammar = await createGrammar({ title: 'migrateGrammar', order: 1 });
      const now = new Date();

      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 75,
            quizScore: 90,
            lastReviewedAt: now,
            nextReviewAt: null,
            masteryState: 'completed',
            correctCount: 10,
            wrongCount: 1,
            introducedByLessonId: null,
            lastPracticedInLessonId: null,
          },
        ],
      });

      await migrateToItemProgress();

      const item = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'grammar',
        contentId: grammar._id,
      });

      expect(item).not.toBeNull();
      expect(item!.masteryState).toBe('completed');
      expect(item!.correctCount).toBe(10);
      expect(item!.wrongCount).toBe(1);
      expect(item!.attemptCount).toBe(11);
      expect(item!.lastResult).toBe('correct');
      expect(item!.nextReviewAt).toBeNull();
      expect(item!.introducedByLessonId).toBeNull();
    });

    it('migrates conversationStatus entries', async () => {
      const convo = await createConversation({ title: 'migrateConvo', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        conversationStatus: [
          {
            conversationId: convo._id,
            completed: true,
            pronunciationScore: 85,
            lastReviewedAt: new Date(),
            masteryState: 'learning',
            correctCount: 3,
            wrongCount: 3,
            nextReviewAt: new Date(Date.now() + 86400000),
            introducedByLessonId: null,
            lastPracticedInLessonId: null,
          },
        ],
      });

      const stats = await migrateToItemProgress();
      expect(stats.conversationOps).toBe(1);

      const item = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'conversation',
        contentId: convo._id,
      });

      expect(item).not.toBeNull();
      expect(item!.masteryState).toBe('learning');
      expect(item!.correctCount).toBe(3);
      expect(item!.wrongCount).toBe(3);
    });

    it('sets lastResult to wrong when wrongCount > correctCount', async () => {
      const vocab = await createVocabulary({ word: 'wrongDominant', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'wrong',
            correctCount: 1,
            wrongCount: 5,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
          },
        ],
      });

      await migrateToItemProgress();

      const item = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });

      expect(item!.lastResult).toBe('wrong');
    });

    it('sets lastResult to null when no attempts', async () => {
      const vocab = await createVocabulary({ word: 'noAttempts', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'new',
            correctCount: 0,
            wrongCount: 0,
            lastReviewedAt: null,
            nextReviewAt: null,
          },
        ],
      });

      await migrateToItemProgress();

      const item = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });

      expect(item!.lastResult).toBeNull();
      expect(item!.attemptCount).toBe(0);
    });
  });

  describe('idempotency', () => {
    it('produces the same result when run twice — no duplicate records', async () => {
      const vocab = await createVocabulary({ word: 'idempotent', order: 1 });
      const grammar = await createGrammar({ title: 'idempotentGrammar', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 3,
            wrongCount: 1,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 86400000),
          },
        ],
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 50,
            quizScore: 80,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
            masteryState: 'learning',
            correctCount: 4,
            wrongCount: 0,
          },
        ],
      });

      const firstRun = await migrateToItemProgress();
      const countAfterFirst = await UserItemProgress.countDocuments({
        userId: testUser.user._id,
      });

      const secondRun = await migrateToItemProgress();
      const countAfterSecond = await UserItemProgress.countDocuments({
        userId: testUser.user._id,
      });

      expect(countAfterFirst).toBe(2);
      expect(countAfterSecond).toBe(2);
      expect(firstRun.bulkWriteResults.upserted).toBe(2);
      expect(secondRun.bulkWriteResults.modified).toBe(2);
      expect(secondRun.bulkWriteResults.upserted).toBe(0);
    });

    it('updates existing records with latest data on re-run', async () => {
      const vocab = await createVocabulary({ word: 'updateOnRerun', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 1,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
          },
        ],
      });

      await migrateToItemProgress();

      const itemBeforeUpdate = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });
      expect(itemBeforeUpdate!.correctCount).toBe(1);

      const progress = await (await import('@/models/UserProgress')).default.findOne({
        userId: testUser.user._id,
      });
      const vocabEntry = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab._id.toString(),
      );
      vocabEntry!.correctCount = 10;
      vocabEntry!.status = 'completed';
      await progress!.save();

      await migrateToItemProgress();

      const itemAfterUpdate = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });
      expect(itemAfterUpdate!.correctCount).toBe(10);
      expect(itemAfterUpdate!.masteryState).toBe('completed');
    });
  });

  describe('index strategy', () => {
    it('ensures compound indexes exist for due review, mastery, and wrong-answer lookups', async () => {
      await UserItemProgress.init();
      const indexes = await UserItemProgress.collection.indexes();
      const indexKeys = indexes.map((idx) => JSON.stringify(idx.key));

      expect(indexKeys).toContainEqual(
        JSON.stringify({ userId: 1, targetLanguage: 1, contentType: 1, contentId: 1 }),
      );
      expect(indexKeys).toContainEqual(
        JSON.stringify({ userId: 1, targetLanguage: 1, nextReviewAt: 1 }),
      );
      expect(indexKeys).toContainEqual(
        JSON.stringify({ userId: 1, targetLanguage: 1, contentType: 1, masteryState: 1 }),
      );
      expect(indexKeys).toContainEqual(
        JSON.stringify({ userId: 1, targetLanguage: 1, lastResult: 1 }),
      );

      const uniqueIndex = indexes.find(
        (idx) => JSON.stringify(idx.key) === JSON.stringify({ userId: 1, targetLanguage: 1, contentType: 1, contentId: 1 }),
      );
      expect(uniqueIndex?.unique).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty vocabularyStatus/grammarStatus/conversationStatus', async () => {
      await createProgress(testUser.user._id, 'en');

      const stats = await migrateToItemProgress();

      expect(stats.totalProgressDocs).toBe(1);
      expect(stats.vocabularyOps).toBe(0);
      expect(stats.grammarOps).toBe(0);
      expect(stats.conversationOps).toBe(0);

      const count = await UserItemProgress.countDocuments({ userId: testUser.user._id });
      expect(count).toBe(0);
    });

    it('handles multiple users without cross-contamination', async () => {
      const user2 = await createTestUser({ email: 'user2@test.com', providerId: 'google-user2' });
      const vocab = await createVocabulary({ word: 'shared', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 5,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
          },
        ],
      });

      await createProgress(user2.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'completed',
            correctCount: 20,
            wrongCount: 1,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
          },
        ],
      });

      await migrateToItemProgress();

      const item1 = await UserItemProgress.findOne({
        userId: testUser.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });
      const item2 = await UserItemProgress.findOne({
        userId: user2.user._id,
        contentType: 'vocabulary',
        contentId: vocab._id,
      });

      expect(item1!.masteryState).toBe('learning');
      expect(item1!.correctCount).toBe(5);
      expect(item2!.masteryState).toBe('completed');
      expect(item2!.correctCount).toBe(20);
    });

    it('migrates multiple content types from a single UserProgress doc', async () => {
      const vocab = await createVocabulary({ word: 'multi1', order: 1 });
      const grammar = await createGrammar({ title: 'multi2', order: 1 });
      const convo = await createConversation({ title: 'multi3', order: 1 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 1,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
          },
        ],
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 25,
            quizScore: 70,
            lastReviewedAt: new Date(),
            nextReviewAt: null,
            masteryState: 'learning',
            correctCount: 2,
            wrongCount: 1,
          },
        ],
        conversationStatus: [
          {
            conversationId: convo._id,
            completed: false,
            pronunciationScore: 0,
            lastReviewedAt: null,
            masteryState: 'new',
            correctCount: 0,
            wrongCount: 0,
            nextReviewAt: null,
          },
        ],
      });

      const stats = await migrateToItemProgress();

      expect(stats.vocabularyOps).toBe(1);
      expect(stats.grammarOps).toBe(1);
      expect(stats.conversationOps).toBe(1);

      const totalItems = await UserItemProgress.countDocuments({
        userId: testUser.user._id,
      });
      expect(totalItems).toBe(3);
    });
  });
});
