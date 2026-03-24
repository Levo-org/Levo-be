import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';
import ImportBatch from '@/models/ImportBatch';
import { assignQuartileLevels } from '@/scripts/ingest/shared/difficulty';

interface CedictEntry {
  id: string;
  traditional: string;
  simplified: string;
  pinyin: string;
  glosses: string[];
}

interface IngestCedictOptions {
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

function parseArgs(argv: string[]): IngestCedictOptions {
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

export function parseCedictEntries(filePath: string): CedictEntry[] {
  const fullPath = resolveFixturePath(filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  const entries: CedictEntry[] = [];
  for (const line of lines) {
    const match = line.match(/^([^\s]+)\s+([^\s]+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
    if (!match) {
      continue;
    }

    const traditional = match[1];
    const simplified = match[2];
    const pinyin = match[3];
    const glosses = match[4].split('/').map((item) => item.trim()).filter((item) => item.length > 0);

    entries.push({
      id: `${simplified}:${pinyin}`,
      traditional,
      simplified,
      pinyin,
      glosses,
    });
  }

  return entries;
}

function mapChapter(level: string): number {
  switch (level) {
    case 'beginner':
      return 1;
    case 'elementary':
      return 2;
    case 'intermediate':
      return 3;
    default:
      return 4;
  }
}

function scoreCedictEntry(entry: CedictEntry): number {
  const lengthPenalty = entry.simplified.length;
  const glossPenalty = entry.glosses[0]?.length ?? 0;
  return -(lengthPenalty + glossPenalty * 0.1);
}

function isValidEntry(entry: CedictEntry): boolean {
  return (
    entry.simplified.trim().length > 0 &&
    entry.pinyin.trim().length > 0 &&
    Array.isArray(entry.glosses) &&
    entry.glosses.length > 0
  );
}

export async function runCedictIngestion(options: IngestCedictOptions): Promise<IngestSummary> {
  const rawEntries = parseCedictEntries(options.fixturePath);
  const validEntries = rawEntries.filter((entry) => isValidEntry(entry));
  const skipped = rawEntries.length - validEntries.length;

  const ranked = validEntries.map((entry) => ({ item: entry, score: scoreCedictEntry(entry) }));
  const withLevels = assignQuartileLevels(ranked);

  if (options.dryRun) {
    return {
      processed: rawEntries.length,
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
    contentType: 'vocabulary',
    sourceDataset: 'cc-cedict',
    datasetVersion: options.datasetVersion,
    artifactChecksum: '',
    status: 'completed',
    uploadedBy: new mongoose.Types.ObjectId('000000000000000000000000'),
    totalRows: rawEntries.length,
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
    const sourceReference = `cc-cedict:${item.id}:${options.datasetVersion}`;

    const result = await Vocabulary.updateOne(
      {
        targetLanguage: 'zh',
        sourceReference,
      },
      {
        $set: {
          targetLanguage: 'zh',
          word: item.simplified,
          pronunciation: item.pinyin,
          meaning: item.glosses[0],
          partOfSpeech: 'unknown',
          level,
          chapter: mapChapter(level),
          exampleSentence: '',
          exampleTranslation: '',
          audioUrl: '',
          order: 0,
          sourceType: 'dataset_import',
          sourceDataset: 'cc-cedict',
          datasetVersion: options.datasetVersion,
          sourceReference,
          license: 'CC BY-SA 3.0',
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
    processed: rawEntries.length,
    inserted,
    updated,
    skipped,
    errors: 0,
  };
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv);
  const summary = await runCedictIngestion(options);

  console.log(
    `processed=${summary.processed} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`cedict ingestion failed: ${message}`);
      process.exit(1);
    });
}
