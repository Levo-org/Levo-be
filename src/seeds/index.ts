/**
 * 시드 데이터 실행 스크립트
 *
 * 사용법:
 *   npm run seed          — 기존 데이터를 유지하고 시드 데이터 삽입
 *   npm run seed:clean    — 기존 데이터를 모두 삭제 후 시드 데이터 삽입
 */
import mongoose from 'mongoose';
import { config } from '@/config';
import { connectDatabase } from '@/config/database';

// Models
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import Lesson from '@/models/Lesson';
import Badge from '@/models/Badge';

// Seed data – Vocabulary
import { englishVocabulary } from './data/vocabulary.en';
import { japaneseVocabulary } from './data/vocabulary.ja';
import { chineseVocabulary } from './data/vocabulary.zh';

// Seed data – Grammar
import { englishGrammar } from './data/grammar.en';
import { japaneseGrammar } from './data/grammar.ja';
import { chineseGrammar } from './data/grammar.zh';

// Seed data – Conversation
import { englishConversations } from './data/conversation.en';
import { japaneseConversations } from './data/conversation.ja';
import { chineseConversations } from './data/conversation.zh';

// Seed data – Listening
import { listeningEnData } from './data/listening.en';
import { listeningJaData } from './data/listening.ja';
import { listeningZhData } from './data/listening.zh';

// Seed data – Reading
import { readingEnData } from './data/reading.en';
import { readingJaData } from './data/reading.ja';
import { readingZhData } from './data/reading.zh';

// Seed data – Lessons
import { lessonsEnData } from './data/lessons.en';
import { lessonsJaData } from './data/lessons.ja';
import { lessonsZhData } from './data/lessons.zh';

// Seed data – Badges
import { badgesData } from './data/badges';

// ─── Helpers ──────────────────────────────────────────
const addTargetLanguage = <T extends Record<string, unknown>>(items: T[], lang: string) =>
  items.map((item) => ({ ...item, targetLanguage: lang }));

const addPublishedEditorialMetadata = <T extends Record<string, unknown>>(items: T[]) =>
  items.map((item) => ({
    ...item,
    status: 'published' as const,
    sourceType: 'seed_import' as const,
    publishedAt: new Date(),
  }));

const log = {
  section: (title: string) => console.log(`\n${'═'.repeat(50)}\n  ${title}\n${'═'.repeat(50)}`),
  success: (msg: string) => console.log(`  ✅ ${msg}`),
  clean: (msg: string) => console.log(`  🗑️  ${msg}`),
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
  error: (msg: string) => console.error(`  ❌ ${msg}`),
};

// ─── Clean collections ────────────────────────────────
async function cleanCollections(): Promise<void> {
  log.section('🧹 기존 데이터 삭제');

  const collections: Array<{ model: mongoose.Model<any>; name: string }> = [
    { model: Vocabulary, name: 'Vocabulary' },
    { model: Grammar, name: 'Grammar' },
    { model: Conversation, name: 'Conversation' },
    { model: Listening, name: 'Listening' },
    { model: Reading, name: 'Reading' },
    { model: Lesson, name: 'Lesson' },
    { model: Badge, name: 'Badge' },
  ];

  for (const { model, name } of collections) {
    const result = await model.deleteMany({});
    log.clean(`${name}: ${result.deletedCount}개 삭제`);
  }
}

// ─── Seed Vocabulary ──────────────────────────────────
async function seedVocabulary(): Promise<void> {
  log.section('📖 Vocabulary 시드 데이터');

  const enData = addPublishedEditorialMetadata(addTargetLanguage(englishVocabulary, 'en'));
  const jaData = addPublishedEditorialMetadata(addTargetLanguage(japaneseVocabulary, 'ja'));
  const zhData = addPublishedEditorialMetadata(addTargetLanguage(chineseVocabulary, 'zh'));

  const enResult = await Vocabulary.insertMany(enData);
  log.success(`영어 단어: ${enResult.length}개`);

  const jaResult = await Vocabulary.insertMany(jaData);
  log.success(`일본어 단어: ${jaResult.length}개`);

  const zhResult = await Vocabulary.insertMany(zhData);
  log.success(`중국어 단어: ${zhResult.length}개`);
}

// ─── Seed Grammar ─────────────────────────────────────
async function seedGrammar(): Promise<void> {
  log.section('📝 Grammar 시드 데이터');

  const enData = addPublishedEditorialMetadata(addTargetLanguage(englishGrammar, 'en'));
  const jaData = addPublishedEditorialMetadata(addTargetLanguage(japaneseGrammar, 'ja'));
  const zhData = addPublishedEditorialMetadata(addTargetLanguage(chineseGrammar, 'zh'));

  const enResult = await Grammar.insertMany(enData);
  log.success(`영어 문법: ${enResult.length}개`);

  const jaResult = await Grammar.insertMany(jaData);
  log.success(`일본어 문법: ${jaResult.length}개`);

  const zhResult = await Grammar.insertMany(zhData);
  log.success(`중국어 문법: ${zhResult.length}개`);
}

