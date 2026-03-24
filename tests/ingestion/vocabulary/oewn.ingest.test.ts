import path from 'path';
import Vocabulary from '@/models/Vocabulary';
import {
  parseOewnEntries,
  runOewnIngestion,
  type IngestSummary,
} from '@/scripts/ingest/oewn';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const FIXTURE_PATH = path.resolve(__dirname, '../../fixtures/ingestion/oewn-small.json');

describe('OEWN ingestion', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('parses the fixture file as entries', () => {
    const entries = parseOewnEntries(FIXTURE_PATH);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toHaveProperty('id');
    expect(entries[0]).toHaveProperty('lemma');
  });

  it('returns deterministic dry-run summary', async () => {
    const summary = await runOewnIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: true,
      batchId: 'test-oewn-001',
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

  it('is idempotent when run twice with same dataset version', async () => {
    const firstRun = await runOewnIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-oewn-001',
      datasetVersion: '2026-03-24',
    });
    expect(firstRun.processed).toBe(3);
    expect(firstRun.inserted).toBe(3);

    const secondRun = await runOewnIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-oewn-002',
      datasetVersion: '2026-03-24',
    });

    expect(secondRun).toEqual<IngestSummary>({
      processed: 3,
      inserted: 0,
      updated: 3,
      skipped: 0,
      errors: 0,
    });

    const docs = await Vocabulary.find({ targetLanguage: 'en', sourceDataset: 'oewn' });
    expect(docs).toHaveLength(3);
    expect(docs[0].datasetManaged).toBe(true);
    expect(docs[0].sourceReference).toContain('oewn:');
  });
});
