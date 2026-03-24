import Vocabulary from '@/models/Vocabulary';
import ImportBatch from '@/models/ImportBatch';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from '../setup';

describe('dataset-managed provenance indexes', () => {
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
    await Vocabulary.syncIndexes();
    await ImportBatch.syncIndexes();
  });

  it('allows curated and dataset-managed rows to share text fields while protecting dataset sourceReference identity', async () => {
    await Vocabulary.create({
      targetLanguage: 'en',
      word: 'apple',
      pronunciation: 'AE1 P AH0 L',
      meaning: '사과',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'I eat an apple.',
      exampleTranslation: '나는 사과를 먹는다.',
      audioUrl: '',
      order: 1,
      sourceType: 'manual',
      sourceReference: 'dataset:apple:1',
      datasetManaged: false,
    });

    await Vocabulary.create({
      targetLanguage: 'en',
      word: 'apple',
      pronunciation: 'AE1 P AH0 L',
      meaning: '사과',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'I eat an apple.',
      exampleTranslation: '나는 사과를 먹는다.',
      audioUrl: '',
      order: 2,
      sourceType: 'dataset_import',
      sourceReference: 'dataset:apple:1',
      datasetManaged: true,
    });

    const duplicates = await Vocabulary.find({ targetLanguage: 'en', sourceReference: 'dataset:apple:1' });
    expect(duplicates).toHaveLength(2);
  });

  it('enforces unique sourceReference for dataset-managed rows per language', async () => {
    await Vocabulary.create({
      targetLanguage: 'en',
      word: 'book',
      pronunciation: 'B UH1 K',
      meaning: '책',
      partOfSpeech: 'noun',
      level: 'beginner',
      chapter: 1,
      exampleSentence: 'This is a book.',
      exampleTranslation: '이것은 책이다.',
      audioUrl: '',
      order: 1,
      sourceType: 'dataset_import',
      sourceReference: 'dataset:book:1',
      datasetManaged: true,
    });

    await expect(
      Vocabulary.create({
        targetLanguage: 'en',
        word: 'book',
        pronunciation: 'B UH1 K',
        meaning: '책',
        partOfSpeech: 'noun',
        level: 'beginner',
        chapter: 2,
        exampleSentence: 'Open your book.',
        exampleTranslation: '책을 펼치세요.',
        audioUrl: '',
        order: 2,
        sourceType: 'dataset_import',
        sourceReference: 'dataset:book:1',
        datasetManaged: true,
      }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('stores new import batch artifact metadata fields', async () => {
    const { user } = await createTestUser();

    const batch = await ImportBatch.create({
      fileName: 'tatoeba-20260324.tsv',
      fileType: 'csv',
      contentType: 'exampleSentence',
      sourceDataset: 'tatoeba-cc0',
      datasetVersion: '2026-03-24',
      artifactChecksum: 'sha256:abc123',
      status: 'completed',
      uploadedBy: user._id,
      totalRows: 10,
      validRows: 10,
      invalidRows: 0,
      duplicateRows: 0,
      importedRows: 10,
      errors: [],
      startedAt: new Date('2026-03-24T00:00:00.000Z'),
      completedAt: new Date('2026-03-24T00:10:00.000Z'),
    });

    const reloaded = await ImportBatch.findById(batch._id);
    expect(reloaded).toBeDefined();
    expect(reloaded?.sourceDataset).toBe('tatoeba-cc0');
    expect(reloaded?.datasetVersion).toBe('2026-03-24');
    expect(reloaded?.artifactChecksum).toBe('sha256:abc123');
    expect(reloaded?.startedAt).toBeInstanceOf(Date);
    expect(reloaded?.completedAt).toBeInstanceOf(Date);
  });
});
