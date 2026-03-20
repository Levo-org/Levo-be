export interface VocabularyStatusSnapshot {
  status: 'new' | 'learning' | 'completed' | 'wrong';
}

export interface GrammarStatusSnapshot {
  progress: number;
}

export interface ConversationStatusSnapshot {
  completed: boolean;
}

export interface LearningProgressSnapshot {
  completedLessons?: unknown[];
  vocabularyStatus?: VocabularyStatusSnapshot[];
  grammarStatus?: GrammarStatusSnapshot[];
  conversationStatus?: ConversationStatusSnapshot[];
  wrongAnswers?: unknown[];
}

export interface VocabularyStats {
  total: number;
  completed: number;
  learning: number;
}

export interface GrammarStats {
  total: number;
  completed: number;
}

export interface ConversationStats {
  total: number;
  completed: number;
}

export interface LearningStats {
  completedLessons: number;
  learnedWords: number;
  learningWords: number;
  completedGrammar: number;
  totalGrammar: number;
  completedConversations: number;
  totalConversations: number;
  wrongAnswers: number;
}

export interface CategoryRatio {
  vocabulary: number;
  grammar: number;
  conversation: number;
}

export interface ProfileProgress {
  vocabularyProgress: number;
  grammarProgress: number;
  conversationProgress: number;
  listeningProgress: number;
  readingProgress: number;
  quizProgress: number;
}

export interface TodaySummary {
  studied: boolean;
  completedLessons: number;
  learnedWords: number;
}

const getLength = (items?: unknown[]): number => items?.length ?? 0;

const getCount = <T>(items: T[] | undefined, predicate: (item: T) => boolean): number => {
  if (!items) return 0;
  return items.filter(predicate).length;
};

const getPercent = (completed: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
};

export const calculateVocabularyStats = (
  progress: LearningProgressSnapshot | null,
): VocabularyStats => {
  const total = getLength(progress?.vocabularyStatus);
  const completed = getCount(progress?.vocabularyStatus, (item) => item.status === 'completed');
  const learning = getCount(progress?.vocabularyStatus, (item) => item.status === 'learning');
  return { total, completed, learning };
};

export const calculateGrammarStats = (
  progress: LearningProgressSnapshot | null,
): GrammarStats => {
  const total = getLength(progress?.grammarStatus);
  const completed = getCount(progress?.grammarStatus, (item) => item.progress >= 100);
  return { total, completed };
};

export const calculateConversationStats = (
  progress: LearningProgressSnapshot | null,
): ConversationStats => {
  const total = getLength(progress?.conversationStatus);
  const completed = getCount(progress?.conversationStatus, (item) => item.completed);
  return { total, completed };
};

export const calculateLearningStats = (
  progress: LearningProgressSnapshot | null,
): LearningStats => {
  const vocabularyStats = calculateVocabularyStats(progress);
  const grammarStats = calculateGrammarStats(progress);
  const conversationStats = calculateConversationStats(progress);

  return {
    completedLessons: getLength(progress?.completedLessons),
    learnedWords: vocabularyStats.completed,
    learningWords: vocabularyStats.learning,
    completedGrammar: grammarStats.completed,
    totalGrammar: grammarStats.total,
    completedConversations: conversationStats.completed,
    totalConversations: conversationStats.total,
    wrongAnswers: getLength(progress?.wrongAnswers),
  };
};

export const calculateCategoryRatio = (
  progress: LearningProgressSnapshot | null,
): CategoryRatio => {
  const vocabularyTotal = getLength(progress?.vocabularyStatus);
  const grammarTotal = getLength(progress?.grammarStatus);
  const conversationTotal = getLength(progress?.conversationStatus);
  const totalItems = vocabularyTotal + grammarTotal + conversationTotal;

  return {
    vocabulary: totalItems > 0 ? Math.round((vocabularyTotal / totalItems) * 100) : 0,
    grammar: totalItems > 0 ? Math.round((grammarTotal / totalItems) * 100) : 0,
    conversation: totalItems > 0 ? Math.round((conversationTotal / totalItems) * 100) : 0,
  };
};

export const calculateProfileProgress = (
  progress: LearningProgressSnapshot | null,
): ProfileProgress => {
  const vocabularyStats = calculateVocabularyStats(progress);
  const grammarStats = calculateGrammarStats(progress);
  const conversationStats = calculateConversationStats(progress);

  return {
    vocabularyProgress: getPercent(vocabularyStats.completed, vocabularyStats.total),
    grammarProgress: getPercent(grammarStats.completed, grammarStats.total),
    conversationProgress: getPercent(conversationStats.completed, conversationStats.total),
    listeningProgress: 0,
    readingProgress: 0,
    quizProgress: 0,
  };
};

export const calculateTodaySummary = (
  progress: LearningProgressSnapshot | null,
  studied: boolean,
): TodaySummary => {
  const learningStats = calculateLearningStats(progress);
  return {
    studied,
    completedLessons: learningStats.completedLessons,
    learnedWords: learningStats.learnedWords,
  };
};
