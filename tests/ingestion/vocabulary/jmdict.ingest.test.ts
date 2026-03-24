import path from 'path';
import Vocabulary from '@/models/Vocabulary';
import {
  parseJMdictEntries,
  runJMdictIngestion,
  type IngestSummary,
} from '@/scripts/ingest/jmdict';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const FIXTURE_PATH = path.resolve(__dirname, '../../fixtures/ingestion/jmdict-small.json');

describe('JMdict ingestion', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('parses fixture entries', () => {
    const entries = parseJMdictEntries(FIXTURE_PATH);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveProperty('id');
  });

  it('returns deterministic dry-run summary', async () => {
    const summary = await runJMdictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: true,
      batchId: 'test-jmdict-001',
      datasetVersion: '2026-03-24',
    });

    expect(summary).toEqual<IngestSummary>({
      processed: 2,
      inserted: 2,
      updated: 0,
      skipped: 0,
      errors: 0,
    });
  });

  it('is idempotent for identical dataset version reruns', async () => {
    const firstRun = await runJMdictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-jmdict-001',
      datasetVersion: '2026-03-24',
    });
    expect(firstRun.inserted).toBe(2);

    const secondRun = await runJMdictIngestion({
      fixturePath: FIXTURE_PATH,
      dryRun: false,
      batchId: 'test-jmdict-002',
      datasetVersion: '2026-03-24',
    });
    expect(secondRun).toEqual<IngestSummary>({
      processed: 2,
      inserted: 0,
      updated: 2,
      skipped: 0,
      errors: 0,
    });

    const docs = await Vocabulary.find({ targetLanguage: 'ja', sourceDataset: 'jmdict' });
    expect(docs).toHaveLength(2);
    expect(docs[0].datasetManaged).toBe(true);
    expect(docs[0].sourceReference).toContain('jmdict:');
  });
});
