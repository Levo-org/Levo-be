// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import UserProgress from '@/models/UserProgress';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';

export class ReviewController {
  /** 복습 필요 항목 요약 */
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) return ApiResponse.success(res, { vocabulary: 0, grammar: 0, conversation: 0, wrongAnswers: 0 });

      const now = new Date();
      const needsReview = (status: any[]) =>
        status.filter((s: any) => {
          if (!s.lastStudiedAt) return false;
          if (s.mastered) return false;
          const daysSince = (now.getTime() - new Date(s.lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24);
          return REVIEW_INTERVALS_DAYS.some(interval => Math.abs(daysSince - interval) < 0.5);
        }).length;

      const unreviewedWrong = progress.wrongAnswers.filter((w: any) => !w.reviewedAt).length;

      return ApiResponse.success(res, {
        vocabulary: needsReview(progress.vocabularyStatus),
        grammar: needsReview(progress.grammarStatus),
        conversation: needsReview(progress.conversationStatus),
        wrongAnswers: unreviewedWrong,
        total: needsReview(progress.vocabularyStatus) + needsReview(progress.grammarStatus) +
               needsReview(progress.conversationStatus) + unreviewedWrong,
      });
    } catch (err) { next(err); }
  };

  /** 카테고리별 복습 항목 */
  getByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { category } = req.params;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) return ApiResponse.success(res, { items: [] });

      if (category === 'wrong') {
        const wrongItems = progress.wrongAnswers
          .filter((w: any) => !w.reviewedAt)
          .slice(0, 20);
        return ApiResponse.success(res, { items: wrongItems });
      }

      const statusKey = `${category}Status` as keyof typeof progress;
      const statusList = (progress as any)[statusKey];
      if (!statusList) throw ApiError.badRequest('유효하지 않은 카테고리입니다.');

      const now = new Date();
      const reviewItems = statusList.filter((s: any) => {
        if (!s.lastStudiedAt || s.mastered) return false;
        const daysSince = (now.getTime() - new Date(s.lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24);
        return REVIEW_INTERVALS_DAYS.some((interval: number) => Math.abs(daysSince - interval) < 0.5);
      });

      // 컨텐츠 상세 정보 가져오기
      const contentIds = reviewItems.map((r: any) => r.contentId);
      let Model: any;
      switch (category) {
        case 'vocabulary': Model = Vocabulary; break;
        case 'grammar': Model = Grammar; break;
        case 'conversation': Model = Conversation; break;
        default: throw ApiError.badRequest('유효하지 않은 카테고리입니다.');
      }

      const contents = await Model.find({ _id: { $in: contentIds } });

      return ApiResponse.success(res, { items: contents, reviewCount: contents.length });
    } catch (err) { next(err); }
  };

  /** 복습 완료 */
  completeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { category } = req.params;
      const { contentIds, wrongAnswerIds } = req.body;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      // 복습 날짜 업데이트
      if (category === 'wrong' && wrongAnswerIds) {
        for (const wa of progress.wrongAnswers) {
          if (wrongAnswerIds.includes(wa._id?.toString())) {
            wa.reviewedAt = new Date();
          }
        }
      } else if (contentIds) {
        const statusKey = `${category}Status` as keyof typeof progress;
        const statusList = (progress as any)[statusKey];
        if (statusList) {
          for (const s of statusList) {
            if (contentIds.includes(s.contentId.toString())) {
              s.lastStudiedAt = new Date();
              s.correctCount += 1;
            }
          }
        }
      }

      await progress.save();

      const xpEarned = XP_CONFIG.REVIEW_COMPLETE;
      await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { $inc: { xp: xpEarned } }
      );

      return ApiResponse.success(res, { xpEarned, message: '복습 완료!' });
    } catch (err) { next(err); }
  };
}
