// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Conversation from '@/models/Conversation';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';

export class ConversationController {
  /** 회화 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (level) filter.level = level;

      const [conversations, total] = await Promise.all([
        Conversation.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Conversation.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, conversations, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  /** 회화 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversation = await Conversation.findOne({ _id: req.params.id, status: 'published' });
      if (!conversation) throw ApiError.notFound('회화를 찾을 수 없습니다.');

      return ApiResponse.success(res, {
        conversation: {
          ...conversation.toObject(),
          dialogs: conversation.dialogs,
          keyExpressions: conversation.keyExpressions,
        },
      }, '회화 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 회화 연습 결과 제출 */
  submitPractice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { conversationId, pronunciationScore, correct } = req.body;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw ApiError.notFound('회화를 찾을 수 없습니다.');

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      const statusIndex = userProgress.conversationStatus.findIndex(
        (c) => c.conversationId.toString() === conversationId,
      );

      const wasCorrect = correct !== false;

      if (statusIndex >= 0) {
        const entry = userProgress.conversationStatus[statusIndex];
        entry.completed = true;
        entry.pronunciationScore = Math.max(entry.pronunciationScore, pronunciationScore);
        if (wasCorrect) {
          entry.correctCount = (entry.correctCount || 0) + 1;
          const intervalIndex = Math.min(entry.correctCount - 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[intervalIndex]);
          entry.nextReviewAt = nextReviewDate;
          entry.masteryState = entry.correctCount >= 3 ? 'completed' : 'learning';
        } else {
          entry.wrongCount = (entry.wrongCount || 0) + 1;
          entry.masteryState = 'wrong';
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
          entry.nextReviewAt = nextReviewDate;
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
          userProgress.wrongAnswers.push({
            type: 'conversation',
            contentId: conversation._id,
            question: conversation.title,
            userAnswer: '',
            correctAnswer: '',
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'conversation',
            contentId: conversation._id,
            question: conversation.title,
            correctAnswer: '',
            userAnswer: '',
          });
        }
        entry.lastReviewedAt = new Date();
      } else {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
        userProgress.conversationStatus.push({
          conversationId,
          completed: true,
          pronunciationScore,
          lastReviewedAt: new Date(),
          masteryState: wasCorrect ? 'learning' : 'wrong',
          correctCount: wasCorrect ? 1 : 0,
          wrongCount: wasCorrect ? 0 : 1,
          nextReviewAt: nextReviewDate,
        });
        if (!wasCorrect) {
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
           userProgress.wrongAnswers.push({
            type: 'conversation',
            contentId: conversation._id,
            question: conversation.title,
            userAnswer: '',
            correctAnswer: '',
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'conversation',
            contentId: conversation._id,
            question: conversation.title,
            correctAnswer: '',
            userAnswer: '',
          });
        }
      }

      await userProgress.save();

      // XP 지급
      if (wasCorrect) {
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: XP_CONFIG.QUIZ_CORRECT } },
        );
      }

      return ApiResponse.success(res, {
        conversationId,
        pronunciationScore,
        conversationStatus: userProgress.conversationStatus.find(
          (c) => c.conversationId.toString() === conversationId,
        ),
      }, '회화 연습 결과 제출 완료');
    } catch (err) {
      next(err);
    }
  };
}

export default new ConversationController();
