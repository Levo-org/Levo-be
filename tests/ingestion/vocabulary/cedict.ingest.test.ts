import path from 'path';
import Vocabulary from '@/models/Vocabulary';
import {
  parseCedictEntries,
  runCedictIngestion,
  type IngestSummary,
} from '@/scripts/ingest/cedict';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const FIXTURE_PATH = path.resolve(__dirname, '../../fixtures/ingestion/cedict-small.txt');

describe('CC-CEDICT ingestion', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('parses CEDICT fixture entries from text lines', () => {
    const entries = parseCedictEntries(FIXTURE_PATH);
    expect(entries).toHaveLength(3);
    expect(entries[0].simplified).toBe('学校');
  });

  it('returns deterministic dry-run summary', async () => {
    const summary = await runCedictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: true,
      batchId: 'test-cedict-001',
      datasetVersion: '2026-03-24',
    });

    expect(summary).toEqual<IngestSummary>({
      processed: 3,
      inserted: 3,
      updated: 0,
      skipped: 0,
      errors: 0,
    });
  });

  it('is idempotent for reruns with same dataset version', async () => {
    const firstRun = await runCedictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-cedict-001',
      datasetVersion: '2026-03-24',
    });
    expect(firstRun.inserted).toBe(3);

    const secondRun = await runCedictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-cedict-002',
      datasetVersion: '2026-03-24',
    });
    expect(secondRun).toEqual<IngestSummary>({
      processed: 3,
      inserted: 0,
      updated: 3,
      skipped: 0,
      errors: 0,
    });

    const docs = await Vocabulary.find({ targetLanguage: 'zh', sourceDataset: 'cc-cedict' });
    expect(docs).toHaveLength(3);
    expect(docs[0].datasetManaged).toBe(true);
    expect(docs[0].sourceReference).toContain('cc-cedict:');
  });
});
