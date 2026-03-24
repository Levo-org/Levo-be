import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import { editorialMetadataSchema, IEditorialMetadata } from '@/types/editorial';

export interface IListening extends Document, IEditorialMetadata {
  targetLanguage: string;
  audioText: string;
  correctAnswer: string;
  hint: string;
  difficulty: string;
  audioUrl: string;
  order: number;
  createdAt: Date;
}

const listeningSchema = new Schema<IListening>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    audioText: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    hint: { type: String, default: '' },
    difficulty: { type: String, enum: LEVELS, required: true },
    audioUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    ...editorialMetadataSchema,
  },
  { timestamps: true }
);

listeningSchema.index({ targetLanguage: 1, difficulty: 1 });
listeningSchema.index(
  { targetLanguage: 1, sourceReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      datasetManaged: true,
      sourceReference: { $exists: true, $type: 'string' },
    },
  },
);

export default mongoose.model<IListening>('Listening', listeningSchema);
