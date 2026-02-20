import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export interface IUser extends Document {
  email: string;
  name: string;
  profileImage: string;
  provider: 'google' | 'apple' | 'email';
  providerId: string;
  activeLanguage: string;
  settings: {
    dailyGoalMinutes: number;
    notificationEnabled: boolean;
    notificationHour: number;
    soundEnabled: boolean;
    effectsEnabled: boolean;
  };
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  coins: number;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    profileImage: { type: String, default: '' },
    provider: { type: String, enum: ['google', 'apple', 'email'], required: true },
    providerId: { type: String, required: true },
    activeLanguage: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
    settings: {
      dailyGoalMinutes: { type: Number, default: 10, enum: [5, 10, 15, 20] },
      notificationEnabled: { type: Boolean, default: true },
      notificationHour: { type: Number, default: 7, min: 0, max: 23 },
      soundEnabled: { type: Boolean, default: true },
      effectsEnabled: { type: Boolean, default: true },
    },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    coins: { type: Number, default: 0, min: 0 },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export default mongoose.model<IUser>('User', userSchema);
