import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import ExampleSentence from '@/models/ExampleSentence';
import ImportBatch from '@/models/ImportBatch';
import { assignQuartileLevels } from '@/scripts/ingest/shared/difficulty';
import { normalizeText } from '@/utils/normalizeText';

interface TatoebaRow {
  sentenceId: string;
  sourceLanguage: string;
  targetLanguage: 'en' | 'ja' | 'zh';
  text: string;
}

interface IngestTatoebaOptions {
  fixturePath: string;
  dryRun: boolean;
  batchId?: string;
  datasetVersion: string;
}

export interface IngestSummary {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

function parseArgs(argv: string[]): IngestTatoebaOptions {
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

function resolveFixturePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath);
}

function mapLanguage(code: string): 'en' | 'ja' | 'zh' | null {
  if (code === 'eng') {
    return 'en';
  }
  if (code === 'jpn') {
    return 'ja';
  }
  if (code === 'cmn') {
    return 'zh';
  }

  return null;
}

export function parseTatoebaRows(filePath: string): TatoebaRow[] {
  const fullPath = resolveFixturePath(filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  const rows: TatoebaRow[] = [];
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const [sentenceId, sourceLanguage, text] = line.split('\t');
    const targetLanguage = mapLanguage(sourceLanguage ?? '');
    if (!sentenceId || !targetLanguage || !text || text.trim().length === 0) {
      continue;
    }

    rows.push({
      sentenceId,
      sourceLanguage,
      targetLanguage,
      text: text.trim(),
    });
  }

  return rows;
}

function scoreSentence(text: string): number {
  return -text.length;
}

export async function runTatoebaSentenceIngestion(
  options: IngestTatoebaOptions,
): Promise<IngestSummary> {
  const allLines = fs
    .readFileSync(resolveFixturePath(options.fixturePath), 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const rows = parseTatoebaRows(options.fixturePath);
  const skipped = allLines.length - rows.length;

  const ranked = rows.map((row) => ({ item: row, score: scoreSentence(row.text) }));
  const withLevels = assignQuartileLevels(ranked);

  if (options.dryRun) {
    return {
      processed: allLines.length,
      inserted: withLevels.length,
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
    contentType: 'exampleSentence',
    sourceDataset: 'tatoeba-cc0',
    datasetVersion: options.datasetVersion,
    artifactChecksum: '',
    status: 'completed',
    uploadedBy: new mongoose.Types.ObjectId('000000000000000000000000'),
    totalRows: allLines.length,
    validRows: withLevels.length,
    invalidRows: 0,
    duplicateRows: 0,
    importedRows: 0,
    errors: [],
    startedAt: new Date(),
    completedAt: new Date(),
  });

  let inserted = 0;
  let updated = 0;

  for (const { item, level } of withLevels) {
    const sourceReference = `tatoeba-cc0:${item.sentenceId}:${options.datasetVersion}`;

    const result = await ExampleSentence.updateOne(
      {
        targetLanguage: item.targetLanguage,
        sourceReference,
      },
      {
        $set: {
          targetLanguage: item.targetLanguage,
          topic: 'general',
          level,
          originalText: item.text,
          translation: '',
          normalizedKey: normalizeText(item.text),
          tags: [],
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
    processed: allLines.length,
    inserted,
    updated,
    skipped,
    errors: 0,
  };
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv);
  const summary = await runTatoebaSentenceIngestion(options);

  console.log(
    `processed=${summary.processed} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`tatoeba sentence ingestion failed: ${message}`);
      process.exit(1);
    });
}
