import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IListening extends Document {
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
  },
  { timestamps: true }
);

listeningSchema.index({ targetLanguage: 1, difficulty: 1 });

export default mongoose.model<IListening>('Listening', listeningSchema);
