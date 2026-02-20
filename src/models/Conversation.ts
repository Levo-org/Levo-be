import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IConversation extends Document {
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
  },
  { timestamps: true }
);

conversationSchema.index({ targetLanguage: 1, level: 1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);
