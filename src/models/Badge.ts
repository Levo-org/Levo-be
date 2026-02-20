import mongoose, { Document, Schema } from 'mongoose';
import { BADGE_CATEGORIES } from '@/utils/constants';

export interface IBadge extends Document {
  name: string;
  emoji: string;
  category: string;
  description: string;
  condition: {
    type: string;
    value: number;
  };
  createdAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    category: { type: String, enum: BADGE_CATEGORIES, required: true },
    description: { type: String, default: '' },
    condition: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBadge>('Badge', badgeSchema);
