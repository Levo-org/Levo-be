import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import UserProgress from '@/models/UserProgress';
import UserItemProgress from '@/models/UserItemProgress';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createProfile,
  createProgress,
  createLesson,
  createVocabulary,
  createGrammar,
  TestUser,
} from './setup';

describe('Lesson ↔ content/progress linkage', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
    testUser = await createTestUser({ coins: 100 });
    await createProfile(testUser.user._id, 'en', { xp: 0, userLevel: 1 });
  });

  describe('vocabularyStatus linkage on lesson complete', () => {
    it('creates vocabularyStatus entries with introducedByLessonId for newWords', async () => {
      const vocab1 = await createVocabulary({ word: 'link1', order: 1 });
      const vocab2 = await createVocabulary({ word: 'link2', order: 2 });
      const lesson = await createLesson({
        newWords: [vocab1._id, vocab2._id],
        grammarPoints: [],
      });
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      expect(progress!.vocabularyStatus).toHaveLength(2);

      const entry1 = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab1._id.toString(),
      );
      expect(entry1).toBeDefined();
      expect(entry1!.introducedByLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry1!.lastPracticedInLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry1!.status).toBe('new');

      const entry2 = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab2._id.toString(),
      );
      expect(entry2).toBeDefined();
      expect(entry2!.introducedByLessonId!.toString()).toBe(lesson._id.toString());
    });

    it('does not overwrite introducedByLessonId if already set (first lesson wins)', async () => {
      const vocab = await createVocabulary({ word: 'existing', order: 1 });
      const lesson1 = await createLesson({ newWords: [vocab._id], grammarPoints: [], order: 1 });
      const lesson2 = await createLesson({ newWords: [vocab._id], grammarPoints: [], order: 2 });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 1,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 86400000),
            introducedByLessonId: lesson1._id,
            lastPracticedInLessonId: lesson1._id,
          },
        ],
      });

      await request(app)
        .post(`/api/v1/lessons/${lesson2._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      const entry = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab._id.toString(),
      );
      expect(entry!.introducedByLessonId!.toString()).toBe(lesson1._id.toString());
      expect(entry!.lastPracticedInLessonId!.toString()).toBe(lesson2._id.toString());
    });

    it('updates lastPracticedInLessonId on re-complete of a different lesson', async () => {
      const vocab = await createVocabulary({ word: 'repractice', order: 1 });
      const lesson1 = await createLesson({ newWords: [vocab._id], grammarPoints: [], order: 1 });
      const lesson2 = await createLesson({ newWords: [vocab._id], grammarPoints: [], order: 2 });

      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson1._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      await request(app)
        .post(`/api/v1/lessons/${lesson2._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      const entry = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab._id.toString(),
      );
      expect(entry!.introducedByLessonId!.toString()).toBe(lesson1._id.toString());
      expect(entry!.lastPracticedInLessonId!.toString()).toBe(lesson2._id.toString());
    });
  });

  describe('grammarStatus linkage on lesson complete', () => {
    it('creates grammarStatus entries with introducedByLessonId for grammarPoints', async () => {
      const grammar = await createGrammar({ title: 'linkGrammar', order: 1 });
      const lesson = await createLesson({
        newWords: [],
        grammarPoints: [grammar._id],
      });
      await createProgress(testUser.user._id, 'en');

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      expect(progress!.grammarStatus).toHaveLength(1);
      const entry = progress!.grammarStatus[0];
      expect(entry.grammarId.toString()).toBe(grammar._id.toString());
      expect(entry.introducedByLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry.lastPracticedInLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry.masteryState).toBe('new');
    });

    it('preserves existing grammarStatus introducedByLessonId on second lesson', async () => {
      const grammar = await createGrammar({ title: 'preserve', order: 1 });
      const lesson1 = await createLesson({ newWords: [], grammarPoints: [grammar._id], order: 1 });
      const lesson2 = await createLesson({ newWords: [], grammarPoints: [grammar._id], order: 2 });

      await createProgress(testUser.user._id, 'en', {
        grammarStatus: [
          {
            grammarId: grammar._id,
            progress: 25,
            quizScore: 80,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 86400000),
            masteryState: 'learning',
            correctCount: 1,
            wrongCount: 0,
            introducedByLessonId: lesson1._id,
            lastPracticedInLessonId: lesson1._id,
          },
        ],
      });

      await request(app)
        .post(`/api/v1/lessons/${lesson2._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      const entry = progress!.grammarStatus.find(
        (g) => g.grammarId.toString() === grammar._id.toString(),
      );
      expect(entry!.introducedByLessonId!.toString()).toBe(lesson1._id.toString());
      expect(entry!.lastPracticedInLessonId!.toString()).toBe(lesson2._id.toString());
    });
  });

  describe('legacy data without lesson linkage', () => {
    it('handles existing vocabularyStatus entries without linkage fields', async () => {
      const vocab = await createVocabulary({ word: 'legacy', order: 1 });
      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 2,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 86400000),
          },
        ],
      });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      const entry = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab._id.toString(),
      );
      expect(entry!.introducedByLessonId).toBeNull();
      expect(entry!.lastPracticedInLessonId).toBeNull();
      expect(entry!.status).toBe('learning');
      expect(entry!.correctCount).toBe(2);
    });

    it('lesson complete fills in linkage for legacy entries without introducedByLessonId', async () => {
      const vocab = await createVocabulary({ word: 'fillLegacy', order: 1 });
      const lesson = await createLesson({ newWords: [vocab._id], grammarPoints: [] });

      await createProgress(testUser.user._id, 'en', {
        vocabularyStatus: [
          {
            wordId: vocab._id,
            status: 'learning',
            correctCount: 2,
            wrongCount: 0,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 86400000),
          },
        ],
      });

      await request(app)
        .post(`/api/v1/lessons/${lesson._id}/complete`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ score: 100, correctAnswers: 5, totalQuizzes: 5 });

      const progress = await UserProgress.findOne({
        userId: testUser.user._id,
        targetLanguage: 'en',
      });

      const entry = progress!.vocabularyStatus.find(
        (v) => v.wordId.toString() === vocab._id.toString(),
      );
      expect(entry!.introducedByLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry!.lastPracticedInLessonId!.toString()).toBe(lesson._id.toString());
      expect(entry!.status).toBe('learning');
      expect(entry!.correctCount).toBe(2);
    });
  });

  describe('UserItemProgress linkage fields', () => {
    it('has lastPracticedInLessonId field with default null', async () => {
      const vocab = await createVocabulary();
      const item = await UserItemProgress.create({
        userId: testUser.user._id,
        targetLanguage: 'en',
        contentType: 'vocabulary',
        contentId: vocab._id,
      });

      expect(item.introducedByLessonId).toBeNull();
      expect(item.lastPracticedInLessonId).toBeNull();
    });

    it('stores and retrieves lesson linkage IDs', async () => {
      const vocab = await createVocabulary();
      const lesson = await createLesson();

      const item = await UserItemProgress.create({
        userId: testUser.user._id,
        targetLanguage: 'en',
        contentType: 'vocabulary',
        contentId: vocab._id,
        introducedByLessonId: lesson._id,
        lastPracticedInLessonId: lesson._id,
      });

      const found = await UserItemProgress.findById(item._id);
      expect(found!.introducedByLessonId!.toString()).toBe(lesson._id.toString());
      expect(found!.lastPracticedInLessonId!.toString()).toBe(lesson._id.toString());
    });
  });
});
