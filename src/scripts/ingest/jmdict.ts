import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';
import ImportBatch from '@/models/ImportBatch';
import { assignQuartileLevels } from '@/scripts/ingest/shared/difficulty';

interface JMdictGloss {
  lang?: string;
  text?: string;
}

interface JMdictSense {
  gloss?: JMdictGloss[];
  pos?: string[];
}

interface JMdictKana {
  text?: string;
}

interface JMdictKanji {
  text?: string;
}

interface JMdictEntry {
  id: number;
  k?: JMdictKanji[];
  r?: JMdictKana[];
  s?: JMdictSense[];
}

interface IngestJMdictOptions {
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

function parseArgs(argv: string[]): IngestJMdictOptions {
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

export function parseJMdictEntries(filePath: string): JMdictEntry[] {
  const fullPath = resolveFixturePath(filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const data = JSON.parse(content) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('JMdict fixture must be a JSON array');
  }

  return data as JMdictEntry[];
}

function pickWord(entry: JMdictEntry): string {
  const kanjiWord = entry.k?.[0]?.text?.trim();
  if (kanjiWord && kanjiWord.length > 0) {
    return kanjiWord;
  }

  return entry.r?.[0]?.text?.trim() ?? '';
}

function pickPronunciation(entry: JMdictEntry): string {
  return entry.r?.[0]?.text?.trim() ?? '';
}

function pickMeaning(entry: JMdictEntry): string {
  const glosses = entry.s?.[0]?.gloss ?? [];
  const englishGloss = glosses.find((gloss) => gloss.lang === 'eng' && typeof gloss.text === 'string');

  return englishGloss?.text?.trim() ?? '';
}

function pickPartOfSpeech(entry: JMdictEntry): string {
  const pos = entry.s?.[0]?.pos?.[0]?.trim();
  return pos && pos.length > 0 ? pos : 'unknown';
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

function scoreJapaneseEntry(entry: JMdictEntry): number {
  const word = pickWord(entry);
  const kana = pickPronunciation(entry);
  const baseLength = Math.max(word.length, kana.length);
  return -baseLength;
}

function isValidEntry(entry: JMdictEntry): boolean {
  return pickWord(entry).length > 0 && pickMeaning(entry).length > 0;
}

export async function runJMdictIngestion(options: IngestJMdictOptions): Promise<IngestSummary> {
  const rawEntries = parseJMdictEntries(options.fixturePath);
  const validEntries = rawEntries.filter((entry) => isValidEntry(entry));
  const skipped = rawEntries.length - validEntries.length;

  const ranked = validEntries.map((entry) => ({ item: entry, score: scoreJapaneseEntry(entry) }));
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
    sourceDataset: 'jmdict',
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
    const sourceReference = `jmdict:${item.id}:${options.datasetVersion}`;
    const result = await Vocabulary.updateOne(
      {
        targetLanguage: 'ja',
        sourceReference,
      },
      {
        $set: {
          targetLanguage: 'ja',
          word: pickWord(item),
          pronunciation: pickPronunciation(item),
          meaning: pickMeaning(item),
          partOfSpeech: pickPartOfSpeech(item),
          level,
          chapter: mapChapter(level),
          exampleSentence: '',
          exampleTranslation: '',
          audioUrl: '',
          order: 0,
          sourceType: 'dataset_import',
          sourceDataset: 'jmdict',
          datasetVersion: options.datasetVersion,
          sourceReference,
          license: 'CC BY-SA 4.0',
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
  const summary = await runJMdictIngestion(options);
  console.log(
    `processed=${summary.processed} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`jmdict ingestion failed: ${message}`);
      process.exit(1);
    });
}
