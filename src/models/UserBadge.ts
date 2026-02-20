import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  targetLanguage: string;
  achievedAt: Date;
}

const userBadgeSchema = new Schema<IUserBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    achievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userBadgeSchema.index({ userId: 1, badgeId: 1, targetLanguage: 1 }, { unique: true });

export default mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
