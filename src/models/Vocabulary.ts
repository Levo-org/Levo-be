import mongoose, { Document, Schema, Types } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import { editorialMetadataSchema, IEditorialMetadata } from '@/types/editorial';

export interface IVocabulary extends Document, IEditorialMetadata {
  targetLanguage: string;
  word: string;
  pronunciation: string;
  meaning: string;
  meanings: string[];
  partOfSpeech: string;
  level: string;
  chapter: number;
  exampleSentence: string;
  exampleTranslation: string;
  exampleSentenceIds?: Types.ObjectId[];
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
    meanings: { type: [String], default: [] },
    partOfSpeech: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    chapter: { type: Number, required: true },
    exampleSentence: { type: String, default: '' },
    exampleTranslation: { type: String, default: '' },
    exampleSentenceIds: [{ type: Schema.Types.ObjectId, ref: 'ExampleSentence' }],
    audioUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    ...editorialMetadataSchema,
  },
  { timestamps: true }
);

vocabularySchema.index({ targetLanguage: 1, level: 1, chapter: 1 });
vocabularySchema.index({ targetLanguage: 1, level: 1, order: 1 });
vocabularySchema.index(
  { targetLanguage: 1, sourceReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      datasetManaged: true,
      sourceReference: { $exists: true, $type: 'string' },
    },
  },
);

export default mongoose.model<IVocabulary>('Vocabulary', vocabularySchema);
