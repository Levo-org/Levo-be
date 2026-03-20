import mongoose from 'mongoose';
import ExampleSentence from '@/models/ExampleSentence';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup';

describe('ExampleSentence model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  const baseData = {
    targetLanguage: 'en',
    topic: 'greetings',
    level: 'beginner',
    originalText: 'Hello there',
    translation: '안녕하세요',
  };

  it('creates a sentence and normalizes key', async () => {
    const doc = await ExampleSentence.create(baseData);

    expect(doc.originalText).toBe('Hello there');
    expect(doc.normalizedKey).toBe('hello there');
    expect(doc.targetLanguage).toBe('en');
  });

  it('blocks duplicates with same language and normalized text', async () => {
    await ExampleSentence.init();
    await ExampleSentence.create(baseData);

    let error: unknown;

    try {
      await ExampleSentence.create({
        ...baseData,
        originalText: '  HELLO   THERE  ',
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(mongoose.mongo.MongoServerError);
    expect((error as mongoose.mongo.MongoServerError).code).toBe(11000);
  });

  it('allows same text in different language', async () => {
    await ExampleSentence.create(baseData);

    const doc = await ExampleSentence.create({
      ...baseData,
      targetLanguage: 'ja',
    });

    expect(doc.targetLanguage).toBe('ja');
  });

  it('defaults editorial status to draft', async () => {
    const doc = await ExampleSentence.create(baseData);

    expect(doc.status).toBe('draft');
  });

  it('requires originalText', async () => {
    const doc = new ExampleSentence({
      ...baseData,
      originalText: undefined,
    });

    let error: unknown;

    try {
      await doc.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
  });
});
