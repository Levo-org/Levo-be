import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

import User from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import Lesson from '@/models/Lesson';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import CoinTransaction from '@/models/CoinTransaction';

let mongoServer: MongoMemoryServer;

/**
 * Connect to an in-memory MongoDB instance.
 * Call in beforeAll() of each test suite.
 */
export async function connectTestDb(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop all collections and close the connection.
 * Call in afterAll() of each test suite.
 */
export async function disconnectTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
}

/**
 * Clear all collections between tests.
 * Call in afterEach() for isolation.
 */
export async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export interface TestUser {
  user: InstanceType<typeof User>;
  token: string;
}

/**
 * Create a test user and return it with a valid JWT token.
 */
export async function createTestUser(overrides: Record<string, any> = {}): Promise<TestUser> {
  const user = await User.create({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    profileImage: '',
    provider: 'google',
    providerId: `google-${Date.now()}`,
    activeLanguage: 'en',
    isPremium: false,
    coins: 100,
    onboardingCompleted: true,
    ...overrides,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    config.jwt.secret,
    { expiresIn: '1h' },
  );

  return { user, token };
}

/**
 * Create a UserLanguageProfile for the given user.
 */
export async function createProfile(
  userId: mongoose.Types.ObjectId,
  targetLanguage = 'en',
  overrides: Record<string, any> = {},
) {
  return UserLanguageProfile.create({
    userId,
    targetLanguage,
    level: 'beginner',
    xp: 0,
    userLevel: 1,
    hearts: 5,
    vocabularyProgress: 0,
    grammarProgress: 0,
    conversationProgress: 0,
    listeningProgress: 0,
    readingProgress: 0,
    ...overrides,
  });
}

/**
 * Create a UserStreak for the given user.
 */
export async function createStreak(
  userId: mongoose.Types.ObjectId,
  targetLanguage = 'en',
  overrides: Record<string, any> = {},
) {
  return UserStreak.create({
    userId,
    targetLanguage,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    weeklyRecord: [],
    ...overrides,
  });
}

/**
 * Create a UserProgress record for the given user.
 */
export async function createProgress(
  userId: mongoose.Types.ObjectId,
  targetLanguage = 'en',
  overrides: Record<string, any> = {},
) {
  return UserProgress.create({
    userId,
    targetLanguage,
    completedLessons: [],
    currentLessonId: null,
    vocabularyStatus: [],
    grammarStatus: [],
    conversationStatus: [],
    wrongAnswers: [],
    ...overrides,
  });
}

/**
 * Create a Lesson.
 */
export async function createLesson(overrides: Record<string, any> = {}) {
  return Lesson.create({
    targetLanguage: 'en',
    unitNumber: 1,
    unitTitle: 'Unit 1',
    lessonNumber: 1,
    lessonTitle: 'Lesson 1',
    newWords: [],
    grammarPoints: [],
    quizzes: [],
    estimatedMinutes: 5,
    xpReward: 120,
    coinReward: 15,
    prerequisiteLessonId: null,
    order: 1,
    ...overrides,
  });
}

/**
 * Create a Vocabulary item.
 */
export async function createVocabulary(overrides: Record<string, any> = {}) {
  return Vocabulary.create({
    targetLanguage: 'en',
    word: 'apple',
    pronunciation: 'aepl',
    meaning: '사과',
    partOfSpeech: 'noun',
    level: 'beginner',
    chapter: 1,
    exampleSentence: 'I eat an apple.',
    exampleTranslation: '나는 사과를 먹는다.',
    audioUrl: '',
    order: 1,
    ...overrides,
  });
}

/**
 * Create a Grammar item.
 */
export async function createGrammar(overrides: Record<string, any> = {}) {
  return Grammar.create({
    targetLanguage: 'en',
    title: 'Present Simple',
    subtitle: '현재 시제',
    englishTitle: 'Present Simple',
    icon: '📝',
    level: 'beginner',
    order: 1,
    formula: 'S + V',
    formulaExample: 'I eat',
    explanation: 'Used for habitual actions.',
    examples: [
      {
        sentence: 'I eat breakfast every day.',
        translation: '나는 매일 아침을 먹는다.',
        highlight: 'eat',
      },
    ],
    quizzes: [
      {
        question: 'She ___ to school.',
        options: ['go', 'goes', 'going', 'gone'],
        correctAnswer: 1,
        explanation: 'Third person singular uses -es.',
      },
    ],
    ...overrides,
  });
}

/**
 * Create a Listening item.
 */
export async function createListening(overrides: Record<string, any> = {}) {
  return Listening.create({
    targetLanguage: 'en',
    audioText: 'I like apples.',
    correctAnswer: 'I like apples.',
    hint: 'fruit',
    difficulty: 'beginner',
    audioUrl: '',
    order: 1,
    ...overrides,
  });
}

/**
 * Create a Reading item.
 */
export async function createReading(overrides: Record<string, any> = {}) {
  return Reading.create({
    targetLanguage: 'en',
    title: 'A Short Story',
    difficulty: 'beginner',
    content: 'Once upon a time there was a cat.',
    wordCount: 8,
    quizzes: [
      {
        question: 'What animal was in the story?',
        options: ['dog', 'cat', 'bird', 'fish'],
        correctAnswer: 1,
        explanation: 'The story mentions a cat.',
      },
    ],
    order: 1,
    ...overrides,
  });
}

export async function createConversation(overrides: Record<string, any> = {}) {
  return Conversation.create({
    targetLanguage: 'en',
    title: 'Daily Talk',
    emoji: '💬',
    level: 'beginner',
    order: 1,
    dialogs: [
      {
        speaker: 'A',
        text: 'Hello!',
        translation: '안녕하세요!',
        isUserRole: true,
        audioUrl: '',
      },
    ],
    keyExpressions: [
      {
        expression: 'Hello',
        meaning: '안녕하세요',
      },
    ],
    ...overrides,
  });
}
