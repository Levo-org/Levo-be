import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';
import ExampleSentence from '@/models/ExampleSentence';
import Reading from '@/models/Reading';
import Listening from '@/models/Listening';
import { createPapagoClientFromEnv, PapagoTranslationClient } from '@/services/translation/papago';

type BackfillContentType = 'vocabulary' | 'exampleSentence' | 'reading' | 'listening' | 'all';
type TranslationProvider = 'papago';

interface BackfillOptions {
  provider?: TranslationProvider;
  contentType: BackfillContentType;
  batchSize: number;
  dryRun: boolean;
  resumeFailed: boolean;
}

export interface BackfillSummary {
  scanned: number;
  updated: number;
  failed: number;
  skipped: number;
}

function parseArgs(argv: string[]): BackfillOptions {
  let provider: TranslationProvider = 'papago';
  let contentType: BackfillContentType = 'all';
  let batchSize = 20;
  let dryRun = false;
  let resumeFailed = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--provider') {
      const raw = argv[i + 1];
      if (raw === 'papago') {
        provider = raw;
      }
      i += 1;
      continue;
    }
    if (arg === '--content-type') {
      const raw = argv[i + 1] as BackfillContentType | undefined;
      if (raw) {
        contentType = raw;
      }
      i += 1;
      continue;
    }
    if (arg === '--batch-size') {
      const parsed = Number(argv[i + 1]);
      if (!Number.isNaN(parsed) && parsed > 0) {
        batchSize = parsed;
      }
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--resume-failed') {
      resumeFailed = true;
    }
  }

  return { provider, contentType, batchSize, dryRun, resumeFailed };
}

function sourceLanguage(targetLanguage: string): string {
  if (targetLanguage === 'zh') {
    return 'zh-CN';
  }
  return targetLanguage;
}

function translationStatuses(resumeFailed: boolean): Array<'pending' | 'failed'> {
  return resumeFailed ? ['failed'] : ['pending', 'failed'];
}

async function backfillVocabulary(
  client: PapagoTranslationClient,
  options: BackfillOptions,
): Promise<BackfillSummary> {
  const statuses = translationStatuses(options.resumeFailed);
  const docs = await Vocabulary.find({
    datasetManaged: true,
    translationStatus: { $in: statuses },
  })
    .sort({ _id: 1 })
    .limit(options.batchSize);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of docs) {
    const source = sourceLanguage(doc.targetLanguage);
    const updates: Record<string, string> = {};
    try {
      if (!doc.meaning || doc.meaning.trim().length === 0) {
        updates.meaning = await client.translate(doc.word, source, 'ko');
      }

      if (doc.exampleSentence && (!doc.exampleTranslation || doc.exampleTranslation.trim().length === 0)) {
        updates.exampleTranslation = await client.translate(doc.exampleSentence, source, 'ko');
      }

      if (Object.keys(updates).length === 0) {
        skipped += 1;
        continue;
      }

      if (!options.dryRun) {
        await Vocabulary.updateOne(
          { _id: doc._id },
          {
            $set: {
              ...updates,
              translationStatus: 'complete',
              translationProvider: 'papago',
              translationVersion: 'v1',
              translationError: '',
              lastTranslatedAt: new Date(),
            },
          },
        );
      }

      updated += 1;
    } catch (error) {
      failed += 1;
      if (!options.dryRun) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await Vocabulary.updateOne(
          { _id: doc._id },
          {
            $set: {
              translationStatus: 'failed',
              translationProvider: 'papago',
              translationError: message,
            },
          },
        );
      }
    }
  }

  return {
    scanned: docs.length,
    updated,
    failed,
    skipped,
  };
}

async function backfillExampleSentences(
  client: PapagoTranslationClient,
  options: BackfillOptions,
): Promise<BackfillSummary> {
  const statuses = translationStatuses(options.resumeFailed);
  const docs = await ExampleSentence.find({
    datasetManaged: true,
    translationStatus: { $in: statuses },
  })
    .sort({ _id: 1 })
    .limit(options.batchSize);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (doc.translation && doc.translation.trim().length > 0) {
      skipped += 1;
      continue;
    }

    try {
      const translated = await client.translate(doc.originalText, sourceLanguage(doc.targetLanguage), 'ko');
      if (!options.dryRun) {
        await ExampleSentence.updateOne(
          { _id: doc._id },
          {
            $set: {
              translation: translated,
              translationStatus: 'complete',
              translationProvider: 'papago',
              translationVersion: 'v1',
              translationError: '',
              lastTranslatedAt: new Date(),
            },
          },
        );
      }
      updated += 1;
    } catch (error) {
      failed += 1;
      if (!options.dryRun) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await ExampleSentence.updateOne(
          { _id: doc._id },
          {
            $set: {
              translationStatus: 'failed',
              translationProvider: 'papago',
              translationError: message,
            },
          },
        );
      }
    }
  }

  return {
    scanned: docs.length,
    updated,
    failed,
    skipped,
  };
}

