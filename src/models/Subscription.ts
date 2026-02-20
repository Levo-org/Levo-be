import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  paymentProvider: 'apple' | 'google';
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentProvider: { type: String, enum: ['apple', 'google'], required: true },
    transactionId: { type: String, required: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
