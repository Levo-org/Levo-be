import mongoose from 'mongoose';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup';
import { CONTENT_STATUSES, LEVELS, SUPPORTED_LANGUAGES } from '@/utils/constants';

describe('Content models editorial metadata', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  const baseVocabulary = {
    targetLanguage: SUPPORTED_LANGUAGES[0],
    word: 'hello',
    pronunciation: 'heh-lo',
    meaning: 'greeting',
    partOfSpeech: 'interjection',
    level: LEVELS[0],
    chapter: 1,
  };

  const baseGrammar = {
    targetLanguage: SUPPORTED_LANGUAGES[0],
    title: 'Present tense',
    level: LEVELS[0],
    formula: 'Subject + verb',
    explanation: 'Used for habits or repeated actions.',
  };

  const baseConversation = {
    targetLanguage: SUPPORTED_LANGUAGES[0],
    title: 'Ordering food',
    level: LEVELS[0],
    dialogs: [
      {
        speaker: 'A' as const,
        text: 'Hello',
        translation: '안녕하세요',
        isUserRole: false,
        audioUrl: '',
      },
      {
        speaker: 'B' as const,
        text: 'Hi',
        translation: '안녕',
        isUserRole: true,
        audioUrl: '',
      },
    ],
    keyExpressions: [{ expression: 'Excuse me', meaning: '실례합니다' }],
  };

  it('creates vocabulary with editorial metadata and defaults status to draft', async () => {
    const exampleSentenceId = new mongoose.Types.ObjectId();
    const createdBy = new mongoose.Types.ObjectId();

    const vocabulary = await Vocabulary.create({
      ...baseVocabulary,
      exampleSentenceIds: [exampleSentenceId],
      sourceType: 'csv_import',
      sourceReference: 'batch-1',
      license: 'CC-BY',
      createdBy,
    });

    expect(vocabulary.status).toBe('draft');
    expect(vocabulary.sourceType).toBe('csv_import');
    expect(vocabulary.sourceReference).toBe('batch-1');
    expect(vocabulary.license).toBe('CC-BY');
    expect(vocabulary.createdBy?.toString()).toBe(createdBy.toString());
    expect(vocabulary.exampleSentenceIds?.[0].toString()).toBe(exampleSentenceId.toString());
  });

  it('creates vocabulary without editorial metadata (backward compatible)', async () => {
    const vocabulary = await Vocabulary.create(baseVocabulary);

    expect(vocabulary.status).toBe('draft');
    expect(vocabulary.sourceType).toBe('manual');
  });

  it('creates grammar with editorial metadata', async () => {
    const lastEditedBy = new mongoose.Types.ObjectId();

    const grammar = await Grammar.create({
      ...baseGrammar,
      status: 'approved',
      sourceType: 'api',
      lastEditedBy,
    });

    expect(grammar.status).toBe('approved');
    expect(grammar.sourceType).toBe('api');
    expect(grammar.lastEditedBy?.toString()).toBe(lastEditedBy.toString());
  });

  it('creates conversation with editorial metadata', async () => {
    const reviewedBy = new mongoose.Types.ObjectId();

    const conversation = await Conversation.create({
      ...baseConversation,
      status: 'in_review',
      sourceType: 'manual',
      reviewedBy,
    });

    expect(conversation.status).toBe('in_review');
    expect(conversation.sourceType).toBe('manual');
    expect(conversation.reviewedBy?.toString()).toBe(reviewedBy.toString());
  });

  it('validates required fields', async () => {
    const vocabulary = new Vocabulary({
      targetLanguage: baseVocabulary.targetLanguage,
      meaning: baseVocabulary.meaning,
      partOfSpeech: baseVocabulary.partOfSpeech,
      level: baseVocabulary.level,
      chapter: baseVocabulary.chapter,
    });

    await expect(vocabulary.validate()).rejects.toThrow(/word/i);

    const grammar = new Grammar({
      targetLanguage: baseGrammar.targetLanguage,
      level: baseGrammar.level,
    });

    await expect(grammar.validate()).rejects.toThrow(/title/i);

    const conversation = new Conversation({
      targetLanguage: baseConversation.targetLanguage,
      level: baseConversation.level,
    });

    await expect(conversation.validate()).rejects.toThrow(/title/i);
  });

  it('accepts valid status values and rejects invalid ones', async () => {
    for (const status of CONTENT_STATUSES) {
      const vocabulary = new Vocabulary({
        ...baseVocabulary,
        status,
        sourceType: 'manual',
      });

      await expect(vocabulary.validate()).resolves.toBeUndefined();
    }

    const invalidVocabulary = new Vocabulary({
      ...baseVocabulary,
      status: 'not_valid',
      sourceType: 'manual',
    });

    await expect(invalidVocabulary.validate()).rejects.toThrow(/status/i);
  });
});