async function backfillReadings(
  client: PapagoTranslationClient,
  options: BackfillOptions,
): Promise<BackfillSummary> {
  const statuses = translationStatuses(options.resumeFailed);
  const docs = await Reading.find({
    datasetManaged: true,
    translationStatus: { $in: statuses },
  })
    .sort({ _id: 1 })
    .limit(options.batchSize);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (doc.translation && doc.translation.trim().length > 0) {
      skipped += 1;
      continue;
    }

    try {
      const translated = await client.translate(doc.content, sourceLanguage(doc.targetLanguage), 'ko');
      if (!options.dryRun) {
        await Reading.updateOne(
          { _id: doc._id },
          {
            $set: {
              translation: translated,
              translationStatus: 'complete',
              translationProvider: 'papago',
              translationVersion: 'v1',
              translationError: '',
              lastTranslatedAt: new Date(),
            },
          },
        );
      }
      updated += 1;
    } catch (error) {
      failed += 1;
      if (!options.dryRun) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await Reading.updateOne(
          { _id: doc._id },
          {
            $set: {
              translationStatus: 'failed',
              translationProvider: 'papago',
              translationError: message,
            },
          },
        );
      }
    }
  }

  return {
    scanned: docs.length,
    updated,
    failed,
    skipped,
  };
}

async function backfillListening(
  client: PapagoTranslationClient,
  options: BackfillOptions,
): Promise<BackfillSummary> {
  const statuses = translationStatuses(options.resumeFailed);
  const docs = await Listening.find({
    datasetManaged: true,
    translationStatus: { $in: statuses },
  })
    .sort({ _id: 1 })
    .limit(options.batchSize);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (doc.hint && doc.hint.trim().length > 0) {
      skipped += 1;
      continue;
    }

    try {
      const translated = await client.translate(doc.correctAnswer || doc.audioText, sourceLanguage(doc.targetLanguage), 'ko');
      if (!options.dryRun) {
        await Listening.updateOne(
          { _id: doc._id },
          {
            $set: {
              hint: translated,
              translationStatus: 'complete',
              translationProvider: 'papago',
              translationVersion: 'v1',
              translationError: '',
              lastTranslatedAt: new Date(),
            },
          },
        );
      }
      updated += 1;
    } catch (error) {
      failed += 1;
      if (!options.dryRun) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await Listening.updateOne(
          { _id: doc._id },
          {
            $set: {
              translationStatus: 'failed',
              translationProvider: 'papago',
              translationError: message,
            },
          },
        );
      }
    }
  }

  return {
    scanned: docs.length,
    updated,
    failed,
    skipped,
  };
}

function sumSummaries(items: BackfillSummary[]): BackfillSummary {
  return items.reduce<BackfillSummary>(
    (acc, item) => ({
      scanned: acc.scanned + item.scanned,
      updated: acc.updated + item.updated,
      failed: acc.failed + item.failed,
      skipped: acc.skipped + item.skipped,
    }),
    { scanned: 0, updated: 0, failed: 0, skipped: 0 },
  );
}

export async function runBackfillKo(
  options: BackfillOptions,
  client: PapagoTranslationClient,
): Promise<BackfillSummary> {
  const summaries: BackfillSummary[] = [];

  if (options.contentType === 'all' || options.contentType === 'vocabulary') {
    summaries.push(await backfillVocabulary(client, options));
  }
  if (options.contentType === 'all' || options.contentType === 'exampleSentence') {
    summaries.push(await backfillExampleSentences(client, options));
  }
  if (options.contentType === 'all' || options.contentType === 'reading') {
    summaries.push(await backfillReadings(client, options));
  }
  if (options.contentType === 'all' || options.contentType === 'listening') {
    summaries.push(await backfillListening(client, options));
  }

  return sumSummaries(summaries);
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv);

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  const provider = options.provider ?? 'papago';
  if (provider !== 'papago') {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const client = createPapagoClientFromEnv();
  const summary = await runBackfillKo(options, client);
  console.log(
    `scanned=${summary.scanned} updated=${summary.updated} failed=${summary.failed} skipped=${summary.skipped}`,
  );
}

if (require.main === module) {
  runCli(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`backfill-ko failed: ${message}`);
      process.exit(1);
    });
}
