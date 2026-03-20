import mongoose from 'mongoose';
import {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  createTestUser,
  createVocabulary,
  createGrammar,
  createListening,
  createReading,
  createConversation,
  createProfile,
  TestUser,
} from './setup';
import WrongAnswerEntry from '@/models/WrongAnswerEntry';
import {
  recordWrongAnswer,
  getDueRemediation,
  markRemediated,
} from '@/services/remediation.service';
import { WRONG_ANSWER_MAX_ENTRIES } from '@/utils/constants';

let testUser: TestUser;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearCollections();
  testUser = await createTestUser();
});

describe('WrongAnswerEntry model', () => {
  it('enforces unique compound index on (userId, targetLanguage, contentType, contentId)', async () => {
    // Ensure indexes are synced in the in-memory MongoDB instance
    await WrongAnswerEntry.ensureIndexes();

    const contentId = new mongoose.Types.ObjectId();
    await WrongAnswerEntry.create({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId,
      question: 'apple',
      correctAnswer: '사과',
      lastUserAnswer: '바나나',
      wrongCount: 1,
      lastWrongAt: new Date(),
    });

    await expect(
      WrongAnswerEntry.create({
        userId: testUser.user._id,
        targetLanguage: 'en',
        contentType: 'vocabulary',
        contentId,
        question: 'apple',
        correctAnswer: '사과',
        lastUserAnswer: '오렌지',
        wrongCount: 1,
        lastWrongAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});

describe('recordWrongAnswer', () => {
  it('creates a new entry on first wrong answer', async () => {
    const vocab = await createVocabulary();
    const entry = await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId: vocab._id,
      question: vocab.word,
      correctAnswer: vocab.meaning,
      userAnswer: 'wrong',
    });

    expect(entry.wrongCount).toBe(1);
    expect(entry.remediationStatus).toBe('pending');
    expect(entry.remediatedAt).toBeNull();
    expect(entry.contentType).toBe('vocabulary');
  });

  it('deduplicates: same contentId+type increments wrongCount instead of creating duplicate', async () => {
    const vocab = await createVocabulary();
    const input = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'vocabulary' as const,
      contentId: vocab._id,
      question: vocab.word,
      correctAnswer: vocab.meaning,
      userAnswer: 'wrong1',
    };

    await recordWrongAnswer(input);
    const second = await recordWrongAnswer({ ...input, userAnswer: 'wrong2' });

    expect(second.wrongCount).toBe(2);
    expect(second.lastUserAnswer).toBe('wrong2');

    const count = await WrongAnswerEntry.countDocuments({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId: vocab._id,
    });
    expect(count).toBe(1);
  });

  it('resets remediationStatus to pending when wrong again after resolved', async () => {
    const vocab = await createVocabulary();
    const input = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'vocabulary' as const,
      contentId: vocab._id,
      question: vocab.word,
      correctAnswer: vocab.meaning,
      userAnswer: 'wrong',
    };

    await recordWrongAnswer(input);
    await markRemediated(testUser.user._id, 'en', vocab._id, 'vocabulary');

    const resolved = await WrongAnswerEntry.findOne({
      userId: testUser.user._id,
      contentId: vocab._id,
    });
    expect(resolved!.remediationStatus).toBe('resolved');

    const afterWrongAgain = await recordWrongAnswer(input);
    expect(afterWrongAgain.remediationStatus).toBe('pending');
    expect(afterWrongAgain.wrongCount).toBe(2);
  });
});

describe('getDueRemediation', () => {
  it('returns entries sorted by wrongCount DESC then lastWrongAt ASC', async () => {
    const vocab1 = await createVocabulary({ word: 'a1', order: 1 });
    const vocab2 = await createVocabulary({ word: 'a2', order: 2 });
    const vocab3 = await createVocabulary({ word: 'a3', order: 3 });

    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'vocabulary' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    await recordWrongAnswer({ ...base, contentId: vocab1._id, question: 'a1' });

    await recordWrongAnswer({ ...base, contentId: vocab2._id, question: 'a2' });
    await recordWrongAnswer({ ...base, contentId: vocab2._id, question: 'a2' });
    await recordWrongAnswer({ ...base, contentId: vocab2._id, question: 'a2' });

    await recordWrongAnswer({ ...base, contentId: vocab3._id, question: 'a3' });
    await recordWrongAnswer({ ...base, contentId: vocab3._id, question: 'a3' });

    const results = await getDueRemediation(testUser.user._id, 'en');

    expect(results).toHaveLength(3);
    expect(results[0].contentId.toString()).toBe(vocab2._id.toString());
    expect(results[0].wrongCount).toBe(3);
    expect(results[1].contentId.toString()).toBe(vocab3._id.toString());
    expect(results[1].wrongCount).toBe(2);
    expect(results[2].contentId.toString()).toBe(vocab1._id.toString());
    expect(results[2].wrongCount).toBe(1);
  });

  it('excludes resolved entries', async () => {
    const vocab = await createVocabulary();
    await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId: vocab._id,
      question: vocab.word,
      correctAnswer: vocab.meaning,
      userAnswer: 'wrong',
    });

    await markRemediated(testUser.user._id, 'en', vocab._id, 'vocabulary');

    const results = await getDueRemediation(testUser.user._id, 'en');
    expect(results).toHaveLength(0);
  });

  it('respects limit parameter', async () => {
    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'vocabulary' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    for (let i = 0; i < 5; i++) {
      const vocab = await createVocabulary({ word: `w${i}`, order: i + 10 });
      await recordWrongAnswer({ ...base, contentId: vocab._id, question: `w${i}` });
    }

    const results = await getDueRemediation(testUser.user._id, 'en', 3);
    expect(results).toHaveLength(3);
  });
});

