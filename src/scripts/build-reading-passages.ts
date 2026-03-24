import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Reading from '@/models/Reading';
import ImportBatch from '@/models/ImportBatch';
import { assignQuartileLevels } from '@/scripts/ingest/shared/difficulty';
import { parseTatoebaRows } from '@/scripts/ingest/tatoeba-sentences';

type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

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

interface Passage {
  targetLanguage: 'en' | 'ja' | 'zh';
  level: Level;
  title: string;
  content: string;
  wordCount: number;
  quizzes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  sourceReference: string;
}

const SENTENCE_TARGET_COUNT: Record<Level, number> = {
  beginner: 3,
  elementary: 4,
  intermediate: 5,
  advanced: 6,
};

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

function wordCount(content: string): number {
  return content
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0).length;
}

function createQuizzes(sentences: string[]): Passage['quizzes'] {
  const first = sentences[0] ?? '';
  const last = sentences[sentences.length - 1] ?? '';

  const distractors = sentences.slice(1, 4);
  const firstQuestionOptions = [first, ...distractors].slice(0, 4);

  const length = sentences.length;
  const countOptions = [String(length), String(length + 1), String(Math.max(1, length - 1)), String(length + 2)];

  const lastQuestionOptions = [last, ...sentences.slice(0, 3)].slice(0, 4);

  return [
    {
      question: 'Which sentence appears in the passage?',
      options: firstQuestionOptions,
      correctAnswer: 0,
      explanation: 'The first option is from the passage.',
    },
    {
      question: 'How many sentences are in the passage?',
      options: countOptions,
      correctAnswer: 0,
      explanation: 'Count the number of lines in the passage.',
    },
    {
      question: 'Which sentence is the last one in the passage?',
      options: lastQuestionOptions,
      correctAnswer: 0,
      explanation: 'The first option is the final sentence.',
    },
  ];
}

export function buildPassagesFromFixture(fixturePath: string, datasetVersion: string): Passage[] {
  const rows = parseTatoebaRows(fixturePath);
  const ranked = assignQuartileLevels(rows.map((row) => ({ item: row, score: scoreSentence(row.text) })));

  const grouped = new Map<string, string[]>();
  for (const { item, level } of ranked) {
    const key = `${item.targetLanguage}:${level}`;
    const current = grouped.get(key) ?? [];
    current.push(item.text);
    grouped.set(key, current);
  }

  const levels: Level[] = ['beginner', 'elementary', 'intermediate', 'advanced'];
  const passages: Passage[] = [];
  const languages: Array<'en' | 'ja' | 'zh'> = ['en', 'ja', 'zh'];

  for (const language of languages) {
    for (const level of levels) {
      const key = `${language}:${level}`;
      const candidates = (grouped.get(key) ?? []).slice().sort((a, b) => a.localeCompare(b));
      const needed = SENTENCE_TARGET_COUNT[level];

      if (candidates.length < needed) {
        continue;
      }

      const selected = candidates.slice(0, needed);
      const content = selected.join('\n');
      passages.push({
        targetLanguage: language,
        level,
        title: `Auto Passage ${language.toUpperCase()} ${level}`,
        content,
        wordCount: wordCount(content),
        quizzes: createQuizzes(selected),
        sourceReference: `tatoeba-reading:${language}:${level}:1:${datasetVersion}`,
      });
    }
  }

  return passages;
}

export async function runBuildReadingPassages(options: BuildOptions): Promise<BuildSummary> {
  const allLines = parseTatoebaRows(options.fixturePath);
  const passages = buildPassagesFromFixture(options.fixturePath, options.datasetVersion);

  if (options.dryRun) {
    return {
      processed: allLines.length,
      inserted: passages.length,
      updated: 0,
      skipped: allLines.length - passages.length,
      errors: 0,
    };
  }

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  const importBatch = await ImportBatch.create({
    fileName: options.batchId ?? path.basename(options.fixturePath),
    fileType: 'csv',
    contentType: 'reading',
    sourceDataset: 'tatoeba-cc0',
    datasetVersion: options.datasetVersion,
    artifactChecksum: '',
    status: 'completed',
    uploadedBy: new mongoose.Types.ObjectId('000000000000000000000000'),
    totalRows: allLines.length,
    validRows: passages.length,
    invalidRows: 0,
    duplicateRows: 0,
    importedRows: 0,
    errors: [],
    startedAt: new Date(),
    completedAt: new Date(),
  });

  let inserted = 0;
  let updated = 0;
  for (const passage of passages) {
    const result = await Reading.updateOne(
      {
        targetLanguage: passage.targetLanguage,
        sourceReference: passage.sourceReference,
      },
      {
        $set: {
          targetLanguage: passage.targetLanguage,
          title: passage.title,
          difficulty: passage.level,
          content: passage.content,
          translation: '',
          wordCount: passage.wordCount,
          quizzes: passage.quizzes,
          order: 0,
          sourceType: 'dataset_import',
          sourceDataset: 'tatoeba-cc0',
          datasetVersion: options.datasetVersion,
          sourceReference: passage.sourceReference,
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
    skipped: Math.max(0, allLines.length - passages.length),
    errors: 0,
  };
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv);
  const summary = await runBuildReadingPassages(options);
  console.log(
    `processed=${summary.processed} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`reading passage build failed: ${message}`);
      process.exit(1);
    });
}
