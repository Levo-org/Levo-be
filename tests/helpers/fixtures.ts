import mongoose from 'mongoose';

// ─── Users ──────────────────────────────────────────

export interface UserFixture {
  email: string;
  name: string;
  profileImage: string;
  provider: 'google' | 'apple' | 'email';
  providerId: string;
  activeLanguage: string;
  isPremium: boolean;
  coins: number;
  onboardingCompleted: boolean;
}

let userCounter = 0;

export function buildUser(overrides: Partial<UserFixture> = {}): UserFixture {
  userCounter += 1;
  return {
    email: `user-${userCounter}-${Date.now()}@test.com`,
    name: `Test User ${userCounter}`,
    profileImage: '',
    provider: 'google',
    providerId: `google-${userCounter}-${Date.now()}`,
    activeLanguage: 'en',
    isPremium: false,
    coins: 100,
    onboardingCompleted: true,
    ...overrides,
  };
}

export function buildPremiumUser(overrides: Partial<UserFixture> = {}): UserFixture {
  return buildUser({
    isPremium: true,
    coins: 500,
    ...overrides,
  });
}

// ─── Language Profile ───────────────────────────────

export interface LanguageProfileFixture {
  userId: mongoose.Types.ObjectId;
  targetLanguage: string;
  level: string;
  xp: number;
  userLevel: number;
  hearts: number;
  vocabularyProgress: number;
  grammarProgress: number;
  conversationProgress: number;
  listeningProgress: number;
  readingProgress: number;
}

export function buildLanguageProfile(
  userId: mongoose.Types.ObjectId,
  overrides: Partial<Omit<LanguageProfileFixture, 'userId'>> = {},
): LanguageProfileFixture {
  return {
    userId,
    targetLanguage: 'en',
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
  };
}

// ─── Vocabulary ─────────────────────────────────────

export interface VocabularyFixture {
  targetLanguage: string;
  word: string;
  pronunciation: string;
  meaning: string;
  partOfSpeech: string;
  level: string;
  chapter: number;
  exampleSentence: string;
  exampleTranslation: string;
  audioUrl: string;
  order: number;
}

let vocabCounter = 0;

export function buildVocabulary(overrides: Partial<VocabularyFixture> = {}): VocabularyFixture {
  vocabCounter += 1;
  return {
    targetLanguage: 'en',
    word: `word-${vocabCounter}`,
    pronunciation: `wɜːrd-${vocabCounter}`,
    meaning: `단어-${vocabCounter}`,
    partOfSpeech: 'noun',
    level: 'beginner',
    chapter: 1,
    exampleSentence: `This is word-${vocabCounter}.`,
    exampleTranslation: `이것은 단어-${vocabCounter}입니다.`,
    audioUrl: '',
    order: vocabCounter,
    ...overrides,
  };
}

// ─── Lesson ─────────────────────────────────────────

export interface LessonFixture {
  targetLanguage: string;
  unitNumber: number;
  unitTitle: string;
  lessonNumber: number;
  lessonTitle: string;
  newWords: string[];
  grammarPoints: string[];
  quizzes: unknown[];
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  prerequisiteLessonId: mongoose.Types.ObjectId | null;
  order: number;
}

let lessonCounter = 0;

export function buildLesson(overrides: Partial<LessonFixture> = {}): LessonFixture {
  lessonCounter += 1;
  return {
    targetLanguage: 'en',
    unitNumber: 1,
    unitTitle: `Unit ${lessonCounter}`,
    lessonNumber: lessonCounter,
    lessonTitle: `Lesson ${lessonCounter}`,
    newWords: [],
    grammarPoints: [],
    quizzes: [],
    estimatedMinutes: 5,
    xpReward: 120,
    coinReward: 15,
    prerequisiteLessonId: null,
    order: lessonCounter,
    ...overrides,
  };
}
