import mongoose from 'mongoose';
import WrongAnswerEntry, { IWrongAnswerEntry } from '@/models/WrongAnswerEntry';
import { WRONG_ANSWER_MAX_ENTRIES } from '@/utils/constants';
import type { ContentType, TargetLanguage, RemediationStatus } from '@/utils/constants';

export interface RecordWrongAnswerInput {
  userId: mongoose.Types.ObjectId;
  targetLanguage: TargetLanguage;
  contentType: ContentType;
  contentId: mongoose.Types.ObjectId;
  question: string;
  correctAnswer: string;
  userAnswer: string;
}

export const recordWrongAnswer = async (
  input: RecordWrongAnswerInput,
): Promise<IWrongAnswerEntry> => {
  const { userId, targetLanguage, contentType, contentId, question, correctAnswer, userAnswer } = input;
  const now = new Date();

  const entry = await WrongAnswerEntry.findOneAndUpdate(
    { userId, targetLanguage, contentType, contentId },
    {
      $inc: { wrongCount: 1 },
      $set: {
        question,
        correctAnswer,
        lastUserAnswer: userAnswer,
        lastWrongAt: now,
        remediationStatus: 'pending' as RemediationStatus,
      },
      $setOnInsert: {
        userId,
        targetLanguage,
        contentType,
        contentId,
        remediatedAt: null,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  await enforceEntryCap(userId, targetLanguage);

  return entry;
};

export const getDueRemediation = async (
  userId: mongoose.Types.ObjectId,
  targetLanguage: TargetLanguage,
  limit = 20,
): Promise<IWrongAnswerEntry[]> => {
  return WrongAnswerEntry.find({
    userId,
    targetLanguage,
    $or: [
      { remediationStatus: 'pending' },
      { remediationStatus: 'in_progress' },
    ],
  })
    .sort({ wrongCount: -1, lastWrongAt: 1 })
    .limit(limit)
    .exec();
};

export const markRemediated = async (
  userId: mongoose.Types.ObjectId,
  targetLanguage: TargetLanguage,
  contentId: mongoose.Types.ObjectId,
  contentType: ContentType,
): Promise<IWrongAnswerEntry | null> => {
  return WrongAnswerEntry.findOneAndUpdate(
    { userId, targetLanguage, contentType, contentId },
    {
      $set: {
        remediationStatus: 'resolved' as RemediationStatus,
        remediatedAt: new Date(),
      },
    },
    { new: true },
  );
};

const enforceEntryCap = async (
  userId: mongoose.Types.ObjectId,
  targetLanguage: TargetLanguage,
): Promise<void> => {
  const count = await WrongAnswerEntry.countDocuments({ userId, targetLanguage });
  if (count <= WRONG_ANSWER_MAX_ENTRIES) return;

  const excess = count - WRONG_ANSWER_MAX_ENTRIES;
  const toRemove = await WrongAnswerEntry.find({ userId, targetLanguage })
    .sort({ wrongCount: 1, lastWrongAt: 1 })
    .limit(excess)
    .select('_id');

  const ids = toRemove.map((doc) => doc._id);
  await WrongAnswerEntry.deleteMany({ _id: { $in: ids } });
};
