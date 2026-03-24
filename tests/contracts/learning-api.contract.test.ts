import request from 'supertest';
import app from '@/app';
import {
  clearCollections,
  connectTestDb,
  createConversation,
  createListening,
  createProfile,
  createReading,
  createTestUser,
  disconnectTestDb,
  TestUser,
} from '../setup';

describe('Reading/Listening/Conversation API contracts', () => {
  let user: TestUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
    user = await createTestUser({ activeLanguage: 'en' });
    await createProfile(user.user._id, 'en');
  });

  it('returns reading list/detail in FE-facing shape', async () => {
    const reading = await createReading({
      title: 'Reading Contract',
      content: 'This is reading text.',
      translation: '이것은 읽기 텍스트입니다.',
      quizzes: [
        {
          question: 'Pick the sentence.',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 2,
          explanation: 'C is correct',
        },
      ],
    });

    const listRes = await request(app)
      .get('/api/v1/reading')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.data[0]).toMatchObject({
      _id: reading._id.toString(),
      title: 'Reading Contract',
      text: 'This is reading text.',
      translation: '이것은 읽기 텍스트입니다.',
      difficulty: 'beginner',
    });
    expect(listRes.body.data[0].questions[0]).toHaveProperty('correctIndex', 2);

    const detailRes = await request(app)
      .get(`/api/v1/reading/${reading._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' });

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data).toHaveProperty('text');
    expect(detailRes.body.data).toHaveProperty('questions');
  });

  it('accepts selectedAnswer and answer alias for reading submit', async () => {
    const reading = await createReading({
      quizzes: [
        {
          question: 'Q',
          options: ['A', 'B', 'C'],
          correctAnswer: 1,
          explanation: 'B',
        },
      ],
    });

    const selectedRes = await request(app)
      .post(`/api/v1/reading/${reading._id}/quiz/answer`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' })
      .send({ quizIndex: 0, selectedAnswer: 1 });
    expect(selectedRes.status).toBe(200);
    expect(selectedRes.body.data.correct).toBe(true);

    const aliasRes = await request(app)
      .post(`/api/v1/reading/${reading._id}/quiz/answer`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' })
      .send({ quizIndex: 0, answer: 0 });
    expect(aliasRes.status).toBe(200);
    expect(aliasRes.body.data.correct).toBe(false);
  });

  it('returns listening list and answer payload in FE-facing shape', async () => {
    await createListening({ audioText: 'I like apples.', correctAnswer: 'I like apples.', difficulty: 'beginner' });
    await createListening({ audioText: 'I drink water.', correctAnswer: 'I drink water.', difficulty: 'beginner' });
    await createListening({ audioText: 'I play soccer.', correctAnswer: 'I play soccer.', difficulty: 'beginner' });
    const target = await createListening({ audioText: 'I read books.', correctAnswer: 'I read books.', difficulty: 'beginner' });

    const listRes = await request(app)
      .get('/api/v1/listening')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' });

    expect(listRes.status).toBe(200);
    const first = listRes.body.data[0];
    expect(first).toHaveProperty('question', 'Choose what you heard.');
    expect(first).toHaveProperty('ttsText');
    expect(first).toHaveProperty('audioUrl', null);
    expect(Array.isArray(first.options)).toBe(true);

    const answerRes = await request(app)
      .post(`/api/v1/listening/${target._id}/answer`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' })
      .send({ answer: 'I read books.' });

    expect(answerRes.status).toBe(200);
    expect(answerRes.body.data).toHaveProperty('correct', true);
    expect(answerRes.body.data).toHaveProperty('xpEarned');
    expect(answerRes.body.data).toHaveProperty('heartsRemaining');
  });

  it('returns conversation detail as top-level payload with compatibility aliases', async () => {
    const conversation = await createConversation({
      title: 'Cafe',
      dialogs: [
        {
          speaker: 'A',
          text: 'Hello',
          translation: '안녕',
          isUserRole: true,
          audioUrl: '',
        },
      ],
    });

    const detailRes = await request(app)
      .get(`/api/v1/conversations/${conversation._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' });

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data).toHaveProperty('dialogs');
    expect(detailRes.body.data).toHaveProperty('dialog');
    expect(detailRes.body.data.dialogs[0]).toHaveProperty('isUserRole', true);
    expect(detailRes.body.data.dialogs[0]).toHaveProperty('isUser', true);

    const practiceRes = await request(app)
      .post(`/api/v1/conversations/${conversation._id}/practice`)
      .set('Authorization', `Bearer ${user.token}`)
      .query({ targetLanguage: 'en' })
      .send({ dialogIndex: 0, pronunciationScore: 82 });

    expect(practiceRes.status).toBe(200);
    expect(practiceRes.body.data).toHaveProperty('conversationId', conversation._id.toString());
  });
});
