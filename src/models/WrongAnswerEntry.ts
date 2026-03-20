import mongoose, { Document, Schema } from 'mongoose';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES, REMEDIATION_STATUSES } from '@/utils/constants';

export interface IWrongAnswerEntry extends Document {
  userId: mongoose.Types.ObjectId;
  targetLanguage: (typeof SUPPORTED_LANGUAGES)[number];
  contentType: (typeof CONTENT_TYPES)[number];
  contentId: mongoose.Types.ObjectId;
  question: string;
  correctAnswer: string;
  lastUserAnswer: string;
  wrongCount: number;
  lastWrongAt: Date;
  remediationStatus: (typeof REMEDIATION_STATUSES)[number];
  remediatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const wrongAnswerEntrySchema = new Schema<IWrongAnswerEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetLanguage: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    contentType: { type: String, enum: CONTENT_TYPES, required: true },
    contentId: { type: Schema.Types.ObjectId, required: true },
    question: { type: String, default: '' },
    correctAnswer: { type: String, default: '' },
    lastUserAnswer: { type: String, default: '' },
    wrongCount: { type: Number, default: 1, min: 1, required: true },
    lastWrongAt: { type: Date, required: true },
    remediationStatus: {
      type: String,
      enum: REMEDIATION_STATUSES,
      default: 'pending',
      required: true,
    },
    remediatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

wrongAnswerEntrySchema.index(
  { userId: 1, targetLanguage: 1, contentType: 1, contentId: 1 },
  { unique: true }
);

wrongAnswerEntrySchema.index(
  { userId: 1, targetLanguage: 1, remediationStatus: 1, wrongCount: -1, lastWrongAt: 1 }
);

export default mongoose.model<IWrongAnswerEntry>('WrongAnswerEntry', wrongAnswerEntrySchema);
