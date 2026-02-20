import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';

export interface IUserLanguageProfile extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: string;
  level: string;
  xp: number;
  userLevel: number;
  hearts: number;
  lastHeartLostAt: Date | null;
  vocabularyProgress: number;
  grammarProgress: number;
  conversationProgress: number;
  listeningProgress: number;
  readingProgress: number;
  quizProgress: number;
  streakShields: number;
  createdAt: Date;
  updatedAt: Date;
}

const userLanguageProfileSchema = new Schema<IUserLanguageProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    level: { type: String, enum: LEVELS, default: 'beginner' },
    xp: { type: Number, default: 0, min: 0 },
    userLevel: { type: Number, default: 1, min: 1 },
    hearts: { type: Number, default: 5, min: 0, max: 5 },
    lastHeartLostAt: { type: Date, default: null },
    vocabularyProgress: { type: Number, default: 0, min: 0, max: 100 },
    grammarProgress: { type: Number, default: 0, min: 0, max: 100 },
    conversationProgress: { type: Number, default: 0, min: 0, max: 100 },
    listeningProgress: { type: Number, default: 0, min: 0, max: 100 },
    readingProgress: { type: Number, default: 0, min: 0, max: 100 },
    quizProgress: { type: Number, default: 0, min: 0, max: 100 },
    streakShields: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

userLanguageProfileSchema.index({ userId: 1, targetLanguage: 1 }, { unique: true });

export default mongoose.model<IUserLanguageProfile>('UserLanguageProfile', userLanguageProfileSchema);
