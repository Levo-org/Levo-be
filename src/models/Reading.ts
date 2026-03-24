import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import { editorialMetadataSchema, IEditorialMetadata } from '@/types/editorial';

export interface IReading extends Document, IEditorialMetadata {
  targetLanguage: string;
  title: string;
  difficulty: string;
  content: string;
  translation: string;
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
    translation: { type: String, default: '' },
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
    ...editorialMetadataSchema,
  },
  { timestamps: true }
);

readingSchema.index({ targetLanguage: 1, difficulty: 1 });
readingSchema.index(
  { targetLanguage: 1, sourceReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      datasetManaged: true,
      sourceReference: { $exists: true, $type: 'string' },
    },
  },
);

export default mongoose.model<IReading>('Reading', readingSchema);
