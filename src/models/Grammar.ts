import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IGrammar extends Document {
  targetLanguage: string;
  title: string;
  subtitle: string;
  englishTitle: string;
  icon: string;
  level: string;
  order: number;
  formula: string;
  formulaExample: string;
  explanation: string;
  examples: Array<{
    sentence: string;
    translation: string;
    highlight: string;
  }>;
  quizzes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  createdAt: Date;
}

const grammarSchema = new Schema<IGrammar>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    englishTitle: { type: String, default: '' },
    icon: { type: String, default: '📝' },
    level: { type: String, enum: LEVELS, required: true },
    order: { type: Number, default: 0 },
    formula: { type: String, default: '' },
    formulaExample: { type: String, default: '' },
    explanation: { type: String, default: '' },
    examples: [
      {
        sentence: { type: String },
        translation: { type: String },
        highlight: { type: String },
      },
    ],
    quizzes: [
      {
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: Number },
        explanation: { type: String },
      },
    ],
  },
  { timestamps: true }
);

grammarSchema.index({ targetLanguage: 1, level: 1 });

export default mongoose.model<IGrammar>('Grammar', grammarSchema);
