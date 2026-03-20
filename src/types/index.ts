import type { ContentType, TargetLanguage, WordStatus } from '@/utils/constants';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export type ItemProgressStatus = 'active' | 'archived';
export type ItemProgressResult = 'correct' | 'wrong';

export interface UserItemProgressRecord {
  userId: string;
  targetLanguage: TargetLanguage;
  contentType: ContentType;
  contentId: string;
  status: ItemProgressStatus;
  masteryState: WordStatus;
  attemptCount: number;
  correctCount: number;
  wrongCount: number;
  lastStudiedAt: Date | null;
  lastResult: ItemProgressResult | null;
  nextReviewAt: Date | null;
  introducedByLessonId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
