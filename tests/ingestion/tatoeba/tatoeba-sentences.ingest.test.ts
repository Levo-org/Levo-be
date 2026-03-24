import path from 'path';
import ExampleSentence from '@/models/ExampleSentence';
import {
  parseTatoebaRows,
  runTatoebaSentenceIngestion,
  type IngestSummary,
} from '@/scripts/ingest/tatoeba-sentences';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const FIXTURE_PATH = path.resolve(__dirname, '../../fixtures/ingestion/tatoeba-cc0-small.tsv');

describe('Tatoeba sentence ingestion', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('parses only supported languages (eng/jpn/cmn)', () => {
    const rows = parseTatoebaRows(FIXTURE_PATH);
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => ['en', 'ja', 'zh'].includes(row.targetLanguage))).toBe(true);
  });

  it('returns dry-run summary with skipped unsupported rows', async () => {
    const summary = await runTatoebaSentenceIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: true,
      batchId: 'test-tatoeba-001',
      datasetVersion: '2026-03-24',
    });

    expect(summary).toEqual<IngestSummary>({
      processed: 7,
      inserted: 6,
      updated: 0,
      skipped: 1,
      errors: 0,
    });
  });

  it('is idempotent and stores dataset-managed pending-translation rows', async () => {
    const firstRun = await runTatoebaSentenceIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-tatoeba-001',
      datasetVersion: '2026-03-24',
    });
    expect(firstRun.inserted).toBe(6);

    const secondRun = await runTatoebaSentenceIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-tatoeba-002',
      datasetVersion: '2026-03-24',
    });
    expect(secondRun).toEqual<IngestSummary>({
      processed: 7,
      inserted: 0,
      updated: 6,
      skipped: 1,
      errors: 0,
    });

    const docs = await ExampleSentence.find({ sourceDataset: 'tatoeba-cc0' });
    expect(docs).toHaveLength(6);
    expect(docs[0].datasetManaged).toBe(true);
    expect(docs[0].translationStatus).toBe('pending');
  });
});
