import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export interface ILesson extends Document {
  targetLanguage: string;
  unitNumber: number;
  unitTitle: string;
  lessonNumber: number;
  lessonTitle: string;
  newWords: mongoose.Types.ObjectId[];
  grammarPoints: mongoose.Types.ObjectId[];
  quizzes: Array<{
    type: 'multiple' | 'listening' | 'grammar' | 'reading';
    question: string;
    options: string[];
    correctAnswer: number | string;
    explanation: string;
  }>;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  prerequisiteLessonId: mongoose.Types.ObjectId | null;
  order: number;
  createdAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    unitNumber: { type: Number, required: true },
    unitTitle: { type: String, required: true },
    lessonNumber: { type: Number, required: true },
    lessonTitle: { type: String, required: true },
    newWords: [{ type: Schema.Types.ObjectId, ref: 'Vocabulary' }],
    grammarPoints: [{ type: Schema.Types.ObjectId, ref: 'Grammar' }],
    quizzes: [
      {
        type: { type: String, enum: ['multiple', 'listening', 'grammar', 'reading'] },
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: Schema.Types.Mixed },
        explanation: { type: String },
      },
    ],
    estimatedMinutes: { type: Number, default: 5 },
    xpReward: { type: Number, default: 120 },
    coinReward: { type: Number, default: 15 },
    prerequisiteLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lessonSchema.index({ targetLanguage: 1, unitNumber: 1, order: 1 });

export default mongoose.model<ILesson>('Lesson', lessonSchema);
