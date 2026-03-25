import mongoose, { Types, Model } from 'mongoose';
import { config } from '@/config';
import { connectDatabase } from '@/config/database';

// Models
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import ExampleSentence from '@/models/ExampleSentence';
import Lesson from '@/models/Lesson';
import Badge from '@/models/Badge';
import ImportBatch from '@/models/ImportBatch';

// Seed data – Vocabulary
import { englishVocabulary } from '@/seeds/data/vocabulary.en';
import { japaneseVocabulary } from '@/seeds/data/vocabulary.ja';
import { chineseVocabulary } from '@/seeds/data/vocabulary.zh';

// Seed data – Grammar
import { englishGrammar } from '@/seeds/data/grammar.en';
import { japaneseGrammar } from '@/seeds/data/grammar.ja';
import { chineseGrammar } from '@/seeds/data/grammar.zh';

// Seed data – Conversation
import { englishConversations } from '@/seeds/data/conversation.en';
import { japaneseConversations } from '@/seeds/data/conversation.ja';
import { chineseConversations } from '@/seeds/data/conversation.zh';

// Seed data – Listening
import { listeningEnData } from '@/seeds/data/listening.en';
import { listeningJaData } from '@/seeds/data/listening.ja';
import { listeningZhData } from '@/seeds/data/listening.zh';

// Seed data – Reading
import { readingEnData } from '@/seeds/data/reading.en';
import { readingJaData } from '@/seeds/data/reading.ja';
import { readingZhData } from '@/seeds/data/reading.zh';

// Seed data – Lessons
import { lessonsEnData } from '@/seeds/data/lessons.en';
import { lessonsJaData } from '@/seeds/data/lessons.ja';
import { lessonsZhData } from '@/seeds/data/lessons.zh';

// Seed data – Badges
import { badgesData } from '@/seeds/data/badges';

// ─── Constants ────────────────────────────────────────
const SYSTEM_USER_ID = new Types.ObjectId('000000000000000000000000');

// ─── Helpers ──────────────────────────────────────────
const addTargetLanguage = <T extends Record<string, unknown>>(items: T[], lang: string) =>
  items.map((item) => ({ ...item, targetLanguage: lang }));

const log = {
  section: (title: string) => console.log(`\n${'═'.repeat(50)}\n  ${title}\n${'═'.repeat(50)}`),
  success: (msg: string) => console.log(`  ✅ ${msg}`),
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
  error: (msg: string) => console.error(`  ❌ ${msg}`),
};

// ─── Types ────────────────────────────────────────────
interface ContentMigrationConfig {
  contentType: string;
  model: Model<unknown>;
  datasets: Array<{ lang: string; data: Record<string, unknown>[] }>;
  uniqueKeyBuilder: (item: Record<string, unknown>) => Record<string, unknown>;
}

interface MigrationSummary {
  contentType: string;
  lang: string;
  totalRows: number;
  upsertedCount: number;
  modifiedCount: number;
  importBatchId: Types.ObjectId;
}

interface PublishSummary {
  contentType: string;
  matchedCount: number;
  modifiedCount: number;
}

// ─── Import batch creation ────────────────────────────
async function createImportBatch(
  contentType: string,
  lang: string,
  totalRows: number,
): Promise<InstanceType<typeof ImportBatch>> {
  const batch = await ImportBatch.create({
    fileName: `seed-${contentType}-${lang}`,
    fileType: 'csv',
    contentType,
    status: 'completed',
    uploadedBy: SYSTEM_USER_ID,
    totalRows,
    validRows: totalRows,
    invalidRows: 0,
    duplicateRows: 0,
    importedRows: totalRows,
    errors: [],
    completedAt: new Date(),
    metadata: { migrationType: 'seed_import' },
  });

  return batch;
}

