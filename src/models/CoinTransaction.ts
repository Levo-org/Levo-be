import mongoose, { Document, Schema } from 'mongoose';

export interface ICoinTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: Date;
}

const coinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earn', 'spend'], required: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        'lesson_complete', 'ad_watch', 'daily_check', 'friend_invite',
        'heart_refill', 'streak_shield', 'hint_purchase', 'profile_item',
        'package_purchase',
      ],
      required: true,
    },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

coinTransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ICoinTransaction>('CoinTransaction', coinTransactionSchema);