describe('markRemediated', () => {
  it('sets remediationStatus to resolved and records remediatedAt', async () => {
    const vocab = await createVocabulary();
    await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'vocabulary',
      contentId: vocab._id,
      question: vocab.word,
      correctAnswer: vocab.meaning,
      userAnswer: 'wrong',
    });

    const before = new Date();
    const result = await markRemediated(testUser.user._id, 'en', vocab._id, 'vocabulary');

    expect(result).not.toBeNull();
    expect(result!.remediationStatus).toBe('resolved');
    expect(result!.remediatedAt).not.toBeNull();
    expect(result!.remediatedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('returns null for non-existent entry', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const result = await markRemediated(testUser.user._id, 'en', fakeId, 'vocabulary');
    expect(result).toBeNull();
  });
});

describe('enforceEntryCap', () => {
  it('evicts lowest-wrongCount entries when cap exceeded', async () => {
    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'vocabulary' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    const entries: mongoose.Types.ObjectId[] = [];
    for (let i = 0; i < WRONG_ANSWER_MAX_ENTRIES + 5; i++) {
      const vocab = await createVocabulary({ word: `cap${i}`, order: i + 100 });
      entries.push(vocab._id);
      await recordWrongAnswer({ ...base, contentId: vocab._id, question: `cap${i}` });
    }

    const count = await WrongAnswerEntry.countDocuments({
      userId: testUser.user._id,
      targetLanguage: 'en',
    });
    expect(count).toBe(WRONG_ANSWER_MAX_ENTRIES);
  }, 60000);
});

describe('recordWrongAnswer — multi content-type support', () => {
  it('records grammar wrong answers with contentType=grammar', async () => {
    const grammar = await createGrammar();
    const entry = await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'grammar',
      contentId: grammar._id,
      question: grammar.title,
      correctAnswer: grammar.formula,
      userAnswer: 'wrong grammar',
    });

    expect(entry.contentType).toBe('grammar');
    expect(entry.wrongCount).toBe(1);
    expect(entry.question).toBe('Present Simple');
    expect(entry.remediationStatus).toBe('pending');
  });

  it('records listening wrong answers with contentType=listening', async () => {
    const listening = await createListening();
    const entry = await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'listening',
      contentId: listening._id,
      question: listening.audioText,
      correctAnswer: listening.correctAnswer,
      userAnswer: 'wrong transcript',
    });

    expect(entry.contentType).toBe('listening');
    expect(entry.wrongCount).toBe(1);
    expect(entry.question).toBe('I like apples.');
  });

  it('records reading wrong answers with contentType=reading', async () => {
    const reading = await createReading();
    const entry = await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'reading',
      contentId: reading._id,
      question: 'What animal was in the story?',
      correctAnswer: '1',
      userAnswer: '0',
    });

    expect(entry.contentType).toBe('reading');
    expect(entry.wrongCount).toBe(1);
    expect(entry.question).toBe('What animal was in the story?');
  });

  it('deduplicates across same content type (grammar)', async () => {
    const grammar = await createGrammar();
    const input = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'grammar' as const,
      contentId: grammar._id,
      question: grammar.title,
      correctAnswer: grammar.formula,
      userAnswer: 'wrong1',
    };

    await recordWrongAnswer(input);
    const second = await recordWrongAnswer({ ...input, userAnswer: 'wrong2' });

    expect(second.wrongCount).toBe(2);
    expect(second.lastUserAnswer).toBe('wrong2');

    const count = await WrongAnswerEntry.countDocuments({
      userId: testUser.user._id,
      contentType: 'grammar',
      contentId: grammar._id,
    });
    expect(count).toBe(1);
  });
});

