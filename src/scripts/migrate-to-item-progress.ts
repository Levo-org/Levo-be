import mongoose from 'mongoose';
import { config } from '@/config';
import { connectDatabase } from '@/config/database';
import UserProgress, { type IUserProgress } from '@/models/UserProgress';
import UserItemProgress from '@/models/UserItemProgress';

interface MigrationStats {
  totalProgressDocs: number;
  vocabularyOps: number;
  grammarOps: number;
  conversationOps: number;
  bulkWriteResults: { upserted: number; modified: number };
}

interface UpdateOneOp {
  updateOne: {
    filter: Record<string, unknown>;
    update: Record<string, unknown>;
    upsert: boolean;
  };
}

function buildVocabularyOps(progress: IUserProgress): UpdateOneOp[] {
  return progress.vocabularyStatus.map((v) => ({
    updateOne: {
      filter: {
        userId: progress.userId,
        targetLanguage: progress.targetLanguage,
        contentType: 'vocabulary',
        contentId: v.wordId,
      },
      update: {
        $setOnInsert: {
          userId: progress.userId,
          targetLanguage: progress.targetLanguage,
          contentType: 'vocabulary',
          contentId: v.wordId,
          status: 'active',
          createdAt: new Date(),
        },
        $set: {
          masteryState: v.status,
          correctCount: v.correctCount,
          wrongCount: v.wrongCount,
          lastStudiedAt: v.lastReviewedAt,
          lastResult: v.wrongCount > v.correctCount ? 'wrong' : v.correctCount > 0 ? 'correct' : null,
          nextReviewAt: v.nextReviewAt,
          attemptCount: v.correctCount + v.wrongCount,
          introducedByLessonId: v.introducedByLessonId ?? null,
          lastPracticedInLessonId: v.lastPracticedInLessonId ?? null,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
}

function buildGrammarOps(progress: IUserProgress): UpdateOneOp[] {
  return progress.grammarStatus.map((g) => ({
    updateOne: {
      filter: {
        userId: progress.userId,
        targetLanguage: progress.targetLanguage,
        contentType: 'grammar',
        contentId: g.grammarId,
      },
      update: {
        $setOnInsert: {
          userId: progress.userId,
          targetLanguage: progress.targetLanguage,
          contentType: 'grammar',
          contentId: g.grammarId,
          status: 'active',
          createdAt: new Date(),
        },
        $set: {
          masteryState: g.masteryState,
          correctCount: g.correctCount,
          wrongCount: g.wrongCount,
          lastStudiedAt: g.lastReviewedAt,
          lastResult: g.wrongCount > g.correctCount ? 'wrong' : g.correctCount > 0 ? 'correct' : null,
          nextReviewAt: g.nextReviewAt,
          attemptCount: g.correctCount + g.wrongCount,
          introducedByLessonId: g.introducedByLessonId ?? null,
          lastPracticedInLessonId: g.lastPracticedInLessonId ?? null,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
}

function buildConversationOps(progress: IUserProgress): UpdateOneOp[] {
  return progress.conversationStatus.map((c) => ({
    updateOne: {
      filter: {
        userId: progress.userId,
        targetLanguage: progress.targetLanguage,
        contentType: 'conversation',
        contentId: c.conversationId,
      },
      update: {
        $setOnInsert: {
          userId: progress.userId,
          targetLanguage: progress.targetLanguage,
          contentType: 'conversation',
          contentId: c.conversationId,
          status: 'active',
          createdAt: new Date(),
        },
        $set: {
          masteryState: c.masteryState,
          correctCount: c.correctCount,
          wrongCount: c.wrongCount,
          lastStudiedAt: c.lastReviewedAt,
          lastResult: c.wrongCount > c.correctCount ? 'wrong' : c.correctCount > 0 ? 'correct' : null,
          nextReviewAt: c.nextReviewAt,
          attemptCount: c.correctCount + c.wrongCount,
          introducedByLessonId: c.introducedByLessonId ?? null,
          lastPracticedInLessonId: c.lastPracticedInLessonId ?? null,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
}

async function executeBatch(
  batch: UpdateOneOp[],
  stats: MigrationStats,
): Promise<void> {
  if (batch.length === 0) return;
  const result = await UserItemProgress.collection.bulkWrite(batch, { ordered: false });
  stats.bulkWriteResults.upserted += result.upsertedCount;
  stats.bulkWriteResults.modified += result.modifiedCount;
}

export async function migrateToItemProgress(): Promise<MigrationStats> {
  const cursor = UserProgress.find().cursor();
  const stats: MigrationStats = {
    totalProgressDocs: 0,
    vocabularyOps: 0,
    grammarOps: 0,
    conversationOps: 0,
    bulkWriteResults: { upserted: 0, modified: 0 },
  };

  let batch: UpdateOneOp[] = [];
  const BATCH_SIZE = 500;

  for await (const progress of cursor) {
    stats.totalProgressDocs++;

    const vocabOps = buildVocabularyOps(progress);
    const grammarOps = buildGrammarOps(progress);
    const convOps = buildConversationOps(progress);

    stats.vocabularyOps += vocabOps.length;
    stats.grammarOps += grammarOps.length;
    stats.conversationOps += convOps.length;

    batch.push(...vocabOps, ...grammarOps, ...convOps);

    if (batch.length >= BATCH_SIZE) {
      await executeBatch(batch, stats);
      batch = [];
    }
  }

  await executeBatch(batch, stats);

  return stats;
}

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('\n🔄 UserProgress → UserItemProgress Migration');
  console.log(`   환경: ${config.nodeEnv}`);
  console.log(`   DB:   ${config.mongodb.uri}`);

  try {
    await connectDatabase();

    const stats = await migrateToItemProgress();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n  📊 Migration Results:');
    console.log(`     UserProgress docs processed: ${stats.totalProgressDocs}`);
    console.log(`     Vocabulary ops:              ${stats.vocabularyOps}`);
    console.log(`     Grammar ops:                 ${stats.grammarOps}`);
    console.log(`     Conversation ops:            ${stats.conversationOps}`);
    console.log(`     Upserted:                    ${stats.bulkWriteResults.upserted}`);
    console.log(`     Modified:                    ${stats.bulkWriteResults.modified}`);
    console.log(`\n  ⏱️  소요 시간: ${elapsed}초`);
    console.log('  ✅ Migration 완료\n');
  } catch (error) {
    console.error('  ❌ Migration 실패:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}