// ─── Editorial content migration ──────────────────────
async function migrateEditorialContent(
  migrationConfig: ContentMigrationConfig,
): Promise<MigrationSummary[]> {
  const summaries: MigrationSummary[] = [];

  for (const { lang, data } of migrationConfig.datasets) {
    const items = addTargetLanguage(data, lang);
    const totalRows = items.length;

    if (totalRows === 0) {
      log.info(`${migrationConfig.contentType}-${lang}: 데이터 없음, 건너뜀`);
      continue;
    }

    let batch = await ImportBatch.findOne({
      fileName: `seed-${migrationConfig.contentType}-${lang}`,
      contentType: migrationConfig.contentType,
      'metadata.migrationType': 'seed_import',
    });

    if (!batch) {
      batch = await createImportBatch(migrationConfig.contentType, lang, totalRows);
    }

    const batchId = batch._id as Types.ObjectId;

    const operations = items.map((item) => ({
      updateOne: {
        filter: migrationConfig.uniqueKeyBuilder(item),
        update: {
          $set: {
            ...item,
            status: 'published' as const,
            sourceType: 'seed_import' as const,
            importBatchId: batchId,
          },
        },
        upsert: true,
      },
    }));

    const result = await migrationConfig.model.bulkWrite(operations);

    const upsertedCount = result.upsertedCount;
    const modifiedCount = result.modifiedCount;

    batch.totalRows = totalRows;
    batch.validRows = totalRows;
    batch.importedRows = upsertedCount + modifiedCount;
    batch.duplicateRows = modifiedCount;
    await batch.save();

    log.success(
      `${migrationConfig.contentType}-${lang}: ` +
        `${upsertedCount} inserted, ${modifiedCount} updated (${totalRows} total)`,
    );

    summaries.push({
      contentType: migrationConfig.contentType,
      lang,
      totalRows,
      upsertedCount,
      modifiedCount,
      importBatchId: batchId,
    });
  }

  return summaries;
}

// ─── Non-editorial content migration (Lesson, Badge) ──
async function migrateNonEditorialContent(
  contentType: string,
  model: Model<unknown>,
  datasets: Array<{ lang: string; data: Record<string, unknown>[] }>,
  uniqueKeyBuilder: (item: Record<string, unknown>) => Record<string, unknown>,
): Promise<void> {
  for (const { lang, data } of datasets) {
    const items = addTargetLanguage(data, lang);
    const totalRows = items.length;

    if (totalRows === 0) {
      log.info(`${contentType}-${lang}: 데이터 없음, 건너뜀`);
      continue;
    }

    const operations = items.map((item) => ({
      updateOne: {
        filter: uniqueKeyBuilder(item),
        update: { $set: item },
        upsert: true,
      },
    }));

    const result = await model.bulkWrite(operations);

    log.success(
      `${contentType}-${lang}: ` +
        `${result.upsertedCount} inserted, ${result.modifiedCount} updated (${totalRows} total)`,
    );
  }
}

