import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';

interface MeaningExample {
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

function buildMeaningExamples(word: string, meanings: string[], baseSentence: string, baseTranslation: string): MeaningExample[] {
  return meanings.map((meaning, index) => {
    if (index === 0) {
      return {
        meaning,
        exampleSentence: baseSentence || `I used the word "${word}" in a sentence.`,
        exampleTranslation: baseTranslation || `"${word}"를 문장에서 사용했어요.`,
      };
    }

    return {
      meaning,
      exampleSentence: `In another context, "${word}" can mean "${meaning}".`,
      exampleTranslation: `다른 문맥에서 "${word}"는 "${meaning}"라는 뜻으로도 쓰여요.`,
    };
  });
}

async function migrate(): Promise<void> {
  console.log('\n🔄 meaningExamples 마이그레이션 시작...');
  await connectDatabase();

  const candidates = await Vocabulary.find({
    targetLanguage: 'en',
    meanings: { $exists: true, $not: { $size: 0 } },
    $or: [
      { meaningExamples: { $exists: false } },
      { meaningExamples: { $size: 0 } },
    ],
  });

  let updatedCount = 0;

  for (const vocab of candidates) {
    const meanings = Array.isArray(vocab.meanings)
      ? vocab.meanings.filter((meaning): meaning is string => typeof meaning === 'string' && meaning.trim().length > 0)
      : [];

    if (meanings.length === 0) {
      continue;
    }

    const meaningExamples = buildMeaningExamples(
      vocab.word,
      meanings,
      vocab.exampleSentence,
      vocab.exampleTranslation,
    );

    vocab.meaningExamples = meaningExamples;
    await vocab.save();
    updatedCount += 1;
    console.log(`  ✅ ${vocab.word} (${meaningExamples.length}개 예문)`);
  }

  console.log('\n📊 결과:');
  console.log(`   업데이트: ${updatedCount}개 문서`);

  await mongoose.disconnect();
  console.log('  👋 MongoDB 연결 해제\n');
}

migrate().catch((err) => {
  console.error('❌ 마이그레이션 실패:', err);
  process.exit(1);
});
