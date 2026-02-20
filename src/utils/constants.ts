// 지원 언어
export const SUPPORTED_LANGUAGES = ['en', 'ja', 'zh'] as const;
export type TargetLanguage = typeof SUPPORTED_LANGUAGES[number];

// 난이도
export const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'] as const;
export type Level = typeof LEVELS[number];

// 하트 시스템
export const HEART_CONFIG = {
  MAX_HEARTS: 5,
  REFILL_INTERVAL_MINUTES: 30,
};

// XP & 레벨
export const XP_CONFIG = {
  LESSON_COMPLETE: 120,
  FLASHCARD_SET_COMPLETE: 50,
  REVIEW_COMPLETE: 30,
  QUIZ_CORRECT: 10,
  LEVEL_UP_FORMULA: (level: number) => level * 100,
};

// 코인
export const COIN_CONFIG = {
  LESSON_COMPLETE: 15,
  AD_WATCH: 30,
  DAILY_CHECK: 10,
  FRIEND_INVITE: 100,
  // 코인 사용
  HEART_SINGLE: 20,
  HEART_FULL: 50,
  STREAK_SHIELD: 100,
  HINT_5: 30,
  PROFILE_BORDER: 200,
};

// 간격 반복 (복습)
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90];

// 뱃지 카테고리
export const BADGE_CATEGORIES = ['streak', 'learning', 'level', 'special'] as const;
export type BadgeCategory = typeof BADGE_CATEGORIES[number];

// 콘텐츠 타입
export const CONTENT_TYPES = ['vocabulary', 'grammar', 'conversation', 'listening', 'reading'] as const;
export type ContentType = typeof CONTENT_TYPES[number];

// 학습 상태
export const WORD_STATUS = ['new', 'learning', 'completed', 'wrong'] as const;
export type WordStatus = typeof WORD_STATUS[number];

// 레슨 상태
export const LESSON_STATUS = ['locked', 'current', 'completed'] as const;
export type LessonStatus = typeof LESSON_STATUS[number];
