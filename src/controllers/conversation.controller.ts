// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Conversation from '@/models/Conversation';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ConversationController {
  /** 회화 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage };
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
      const conversation = await Conversation.findById(req.params.id);
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
      const { conversationId, pronunciationScore } = req.body;
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

      if (statusIndex >= 0) {
        const entry = userProgress.conversationStatus[statusIndex];
        entry.completed = true;
        entry.pronunciationScore = Math.max(entry.pronunciationScore, pronunciationScore);
        entry.lastReviewedAt = new Date();
      } else {
        userProgress.conversationStatus.push({
          conversationId,
          completed: true,
          pronunciationScore,
          lastReviewedAt: new Date(),
        });
      }

      await userProgress.save();

      // XP 지급
      await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { $inc: { xp: XP_CONFIG.QUIZ_CORRECT } },
      );

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
