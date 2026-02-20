// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Conversation from '@/models/Conversation';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ConversationController {
  /** 회화 목록 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const { level, page = '1', limit = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [items, total] = await Promise.all([
        Conversation.find(filter)
          .select('-dialogs')
          .sort({ order: 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Conversation.countDocuments(filter),
      ]);

      const progress = await UserProgress.findOne({ userId: req.user!._id, targetLanguage });
      const statusMap = new Map(
        (progress?.conversationStatus || []).map((c: any) => [c.contentId.toString(), c])
      );

      const data = items.map(item => ({
        ...item.toJSON(),
        practiced: !!statusMap.get(item._id.toString()),
        practiceCount: statusMap.get(item._id.toString())?.correctCount || 0,
      }));

      return ApiResponse.paginated(res, data, total, pageNum, limitNum);
    } catch (err) { next(err); }
  };

  /** 회화 상세 (다이얼로그 포함) */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Conversation.findById(req.params.id);
      if (!item) throw ApiError.notFound('회화를 찾을 수 없습니다.');
      return ApiResponse.success(res, item);
    } catch (err) { next(err); }
  };

  /** 회화 연습 완료 */
  submitPractice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const conversationId = req.params.id;
      const { score } = req.body; // 0-100

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw ApiError.notFound('회화를 찾을 수 없습니다.');

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      const existing = progress.conversationStatus.find(
        (c: any) => c.contentId.toString() === conversationId
      );

      if (existing) {
        existing.correctCount += 1;
        existing.lastStudiedAt = new Date();
        if (score >= 80) existing.mastered = true;
      } else {
        progress.conversationStatus.push({
          contentId: conversationId as any,
          mastered: score >= 80,
          correctCount: 1,
          wrongCount: 0,
          lastStudiedAt: new Date(),
        });
      }

      await progress.save();

      const xpEarned = XP_CONFIG.CONVERSATION_PRACTICE;
      await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { $inc: { xp: xpEarned } }
      );

      return ApiResponse.success(res, { score, xpEarned });
    } catch (err) { next(err); }
  };
}
