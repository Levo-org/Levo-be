import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearCollections } from '../setup';
import { runMigration } from '@/scripts/migrateSeedToDb';
import ImportBatch from '@/models/ImportBatch';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import Lesson from '@/models/Lesson';
import Badge from '@/models/Badge';

const EDITORIAL_CONTENT_TYPES = ['vocabulary', 'grammar', 'conversation', 'listening', 'reading'];
const LANGUAGES = ['en', 'ja', 'zh'];

describe('migrateSeedToDb', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('creates ImportBatch records for each editorial content type and language', async () => {
    await runMigration();

    const batches = await ImportBatch.find({ 'metadata.migrationType': 'seed_import' });

    const expectedBatchCount = EDITORIAL_CONTENT_TYPES.length * LANGUAGES.length;
    expect(batches).toHaveLength(expectedBatchCount);

    for (const contentType of EDITORIAL_CONTENT_TYPES) {
      for (const lang of LANGUAGES) {
        const batch = batches.find(
          (b) => b.contentType === contentType && b.fileName === `seed-${contentType}-${lang}`,
        );
        expect(batch).toBeDefined();
        expect(batch!.status).toBe('completed');
        expect(batch!.fileType).toBe('csv');
        expect(batch!.uploadedBy.toString()).toBe('000000000000000000000000');
        expect(batch!.totalRows).toBeGreaterThan(0);
        expect(batch!.validRows).toBe(batch!.totalRows);
        expect(batch!.invalidRows).toBe(0);
        expect(batch!.completedAt).toBeInstanceOf(Date);
      }
    }
  });

  it('sets editorial metadata with status=published and sourceType=seed_import on content documents', async () => {
    await runMigration();

    const vocabDocs = await Vocabulary.find({});
    expect(vocabDocs.length).toBeGreaterThan(0);
    for (const doc of vocabDocs) {
      expect(doc.status).toBe('published');
      expect(doc.sourceType).toBe('seed_import');
      expect(doc.importBatchId).toBeDefined();
    }

    const grammarDocs = await Grammar.find({});
    expect(grammarDocs.length).toBeGreaterThan(0);
    for (const doc of grammarDocs) {
      expect(doc.status).toBe('published');
      expect(doc.sourceType).toBe('seed_import');
      expect(doc.importBatchId).toBeDefined();
    }

    const convDocs = await Conversation.find({});
    expect(convDocs.length).toBeGreaterThan(0);
    for (const doc of convDocs) {
      expect(doc.status).toBe('published');
      expect(doc.sourceType).toBe('seed_import');
      expect(doc.importBatchId).toBeDefined();
    }

    const listenDocs = await Listening.find({});
    expect(listenDocs.length).toBeGreaterThan(0);
    for (const doc of listenDocs) {
      expect(doc.status).toBe('published');
      expect(doc.sourceType).toBe('seed_import');
      expect(doc.importBatchId).toBeDefined();
    }

    const readDocs = await Reading.find({});
    expect(readDocs.length).toBeGreaterThan(0);
    for (const doc of readDocs) {
      expect(doc.status).toBe('published');
      expect(doc.sourceType).toBe('seed_import');
      expect(doc.importBatchId).toBeDefined();
    }
  });

  it('links content documents to correct ImportBatch via importBatchId', async () => {
    await runMigration();

    const enVocabBatch = await ImportBatch.findOne({
      fileName: 'seed-vocabulary-en',
      contentType: 'vocabulary',
    });
    expect(enVocabBatch).toBeDefined();

    const enVocabDocs = await Vocabulary.find({ targetLanguage: 'en' });
    for (const doc of enVocabDocs) {
      expect(doc.importBatchId!.toString()).toBe(enVocabBatch!._id.toString());
    }
  });

  it('migrates Lesson and Badge without editorial metadata', async () => {
    await runMigration();

    const lessons = await Lesson.find({});
    expect(lessons.length).toBeGreaterThan(0);

    const badges = await Badge.find({});
    expect(badges.length).toBeGreaterThan(0);
  });

  it('is idempotent — re-running does not create duplicates', async () => {
    await runMigration();

    const firstRunVocabCount = await Vocabulary.countDocuments();
    const firstRunGrammarCount = await Grammar.countDocuments();
    const firstRunBatchCount = await ImportBatch.countDocuments();
    const firstRunLessonCount = await Lesson.countDocuments();
    const firstRunBadgeCount = await Badge.countDocuments();

    await runMigration();

    const secondRunVocabCount = await Vocabulary.countDocuments();
    const secondRunGrammarCount = await Grammar.countDocuments();
    const secondRunBatchCount = await ImportBatch.countDocuments();
    const secondRunLessonCount = await Lesson.countDocuments();
    const secondRunBadgeCount = await Badge.countDocuments();

    expect(secondRunVocabCount).toBe(firstRunVocabCount);
    expect(secondRunGrammarCount).toBe(firstRunGrammarCount);
    expect(secondRunBatchCount).toBe(firstRunBatchCount);
    expect(secondRunLessonCount).toBe(firstRunLessonCount);
    expect(secondRunBadgeCount).toBe(firstRunBadgeCount);
  });

  it('preserves editorial metadata on re-run', async () => {
    await runMigration();

    const docBefore = await Vocabulary.findOne({ targetLanguage: 'en' });
    expect(docBefore).toBeDefined();
    expect(docBefore!.status).toBe('published');
    expect(docBefore!.sourceType).toBe('seed_import');

    await runMigration();

    const docAfter = await Vocabulary.findOne({ targetLanguage: 'en', word: docBefore!.word });
    expect(docAfter).toBeDefined();
    expect(docAfter!.status).toBe('published');
    expect(docAfter!.sourceType).toBe('seed_import');
    expect(docAfter!._id.toString()).toBe(docBefore!._id.toString());
  });
});
