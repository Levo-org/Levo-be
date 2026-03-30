import mongoose, { Document, Schema } from 'mongoose';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES, WORD_STATUS } from '@/utils/constants';

const ITEM_PROGRESS_STATUSES = ['active', 'archived'] as const;
const ITEM_PROGRESS_RESULTS = ['correct', 'wrong'] as const;

export interface IUserItemProgress extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: (typeof SUPPORTED_LANGUAGES)[number];
  contentType: (typeof CONTENT_TYPES)[number];
  contentId: mongoose.Types.ObjectId;
  status: (typeof ITEM_PROGRESS_STATUSES)[number];
  masteryState: (typeof WORD_STATUS)[number];
  attemptCount: number;
  correctCount: number;
  wrongCount: number;
  reviewExposureCount: number;
  lastStudiedAt: Date | null;
  lastResult: (typeof ITEM_PROGRESS_RESULTS)[number] | null;
  nextReviewAt: Date | null;
  introducedByLessonId: mongoose.Types.ObjectId | null;
  lastPracticedInLessonId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userItemProgressSchema = new Schema<IUserItemProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    contentType: { type: String, enum: CONTENT_TYPES, required: true },
    contentId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ITEM_PROGRESS_STATUSES,
      default: 'active',
      required: true,
    },
    masteryState: {
      type: String,
      enum: WORD_STATUS,
      default: 'new',
      required: true,
    },
    attemptCount: { type: Number, default: 0, min: 0, required: true },
    correctCount: { type: Number, default: 0, min: 0, required: true },
    wrongCount: { type: Number, default: 0, min: 0, required: true },
    reviewExposureCount: { type: Number, default: 0, min: 0, required: true },
    lastStudiedAt: { type: Date, default: null },
    lastResult: { type: String, enum: ITEM_PROGRESS_RESULTS, default: null },
    nextReviewAt: { type: Date, default: null },
    introducedByLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastPracticedInLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
  },
  { timestamps: true }
);

userItemProgressSchema.index(
  { userId: 1, targetLanguage: 1, contentType: 1, contentId: 1 },
  { unique: true }
);

userItemProgressSchema.index({ userId: 1, targetLanguage: 1, nextReviewAt: 1 });

userItemProgressSchema.index({ userId: 1, targetLanguage: 1, contentType: 1, masteryState: 1 });

userItemProgressSchema.index({ userId: 1, targetLanguage: 1, lastResult: 1 });

export default mongoose.model<IUserItemProgress>('UserItemProgress', userItemProgressSchema);
