import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import { editorialMetadataSchema, IEditorialMetadata } from '@/types/editorial';

export interface IConversation extends Document, IEditorialMetadata {
  targetLanguage: string;
  title: string;
  emoji: string;
  level: string;
  order: number;
  dialogs: Array<{
    speaker: 'A' | 'B';
    text: string;
    translation: string;
    isUserRole: boolean;
    audioUrl: string;
  }>;
  keyExpressions: Array<{
    expression: string;
    meaning: string;
  }>;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    title: { type: String, required: true },
    emoji: { type: String, default: '💬' },
    level: { type: String, enum: LEVELS, required: true },
    order: { type: Number, default: 0 },
    dialogs: [
      {
        speaker: { type: String, enum: ['A', 'B'] },
        text: { type: String },
        translation: { type: String },
        isUserRole: { type: Boolean, default: false },
        audioUrl: { type: String, default: '' },
      },
    ],
    keyExpressions: [
      {
        expression: { type: String },
        meaning: { type: String },
      },
    ],
    ...editorialMetadataSchema,
  },
  { timestamps: true }
);

conversationSchema.index({ targetLanguage: 1, level: 1 });
conversationSchema.index(
  { targetLanguage: 1, sourceReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      datasetManaged: true,
      sourceReference: { $exists: true, $type: 'string' },
    },
  },
);

export default mongoose.model<IConversation>('Conversation', conversationSchema);