async function migrateBadges(): Promise<void> {
  const totalRows = badgesData.length;

  if (totalRows === 0) {
    log.info('Badge: 데이터 없음, 건너뜀');
    return;
  }

  const operations = badgesData.map((item) => ({
    updateOne: {
      filter: { name: item.name },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await Badge.bulkWrite(operations);

  log.success(
    `Badge: ${result.upsertedCount} inserted, ${result.modifiedCount} updated (${totalRows} total)`,
  );
}

async function publishExistingEditorialContent(): Promise<PublishSummary[]> {
  const publishedAt = new Date();
  const editorialModels: Array<{ contentType: string; model: Model<unknown> }> = [
    { contentType: 'vocabulary', model: Vocabulary as Model<unknown> },
    { contentType: 'grammar', model: Grammar as Model<unknown> },
    { contentType: 'conversation', model: Conversation as Model<unknown> },
    { contentType: 'listening', model: Listening as Model<unknown> },
    { contentType: 'reading', model: Reading as Model<unknown> },
    { contentType: 'exampleSentence', model: ExampleSentence as Model<unknown> },
  ];

  const summaries: PublishSummary[] = [];

  log.section('🚀 기존 Editorial 콘텐츠 공개 상태 반영');

  for (const { contentType, model } of editorialModels) {
    const result = await model.updateMany(
      { status: { $ne: 'published' } },
      {
        $set: {
          status: 'published',
          publishedAt,
        },
      },
    );

    log.success(
      `${contentType}: ${result.modifiedCount} published (${result.matchedCount} matched)`,
    );

    summaries.push({
      contentType,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  }

  return summaries;
}

// ─── Main migration function (exported for testing) ───
export async function runMigration(): Promise<MigrationSummary[]> {
  const allSummaries: MigrationSummary[] = [];

  // ── Editorial content types ──
  const editorialConfigs: ContentMigrationConfig[] = [
    {
      contentType: 'vocabulary',
      model: Vocabulary as Model<unknown>,
      datasets: [
        { lang: 'en', data: englishVocabulary },
        { lang: 'ja', data: japaneseVocabulary },
        { lang: 'zh', data: chineseVocabulary },
      ],
      uniqueKeyBuilder: (item) => ({ targetLanguage: item.targetLanguage, word: item.word }),
    },
    {
      contentType: 'grammar',
      model: Grammar as Model<unknown>,
      datasets: [
        { lang: 'en', data: englishGrammar },
        { lang: 'ja', data: japaneseGrammar },
        { lang: 'zh', data: chineseGrammar },
      ],
      uniqueKeyBuilder: (item) => ({ targetLanguage: item.targetLanguage, title: item.title }),
    },
    {
      contentType: 'conversation',
      model: Conversation as Model<unknown>,
      datasets: [
        { lang: 'en', data: englishConversations },
        { lang: 'ja', data: japaneseConversations },
        { lang: 'zh', data: chineseConversations },
      ],
      uniqueKeyBuilder: (item) => ({ targetLanguage: item.targetLanguage, title: item.title }),
    },
    {
      contentType: 'listening',
      model: Listening as Model<unknown>,
      datasets: [
        { lang: 'en', data: listeningEnData },
        { lang: 'ja', data: listeningJaData },
        { lang: 'zh', data: listeningZhData },
      ],
      uniqueKeyBuilder: (item) => ({ targetLanguage: item.targetLanguage, audioText: item.audioText }),
    },
    {
      contentType: 'reading',
      model: Reading as Model<unknown>,
      datasets: [
        { lang: 'en', data: readingEnData },
        { lang: 'ja', data: readingJaData },
        { lang: 'zh', data: readingZhData },
      ],
      uniqueKeyBuilder: (item) => ({ targetLanguage: item.targetLanguage, title: item.title }),
    },
  ];

  for (const editorialConfig of editorialConfigs) {
    log.section(`📦 ${editorialConfig.contentType} 마이그레이션`);
    const summaries = await migrateEditorialContent(editorialConfig);
    allSummaries.push(...summaries);
  }

  // ── Non-editorial content types ──
  log.section('📚 Lesson 마이그레이션');
  await migrateNonEditorialContent(
    'lesson',
    Lesson as Model<unknown>,
    [
      { lang: 'en', data: lessonsEnData },
      { lang: 'ja', data: lessonsJaData },
      { lang: 'zh', data: lessonsZhData },
    ],
    (item) => ({ targetLanguage: item.targetLanguage, lessonTitle: item.lessonTitle }),
  );

  log.section('🏅 Badge 마이그레이션');
  await migrateBadges();

  await publishExistingEditorialContent();

  return allSummaries;
}

// ─── CLI entry point ──────────────────────────────────
async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('\n🔄 Seed → DB 마이그레이션 시작');
  console.log(`   환경: ${config.nodeEnv}`);
  console.log(`   DB:   ${config.mongodb.uri}`);

  try {
    await connectDatabase();

    const summaries = await runMigration();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.section('🎉 마이그레이션 완료!');

    console.log('\n  📊 Editorial 콘텐츠 마이그레이션 결과:');
    for (const summary of summaries) {
      console.log(
        `     ${summary.contentType}-${summary.lang}: ` +
          `${summary.upsertedCount} new, ${summary.modifiedCount} updated ` +
          `(${summary.totalRows} total) [batch: ${summary.importBatchId}]`,
      );
    }

    const totalInserted = summaries.reduce((sum, s) => sum + s.upsertedCount, 0);
    const totalUpdated = summaries.reduce((sum, s) => sum + s.modifiedCount, 0);
    const totalRows = summaries.reduce((sum, s) => sum + s.totalRows, 0);

    console.log(`     ${'─'.repeat(40)}`);
    console.log(`     TOTAL: ${totalInserted} new, ${totalUpdated} updated (${totalRows} rows)`);

    const counts = {
      vocabulary: await Vocabulary.countDocuments(),
      grammar: await Grammar.countDocuments(),
      conversation: await Conversation.countDocuments(),
      listening: await Listening.countDocuments(),
      reading: await Reading.countDocuments(),
      lesson: await Lesson.countDocuments(),
      badge: await Badge.countDocuments(),
      importBatch: await ImportBatch.countDocuments(),
    };

    console.log('\n  📊 컬렉션별 문서 수:');
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`     ${name.padEnd(15)} ${count}개`);
    });
    console.log(`\n  ⏱️  소요 시간: ${elapsed}초\n`);
  } catch (error) {
    log.error('마이그레이션 실패');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('  👋 MongoDB 연결 해제\n');
  }
}

if (require.main === module) {
  main();
}
