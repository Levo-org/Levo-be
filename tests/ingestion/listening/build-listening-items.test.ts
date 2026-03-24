import path from 'path';
import Listening from '@/models/Listening';
import {
  buildListeningCandidates,
  runBuildListeningItems,
  type BuildSummary,
} from '@/scripts/build-listening-items';
import { serializeListeningPractice } from '@/services/listening/serializer';
import { connectTestDb, disconnectTestDb, clearCollections } from '../../setup';

const LARGE_FIXTURE = path.resolve(__dirname, '../../fixtures/ingestion/tatoeba-cc0-reading-large.tsv');
const SMALL_FIXTURE = path.resolve(__dirname, '../../fixtures/ingestion/tatoeba-cc0-listening-smallpool.tsv');

describe('listening item builder', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('builds deterministic candidates from fixture', () => {
    const first = buildListeningCandidates(LARGE_FIXTURE);
    const second = buildListeningCandidates(LARGE_FIXTURE);

    expect(first).toEqual(second);
    expect(first.length).toBe(24);
  });

  it('skips items when distractor pools are too small', async () => {
    const summary = await runBuildListeningItems({
      fixturePath: SMALL_FIXTURE,
      dryRun: true,
      batchId: 'test-listening-small',
      datasetVersion: '2026-03-24',
    });

    expect(summary).toEqual<BuildSummary>({
      processed: 1,
      inserted: 0,
      updated: 0,
      skipped: 1,
      errors: 0,
    });
  });

  it('is idempotent and serializes to FE DTO shape', async () => {
    const first = await runBuildListeningItems({
      fixturePath: LARGE_FIXTURE,
      dryRun: false,
      batchId: 'test-listening-large-1',
      datasetVersion: '2026-03-24',
    });
    expect(first.inserted).toBeGreaterThan(0);

    const second = await runBuildListeningItems({
      fixturePath: LARGE_FIXTURE,
      dryRun: false,
      batchId: 'test-listening-large-2',
      datasetVersion: '2026-03-24',
    });
    expect(second).toEqual<BuildSummary>({
      processed: 24,
      inserted: 0,
      updated: first.inserted,
      skipped: 24 - first.inserted,
      errors: 0,
    });

    const docs = await Listening.find({ sourceDataset: 'tatoeba-cc0' });
    expect(docs.length).toBe(first.inserted);

    const dto = serializeListeningPractice(
      {
        _id: docs[0]._id,
        audioText: docs[0].audioText,
        correctAnswer: docs[0].correctAnswer,
        difficulty: docs[0].difficulty,
      },
      ['A', 'B', 'C'],
    );
    expect(dto).toHaveProperty('question', 'Choose what you heard.');
    expect(dto).toHaveProperty('ttsText');
    expect(dto).toHaveProperty('audioUrl', null);
  });
});
