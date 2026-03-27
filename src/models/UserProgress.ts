import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, WORD_STATUS, type WordStatus } from '@/utils/constants';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: string;
  completedLessons: mongoose.Types.ObjectId[];
  currentLessonId: mongoose.Types.ObjectId | null;
  vocabularyStatus: Array<{
    wordId: mongoose.Types.ObjectId;
    status: WordStatus;
    correctCount: number;
    wrongCount: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    introducedByLessonId: mongoose.Types.ObjectId | null;
    lastPracticedInLessonId: mongoose.Types.ObjectId | null;
  }>;
  grammarStatus: Array<{
    grammarId: mongoose.Types.ObjectId;
    progress: number;
    quizScore: number;
    solvedQuizIndexes: number[];
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    masteryState: WordStatus;
    correctCount: number;
    wrongCount: number;
    introducedByLessonId: mongoose.Types.ObjectId | null;
    lastPracticedInLessonId: mongoose.Types.ObjectId | null;
  }>;
  conversationStatus: Array<{
    conversationId: mongoose.Types.ObjectId;
    completed: boolean;
    pronunciationScore: number;
    lastReviewedAt: Date | null;
    masteryState: WordStatus;
    correctCount: number;
    wrongCount: number;
    nextReviewAt: Date | null;
    introducedByLessonId: mongoose.Types.ObjectId | null;
    lastPracticedInLessonId: mongoose.Types.ObjectId | null;
  }>;
  wrongAnswers: Array<{
    type: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'quiz' | 'conversation';
    contentId: mongoose.Types.ObjectId;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Internal-only fields: stored for analytics/migration but excluded from API responses
const INTERNAL_ONLY_TRANSFORM = {
  toJSON: {
    transform(_doc: Document, ret: Record<string, unknown>) {
      delete ret.introducedByLessonId;
      delete ret.lastPracticedInLessonId;
      return ret;
    },
  },
};

const vocabularyStatusSchema = new Schema(
  {
    wordId: { type: Schema.Types.ObjectId, ref: 'Vocabulary' },
    status: { type: String, enum: WORD_STATUS, default: 'new' },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null },
    introducedByLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastPracticedInLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
  },
  INTERNAL_ONLY_TRANSFORM,
);

const grammarStatusSchema = new Schema(
  {
    grammarId: { type: Schema.Types.ObjectId, ref: 'Grammar' },
    progress: { type: Number, default: 0 },
    quizScore: { type: Number, default: 0 },
    solvedQuizIndexes: [{ type: Number }],
    lastReviewedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null },
    masteryState: { type: String, enum: WORD_STATUS, default: 'new' },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    introducedByLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastPracticedInLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
  },
  INTERNAL_ONLY_TRANSFORM,
);

const conversationStatusSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    completed: { type: Boolean, default: false },
    pronunciationScore: { type: Number, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    masteryState: { type: String, enum: WORD_STATUS, default: 'new' },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    nextReviewAt: { type: Date, default: null },
    introducedByLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastPracticedInLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
  },
  INTERNAL_ONLY_TRANSFORM,
);

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    vocabularyStatus: [vocabularyStatusSchema],
    grammarStatus: [grammarStatusSchema],
    conversationStatus: [conversationStatusSchema],
    wrongAnswers: [
      {
        type: { type: String, enum: ['vocabulary', 'grammar', 'listening', 'reading', 'quiz', 'conversation'] },
        contentId: { type: Schema.Types.ObjectId },
        question: { type: String },
        userAnswer: { type: String },
        correctAnswer: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, targetLanguage: 1 }, { unique: true });

export default mongoose.model<IUserProgress>('UserProgress', userProgressSchema);
