import mongoose, { Document, Schema, Types } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import { editorialMetadataSchema, IEditorialMetadata } from '@/types/editorial';
import { normalizeText } from '@/utils/normalizeText';

export interface IExampleSentence extends Document, IEditorialMetadata {
  targetLanguage: string;
  topic: string;
  level: string;
  originalText: string;
  translation: string;
  normalizedKey: string;
  tags?: string[];
  relatedVocabularyIds?: Types.ObjectId[];
  relatedGrammarIds?: Types.ObjectId[];
}

const exampleSentenceSchema = new Schema<IExampleSentence>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true, index: true },
    topic: { type: String, required: true, index: true },
    level: { type: String, enum: LEVELS, required: true },
    originalText: { type: String, required: true },
    translation: { type: String, default: '' },
    normalizedKey: { type: String, required: true },
    tags: [{ type: String }],
    relatedVocabularyIds: [{ type: Schema.Types.ObjectId, ref: 'Vocabulary' }],
    relatedGrammarIds: [{ type: Schema.Types.ObjectId, ref: 'Grammar' }],
    ...editorialMetadataSchema,
  },
  { timestamps: true }
);

const applyNormalizedKey = (doc: IExampleSentence): void => {
  if (doc.originalText) {
    doc.normalizedKey = normalizeText(doc.originalText);
  }
};

exampleSentenceSchema.pre<IExampleSentence>('validate', function (next) {
  if (this.isModified('originalText') || !this.normalizedKey) {
    applyNormalizedKey(this);
  }
  next();
});

exampleSentenceSchema.pre<IExampleSentence>('save', function (next) {
  if (this.isModified('originalText')) {
    applyNormalizedKey(this);
  }
  next();
});

exampleSentenceSchema.index({ targetLanguage: 1, normalizedKey: 1 }, { unique: true });
exampleSentenceSchema.index({ targetLanguage: 1, level: 1 });
exampleSentenceSchema.index({ tags: 1 });
exampleSentenceSchema.index(
  { targetLanguage: 1, sourceReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      datasetManaged: true,
      sourceReference: { $exists: true, $type: 'string' },
    },
  },
);

export default mongoose.model<IExampleSentence>('ExampleSentence', exampleSentenceSchema);