// ─── Seed Conversation ────────────────────────────────
async function seedConversation(): Promise<void> {
  log.section('💬 Conversation 시드 데이터');

  const enData = addPublishedEditorialMetadata(addTargetLanguage(englishConversations, 'en'));
  const jaData = addPublishedEditorialMetadata(addTargetLanguage(japaneseConversations, 'ja'));
  const zhData = addPublishedEditorialMetadata(addTargetLanguage(chineseConversations, 'zh'));

  const enResult = await Conversation.insertMany(enData);
  log.success(`영어 회화: ${enResult.length}개`);

  const jaResult = await Conversation.insertMany(jaData);
  log.success(`일본어 회화: ${jaResult.length}개`);

  const zhResult = await Conversation.insertMany(zhData);
  log.success(`중국어 회화: ${zhResult.length}개`);
}

// ─── Seed Listening ───────────────────────────────────
async function seedListening(): Promise<void> {
  log.section('🎧 Listening 시드 데이터');

  const enData = addPublishedEditorialMetadata(addTargetLanguage(listeningEnData, 'en'));
  const jaData = addPublishedEditorialMetadata(addTargetLanguage(listeningJaData, 'ja'));
  const zhData = addPublishedEditorialMetadata(addTargetLanguage(listeningZhData, 'zh'));

  const enResult = await Listening.insertMany(enData);
  log.success(`영어 듣기: ${enResult.length}개`);

  const jaResult = await Listening.insertMany(jaData);
  log.success(`일본어 듣기: ${jaResult.length}개`);

  const zhResult = await Listening.insertMany(zhData);
  log.success(`중국어 듣기: ${zhResult.length}개`);
}

// ─── Seed Reading ─────────────────────────────────────
async function seedReading(): Promise<void> {
  log.section('📰 Reading 시드 데이터');

  const enData = addPublishedEditorialMetadata(addTargetLanguage(readingEnData, 'en'));
  const jaData = addPublishedEditorialMetadata(addTargetLanguage(readingJaData, 'ja'));
  const zhData = addPublishedEditorialMetadata(addTargetLanguage(readingZhData, 'zh'));

  const enResult = await Reading.insertMany(enData);
  log.success(`영어 읽기: ${enResult.length}개`);

  const jaResult = await Reading.insertMany(jaData);
  log.success(`일본어 읽기: ${jaResult.length}개`);

  const zhResult = await Reading.insertMany(zhData);
  log.success(`중국어 읽기: ${zhResult.length}개`);
}

// ─── Seed Lessons ─────────────────────────────────────
async function seedLessons(): Promise<void> {
  log.section('📚 Lesson 시드 데이터');

  const enData = addTargetLanguage(lessonsEnData, 'en');
  const jaData = addTargetLanguage(lessonsJaData, 'ja');
  const zhData = addTargetLanguage(lessonsZhData, 'zh');

  const enResult = await Lesson.insertMany(enData);
  log.success(`영어 레슨: ${enResult.length}개`);

  const jaResult = await Lesson.insertMany(jaData);
  log.success(`일본어 레슨: ${jaResult.length}개`);

  const zhResult = await Lesson.insertMany(zhData);
  log.success(`중국어 레슨: ${zhResult.length}개`);
}

// ─── Seed Badges ──────────────────────────────────────
async function seedBadges(): Promise<void> {
  log.section('🏅 Badge 시드 데이터');

  const result = await Badge.insertMany(badgesData);
  log.success(`뱃지: ${result.length}개`);
}

// ─── Main ─────────────────────────────────────────────
async function main(): Promise<void> {
  const isClean = process.argv.includes('--clean');
  const startTime = Date.now();

  console.log('\n🌱 Levo 시드 데이터 실행');
  console.log(`   모드: ${isClean ? '🧹 Clean + Seed' : '➕ Seed Only'}`);
  console.log(`   환경: ${config.nodeEnv}`);
  console.log(`   DB:   ${config.mongodb.uri}`);

  try {
    // 1. DB 연결
    await connectDatabase();

    // 2. Clean (옵션)
    if (isClean) {
      await cleanCollections();
    }

    // 3. 시드 데이터 삽입
    await seedVocabulary();
    await seedGrammar();
    await seedConversation();
    await seedListening();
    await seedReading();
    await seedLessons();
    await seedBadges();

    // 4. 요약
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.section('🎉 시드 데이터 삽입 완료!');

    const counts = {
      vocabulary: await Vocabulary.countDocuments(),
      grammar: await Grammar.countDocuments(),
      conversation: await Conversation.countDocuments(),
      listening: await Listening.countDocuments(),
      reading: await Reading.countDocuments(),
      lesson: await Lesson.countDocuments(),
      badge: await Badge.countDocuments(),
    };

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    console.log('\n  📊 컬렉션별 문서 수:');
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`     ${name.padEnd(15)} ${count}개`);
    });
    console.log(`     ${'─'.repeat(25)}`);
    console.log(`     ${'TOTAL'.padEnd(15)} ${total}개`);
    console.log(`\n  ⏱️  소요 시간: ${elapsed}초\n`);
  } catch (error) {
    log.error('시드 데이터 삽입 실패');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('  👋 MongoDB 연결 해제\n');
  }
}

main();