describe('getDueRemediation — cross content-type priority', () => {
  it('returns mixed content types sorted by wrongCount DESC', async () => {
    const vocab = await createVocabulary();
    const grammar = await createGrammar();
    const listening = await createListening();

    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    // vocab: 1 wrong
    await recordWrongAnswer({ ...base, contentType: 'vocabulary', contentId: vocab._id, question: 'apple' });

    // grammar: 3 wrongs
    await recordWrongAnswer({ ...base, contentType: 'grammar', contentId: grammar._id, question: 'tense' });
    await recordWrongAnswer({ ...base, contentType: 'grammar', contentId: grammar._id, question: 'tense' });
    await recordWrongAnswer({ ...base, contentType: 'grammar', contentId: grammar._id, question: 'tense' });

    // listening: 2 wrongs
    await recordWrongAnswer({ ...base, contentType: 'listening', contentId: listening._id, question: 'audio' });
    await recordWrongAnswer({ ...base, contentType: 'listening', contentId: listening._id, question: 'audio' });

    const results = await getDueRemediation(testUser.user._id, 'en');

    expect(results).toHaveLength(3);
    expect(results[0].contentType).toBe('grammar');
    expect(results[0].wrongCount).toBe(3);
    expect(results[1].contentType).toBe('listening');
    expect(results[1].wrongCount).toBe(2);
    expect(results[2].contentType).toBe('vocabulary');
    expect(results[2].wrongCount).toBe(1);
  });

  it('excludes resolved entries from mixed content types', async () => {
    const vocab = await createVocabulary();
    const grammar = await createGrammar();

    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    await recordWrongAnswer({ ...base, contentType: 'vocabulary', contentId: vocab._id, question: 'apple' });
    await recordWrongAnswer({ ...base, contentType: 'grammar', contentId: grammar._id, question: 'tense' });

    await markRemediated(testUser.user._id, 'en', vocab._id, 'vocabulary');

    const results = await getDueRemediation(testUser.user._id, 'en');
    expect(results).toHaveLength(1);
    expect(results[0].contentType).toBe('grammar');
  });
});

describe('stats — WrongAnswerEntry canonical count', () => {
  it('counts only pending and in_progress entries', async () => {
    const vocab1 = await createVocabulary({ word: 's1', order: 50 });
    const vocab2 = await createVocabulary({ word: 's2', order: 51 });
    const grammar = await createGrammar({ title: 'Past Simple', order: 52 });

    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      correctAnswer: 'ans',
      userAnswer: 'wrong',
    };

    await recordWrongAnswer({ ...base, contentType: 'vocabulary', contentId: vocab1._id, question: 's1' });
    await recordWrongAnswer({ ...base, contentType: 'vocabulary', contentId: vocab2._id, question: 's2' });
    await recordWrongAnswer({ ...base, contentType: 'grammar', contentId: grammar._id, question: 'Past Simple' });

    // Resolve one
    await markRemediated(testUser.user._id, 'en', vocab1._id, 'vocabulary');

    // Query canonical count the same way stats.controller does
    const wrongAnswerCount = await WrongAnswerEntry.countDocuments({
      userId: testUser.user._id,
      targetLanguage: 'en',
      remediationStatus: { $in: ['pending', 'in_progress'] },
    });

    expect(wrongAnswerCount).toBe(2);
  });
});

