import path from 'path';
import Reading from '@/models/Reading';
import {
  buildPassagesFromFixture,
  runBuildReadingPassages,
  type BuildSummary,
} from '@/scripts/build-reading-passages';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const SMALL_FIXTURE = path.resolve(__dirname, '../../fixtures/ingestion/tatoeba-cc0-small.tsv');
const LARGE_FIXTURE = path.resolve(__dirname, '../../fixtures/ingestion/tatoeba-cc0-reading-large.tsv');

describe('reading passage builder', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('builds deterministic passages from the same fixture', () => {
    const first = buildPassagesFromFixture(LARGE_FIXTURE, '2026-03-24');
    const second = buildPassagesFromFixture(LARGE_FIXTURE, '2026-03-24');

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0]).toHaveProperty('quizzes');
  });

  it('returns zero inserts for insufficient sentence pools in dry-run', async () => {
    const summary = await runBuildReadingPassages({
      fixturePath: SMALL_FIXTURE,
      dryRun: true,
      batchId: 'test-reading-small',
      datasetVersion: '2026-03-24',
    });

    expect(summary.inserted).toBe(0);
    expect(summary.skipped).toBeGreaterThan(0);
  });

  it('is idempotent for reruns with the same dataset version', async () => {
    const firstRun = await runBuildReadingPassages({
      fixturePath: LARGE_FIXTURE,
      dryRun: false,
      batchId: 'test-reading-large-1',
      datasetVersion: '2026-03-24',
    });
    expect(firstRun.inserted).toBeGreaterThan(0);

    const secondRun = await runBuildReadingPassages({
      fixturePath: LARGE_FIXTURE,
      dryRun: false,
      batchId: 'test-reading-large-2',
      datasetVersion: '2026-03-24',
    });

    expect(secondRun).toEqual<BuildSummary>({
      processed: 24,
      inserted: 0,
      updated: firstRun.inserted,
      skipped: 24 - firstRun.inserted,
      errors: 0,
    });

    const docs = await Reading.find({ sourceDataset: 'tatoeba-cc0' });
    expect(docs.length).toBe(firstRun.inserted);
    expect(docs[0].translation).toBe('');
  });
});
