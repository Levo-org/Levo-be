import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: string;
  completedLessons: mongoose.Types.ObjectId[];
  currentLessonId: mongoose.Types.ObjectId | null;
  vocabularyStatus: Array<{
    wordId: mongoose.Types.ObjectId;
    status: 'new' | 'learning' | 'completed' | 'wrong';
    correctCount: number;
    wrongCount: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
  }>;
  grammarStatus: Array<{
    grammarId: mongoose.Types.ObjectId;
    progress: number;
    quizScore: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
  }>;
  conversationStatus: Array<{
    conversationId: mongoose.Types.ObjectId;
    completed: boolean;
    pronunciationScore: number;
    lastReviewedAt: Date | null;
  }>;
  wrongAnswers: Array<{
    type: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'quiz';
    contentId: mongoose.Types.ObjectId;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    vocabularyStatus: [
      {
        wordId: { type: Schema.Types.ObjectId, ref: 'Vocabulary' },
        status: { type: String, enum: ['new', 'learning', 'completed', 'wrong'], default: 'new' },
        correctCount: { type: Number, default: 0 },
        wrongCount: { type: Number, default: 0 },
        lastReviewedAt: { type: Date, default: null },
        nextReviewAt: { type: Date, default: null },
      },
    ],
    grammarStatus: [
      {
        grammarId: { type: Schema.Types.ObjectId, ref: 'Grammar' },
        progress: { type: Number, default: 0 },
        quizScore: { type: Number, default: 0 },
        lastReviewedAt: { type: Date, default: null },
        nextReviewAt: { type: Date, default: null },
      },
    ],
    conversationStatus: [
      {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
        completed: { type: Boolean, default: false },
        pronunciationScore: { type: Number, default: 0 },
        lastReviewedAt: { type: Date, default: null },
      },
    ],
    wrongAnswers: [
      {
        type: { type: String, enum: ['vocabulary', 'grammar', 'listening', 'reading', 'quiz'] },
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
