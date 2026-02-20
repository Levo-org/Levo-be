import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IVocabulary extends Document {
  targetLanguage: string;
  word: string;
  pronunciation: string;
  meaning: string;
  partOfSpeech: string;
  level: string;
  chapter: number;
  exampleSentence: string;
  exampleTranslation: string;
  audioUrl: string;
  order: number;
  createdAt: Date;
}

const vocabularySchema = new Schema<IVocabulary>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    word: { type: String, required: true, trim: true },
    pronunciation: { type: String, default: '' },
    meaning: { type: String, required: true },
    partOfSpeech: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    chapter: { type: Number, required: true },
    exampleSentence: { type: String, default: '' },
    exampleTranslation: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vocabularySchema.index({ targetLanguage: 1, level: 1, chapter: 1 });
vocabularySchema.index({ targetLanguage: 1, level: 1, order: 1 });

export default mongoose.model<IVocabulary>('Vocabulary', vocabularySchema);
