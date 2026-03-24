import Vocabulary from '@/models/Vocabulary';
import ExampleSentence from '@/models/ExampleSentence';
import Reading from '@/models/Reading';
import Listening from '@/models/Listening';
import { PapagoTranslationClient } from '@/services/translation/papago';
import { runBackfillKo } from '@/scripts/backfill-ko';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup';

class MockPapagoClient extends PapagoTranslationClient {
  private readonly behavior: (text: string, source: string, target: string) => Promise<string>;

  constructor(behavior: (text: string, source: string, target: string) => Promise<string>) {
    super({ clientId: 'id', clientSecret: 'secret' });
    this.behavior = behavior;
  }

  async translate(text: string, source: string, target = 'ko'): Promise<string> {
    return this.behavior(text, source, target);
  }
}

describe('backfill-ko script', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('fills pending exampleSentence and reading/listening translations', async () => {
    await ExampleSentence.create({
      targetLanguage: 'en',
      topic: 'general',
      level: 'beginner',
      originalText: 'Good morning',
      translation: '',
      sourceType: 'dataset_import',
      sourceReference: 'tatoeba-cc0:1:2026-03-24',
      datasetManaged: true,
      translationStatus: 'pending',
    });

    await Reading.create({
      targetLanguage: 'en',
      title: 'Short text',
      difficulty: 'beginner',
      content: 'This is a reading passage.',
      translation: '',
      wordCount: 5,
      quizzes: [],
      sourceType: 'dataset_import',
      sourceReference: 'reading:1:2026-03-24',
      datasetManaged: true,
      translationStatus: 'pending',
    });

    await Listening.create({
      targetLanguage: 'en',
      audioText: 'I like apples.',
      correctAnswer: 'I like apples.',
      hint: '',
      difficulty: 'beginner',
      audioUrl: '',
      sourceType: 'dataset_import',
      sourceReference: 'listening:1:2026-03-24',
      datasetManaged: true,
      translationStatus: 'pending',
    });

    const client = new MockPapagoClient(async (text) => `KO:${text}`);
    const summary = await runBackfillKo(
      {
        contentType: 'all',
        batchSize: 20,
        dryRun: false,
        resumeFailed: false,
      },
      client,
    );

    expect(summary.updated).toBe(3);

    const sentence = await ExampleSentence.findOne({ sourceReference: 'tatoeba-cc0:1:2026-03-24' });
    const reading = await Reading.findOne({ sourceReference: 'reading:1:2026-03-24' });
    const listening = await Listening.findOne({ sourceReference: 'listening:1:2026-03-24' });

    expect(sentence?.translation).toBe('KO:Good morning');
    expect(reading?.translation).toBe('KO:This is a reading passage.');
    expect(listening?.hint).toBe('KO:I like apples.');
    expect(sentence?.translationStatus).toBe('complete');
  });

  it('retries only failed rows when resumeFailed=true', async () => {
    await Vocabulary.create({
      targetLanguage: 'en',
      word: 'apple',
      pronunciation: '',
      meaning: 'apple',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'I eat an apple.',
      exampleTranslation: '',
      audioUrl: '',
      sourceType: 'dataset_import',
      sourceReference: 'oewn:apple:2026-03-24',
      datasetManaged: true,
      translationStatus: 'failed',
    });

    await Vocabulary.create({
      targetLanguage: 'en',
      word: 'book',
      pronunciation: '',
      meaning: 'book',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'This is a book.',
      exampleTranslation: '',
      audioUrl: '',
      sourceType: 'dataset_import',
      sourceReference: 'oewn:book:2026-03-24',
      datasetManaged: true,
      translationStatus: 'pending',
    });

    const client = new MockPapagoClient(async (text) => `KO:${text}`);
    const summary = await runBackfillKo(
      {
        contentType: 'vocabulary',
        batchSize: 20,
        dryRun: false,
        resumeFailed: true,
      },
      client,
    );

    expect(summary.scanned).toBe(1);

    const failedRow = await Vocabulary.findOne({ sourceReference: 'oewn:apple:2026-03-24' });
    const pendingRow = await Vocabulary.findOne({ sourceReference: 'oewn:book:2026-03-24' });

    expect(failedRow?.translationStatus).toBe('complete');
    expect(pendingRow?.translationStatus).toBe('pending');
  });

  it('marks translationStatus failed when provider throws', async () => {
    await ExampleSentence.create({
      targetLanguage: 'en',
      topic: 'general',
      level: 'beginner',
      originalText: 'How are you?',
      translation: '',
      sourceType: 'dataset_import',
      sourceReference: 'tatoeba-cc0:2:2026-03-24',
      datasetManaged: true,
      translationStatus: 'pending',
    });

    const client = new MockPapagoClient(async () => {
      throw new Error('rate limit');
    });

    const summary = await runBackfillKo(
      {
        contentType: 'exampleSentence',
        batchSize: 20,
        dryRun: false,
        resumeFailed: false,
      },
      client,
    );

    expect(summary.failed).toBe(1);

    const row = await ExampleSentence.findOne({ sourceReference: 'tatoeba-cc0:2:2026-03-24' });
    expect(row?.translationStatus).toBe('failed');
    expect(row?.translationError).toContain('rate limit');
  });
});