describe('recordWrongAnswer — conversation content type', () => {
  it('records conversation wrong answer with contentType=conversation', async () => {
    const conversation = await createConversation();
    const entry = await recordWrongAnswer({
      userId: testUser.user._id,
      targetLanguage: 'en',
      contentType: 'conversation',
      contentId: conversation._id,
      question: conversation.title,
      correctAnswer: '',
      userAnswer: '',
    });

    expect(entry.contentType).toBe('conversation');
    expect(entry.wrongCount).toBe(1);
    expect(entry.question).toBe('Daily Talk');
    expect(entry.remediationStatus).toBe('pending');
  });

  it('deduplicates conversation wrong answers on same contentId', async () => {
    const conversation = await createConversation();
    const input = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      contentType: 'conversation' as const,
      contentId: conversation._id,
      question: conversation.title,
      correctAnswer: '',
      userAnswer: '',
    };

    await recordWrongAnswer(input);
    const second = await recordWrongAnswer(input);

    expect(second.wrongCount).toBe(2);

    const count = await WrongAnswerEntry.countDocuments({
      userId: testUser.user._id,
      contentType: 'conversation',
      contentId: conversation._id,
    });
    expect(count).toBe(1);
  });

  it('includes conversation in mixed-type remediation results', async () => {
    const vocab = await createVocabulary();
    const conversation = await createConversation();

    const base = {
      userId: testUser.user._id,
      targetLanguage: 'en' as const,
      correctAnswer: '',
      userAnswer: '',
    };

    await recordWrongAnswer({ ...base, contentType: 'vocabulary', contentId: vocab._id, question: 'apple' });
    await recordWrongAnswer({ ...base, contentType: 'conversation', contentId: conversation._id, question: 'Daily Talk' });
    await recordWrongAnswer({ ...base, contentType: 'conversation', contentId: conversation._id, question: 'Daily Talk' });

    const results = await getDueRemediation(testUser.user._id, 'en');

    expect(results).toHaveLength(2);
    expect(results[0].contentType).toBe('conversation');
    expect(results[0].wrongCount).toBe(2);
    expect(results[1].contentType).toBe('vocabulary');
    expect(results[1].wrongCount).toBe(1);
  });
});

describe('conversation controller — wrong answer dual-write integration', () => {
  it('creates WrongAnswerEntry when conversation practice is wrong (existing entry)', async () => {
    const conversation = await createConversation();
    await createProfile(testUser.user._id);
    const UserProgress = (await import('@/models/UserProgress')).default;

    const progress = await UserProgress.create({
      userId: testUser.user._id,
      targetLanguage: 'en',
      conversationStatus: [
        {
          conversationId: conversation._id,
          completed: true,
          pronunciationScore: 80,
          lastReviewedAt: new Date(),
          masteryState: 'learning',
          correctCount: 1,
          wrongCount: 0,
          nextReviewAt: new Date(),
        },
      ],
    });

    const request = (await import('supertest')).default;
    const app = (await import('@/app')).default;

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation._id}/practice?targetLanguage=en`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        conversationId: conversation._id.toString(),
        pronunciationScore: 50,
        correct: false,
      });

    expect(res.status).toBe(200);

    const entry = await WrongAnswerEntry.findOne({
      userId: testUser.user._id,
      contentType: 'conversation',
      contentId: conversation._id,
    });

    expect(entry).not.toBeNull();
    expect(entry!.wrongCount).toBe(1);
    expect(entry!.remediationStatus).toBe('pending');
  });

  it('creates WrongAnswerEntry when conversation practice is wrong (new entry)', async () => {
    const conversation = await createConversation({ title: 'New Convo', order: 2 });
    await createProfile(testUser.user._id);

    const request = (await import('supertest')).default;
    const app = (await import('@/app')).default;

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation._id}/practice?targetLanguage=en`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        conversationId: conversation._id.toString(),
        pronunciationScore: 30,
        correct: false,
      });

    expect(res.status).toBe(200);

    const entry = await WrongAnswerEntry.findOne({
      userId: testUser.user._id,
      contentType: 'conversation',
      contentId: conversation._id,
    });

    expect(entry).not.toBeNull();
    expect(entry!.wrongCount).toBe(1);
    expect(entry!.question).toBe('New Convo');
  });

  it('does NOT create WrongAnswerEntry when conversation practice is correct', async () => {
    const conversation = await createConversation({ title: 'Correct Convo', order: 3 });
    await createProfile(testUser.user._id);

    const request = (await import('supertest')).default;
    const app = (await import('@/app')).default;

    const res = await request(app)
      .post(`/api/v1/conversations/${conversation._id}/practice?targetLanguage=en`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        conversationId: conversation._id.toString(),
        pronunciationScore: 95,
        correct: true,
      });

    expect(res.status).toBe(200);

    const entry = await WrongAnswerEntry.findOne({
      userId: testUser.user._id,
      contentType: 'conversation',
      contentId: conversation._id,
    });

    expect(entry).toBeNull();
  });
});
