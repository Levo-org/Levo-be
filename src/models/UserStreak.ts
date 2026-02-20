import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export interface IUserStreak extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  weeklyRecord: Array<{
    date: string;
    completed: boolean;
    minutesStudied: number;
  }>;
  shieldUsedDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userStreakSchema = new Schema<IUserStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastStudyDate: { type: String, default: '' },
    weeklyRecord: [
      {
        date: { type: String },
        completed: { type: Boolean, default: false },
        minutesStudied: { type: Number, default: 0 },
      },
    ],
    shieldUsedDates: [{ type: String }],
  },
  { timestamps: true }
);

userStreakSchema.index({ userId: 1, targetLanguage: 1 }, { unique: true });

export default mongoose.model<IUserStreak>('UserStreak', userStreakSchema);
