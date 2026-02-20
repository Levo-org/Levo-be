import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IReading extends Document {
  targetLanguage: string;
  title: string;
  difficulty: string;
  content: string;
  wordCount: number;
  quizzes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  order: number;
  createdAt: Date;
}

const readingSchema = new Schema<IReading>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: LEVELS, required: true },
    content: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    quizzes: [
      {
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: Number },
        explanation: { type: String },
      },
    ],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

readingSchema.index({ targetLanguage: 1, difficulty: 1 });

export default mongoose.model<IReading>('Reading', readingSchema);
