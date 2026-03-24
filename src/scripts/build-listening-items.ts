import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Listening from '@/models/Listening';
import ImportBatch from '@/models/ImportBatch';
import { assignQuartileLevels } from '@/scripts/ingest/shared/difficulty';
import { parseTatoebaRows } from '@/scripts/ingest/tatoeba-sentences';

interface BuildOptions {
  fixturePath: string;
  dryRun: boolean;
  batchId?: string;
  datasetVersion: string;
}

export interface BuildSummary {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface ListeningCandidate {
  sentenceId: string;
  targetLanguage: 'en' | 'ja' | 'zh';
  text: string;
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
}

function parseArgs(argv: string[]): BuildOptions {
  let fixturePath = '';
  let dryRun = false;
  let batchId: string | undefined;
  let datasetVersion = 'unknown';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--fixture') {
      fixturePath = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--batch-id') {
      batchId = argv[i + 1] ?? undefined;
      i += 1;
      continue;
    }
    if (arg === '--dataset-version') {
      datasetVersion = argv[i + 1] ?? datasetVersion;
      i += 1;
    }
  }

  if (!fixturePath) {
    throw new Error('--fixture is required');
  }

  return { fixturePath, dryRun, batchId, datasetVersion };
}

function scoreSentence(text: string): number {
  return -text.length;
}

export function buildListeningCandidates(fixturePath: string): ListeningCandidate[] {
  const rows = parseTatoebaRows(fixturePath);
  const ranked = assignQuartileLevels(rows.map((row) => ({ item: row, score: scoreSentence(row.text) })));

  return ranked.map(({ item, level }) => ({
    sentenceId: item.sentenceId,
    targetLanguage: item.targetLanguage,
    text: item.text,
    level,
  }));
}

function deterministicDistractors(pool: string[], answer: string): string[] {
  const candidates = pool.filter((item) => item !== answer).sort((a, b) => a.localeCompare(b));
  return candidates.slice(0, 3);
}

export async function runBuildListeningItems(options: BuildOptions): Promise<BuildSummary> {
  const allRows = parseTatoebaRows(options.fixturePath);
  const candidates = buildListeningCandidates(options.fixturePath);

  const grouped = new Map<string, string[]>();
  for (const item of candidates) {
    const key = `${item.targetLanguage}:${item.level}`;
    const list = grouped.get(key) ?? [];
    list.push(item.text);
    grouped.set(key, list);
  }

  const buildable = candidates.filter((item) => {
    const key = `${item.targetLanguage}:${item.level}`;
    const pool = grouped.get(key) ?? [];
    return deterministicDistractors(pool, item.text).length >= 3;
  });

  const skipped = candidates.length - buildable.length;

  if (options.dryRun) {
    return {
      processed: allRows.length,
      inserted: buildable.length,
      updated: 0,
      skipped,
      errors: 0,
    };
  }

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  const importBatch = await ImportBatch.create({
    fileName: options.batchId ?? path.basename(options.fixturePath),
    fileType: 'csv',
    contentType: 'listening',
    sourceDataset: 'tatoeba-cc0',
    datasetVersion: options.datasetVersion,
    artifactChecksum: '',
    status: 'completed',
    uploadedBy: new mongoose.Types.ObjectId('000000000000000000000000'),
    totalRows: allRows.length,
    validRows: buildable.length,
    invalidRows: 0,
    duplicateRows: 0,
    importedRows: 0,
    errors: [],
    startedAt: new Date(),
    completedAt: new Date(),
  });

  let inserted = 0;
  let updated = 0;

  for (const item of buildable) {
    const sourceReference = `tatoeba-listening:${item.sentenceId}:${options.datasetVersion}`;
    const result = await Listening.updateOne(
      { targetLanguage: item.targetLanguage, sourceReference },
      {
        $set: {
          targetLanguage: item.targetLanguage,
          audioText: item.text,
          correctAnswer: item.text,
          hint: '',
          difficulty: item.level,
          audioUrl: '',
          order: 0,
          sourceType: 'dataset_import',
          sourceDataset: 'tatoeba-cc0',
          datasetVersion: options.datasetVersion,
          sourceReference,
          license: 'CC0',
          datasetManaged: true,
          translationStatus: 'pending',
          importBatchId: importBatch._id,
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
      updated += 1;
    }
  }

  importBatch.importedRows = inserted + updated;
  importBatch.duplicateRows = updated;
  await importBatch.save();

  return {
    processed: allRows.length,
    inserted,
    updated,
    skipped,
    errors: 0,
  };
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv);
  const summary = await runBuildListeningItems(options);
  console.log(
    `processed=${summary.processed} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`listening build failed: ${message}`);
      process.exit(1);
    });
}
