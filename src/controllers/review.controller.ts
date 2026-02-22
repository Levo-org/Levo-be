// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserProgress from '@/models/UserProgress';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

export class ReviewController {
  /** GET 복습 대시보드 */
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) {
        return ApiResponse.success(res, {
          vocabulary: 0,
          grammar: 0,
          conversation: 0,
          total: 0,
        }, '복습 대시보드 조회 성공');
      }

      const now = new Date();

      const vocabularyDue = (progress.vocabularyStatus || []).filter(
        (v) => !v.lastReviewedAt || (v.nextReviewAt && v.nextReviewAt <= now),
      ).length;

      const grammarDue = (progress.grammarStatus || []).filter(
        (g) => !g.lastReviewedAt || (g.nextReviewAt && g.nextReviewAt <= now),
      ).length;

      const conversationDue = (progress.conversationStatus || []).filter(
        (c) => !c.lastReviewedAt,
      ).length;

      return ApiResponse.success(res, {
        vocabulary: vocabularyDue,
        grammar: grammarDue,
        conversation: conversationDue,
        total: vocabularyDue + grammarDue + conversationDue,
      }, '복습 대시보드 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** GET 카테고리별 복습 항목 조회 */
  getByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) {
        return ApiResponse.success(res, [], '복습 항목 조회 성공');
      }

      const now = new Date();
      let items: any[] = [];

      if (category === 'vocabulary') {
        const dueItems = (progress.vocabularyStatus || []).filter(
          (v) => !v.lastReviewedAt || (v.nextReviewAt && v.nextReviewAt <= now),
        ).slice(0, limit);

        const wordIds = dueItems.map((v) => v.wordId);
        const words = await Vocabulary.find({ _id: { $in: wordIds } }).lean();

        items = dueItems.map((v) => {
          const word = words.find((w) => w._id.toString() === v.wordId.toString());
          return { ...v.toObject?.() || v, content: word };
        });
      } else if (category === 'grammar') {
        const dueItems = (progress.grammarStatus || []).filter(
          (g) => !g.lastReviewedAt || (g.nextReviewAt && g.nextReviewAt <= now),
        ).slice(0, limit);

        const grammarIds = dueItems.map((g) => g.grammarId);
        const grammars = await Grammar.find({ _id: { $in: grammarIds } }).lean();

        items = dueItems.map((g) => {
          const grammar = grammars.find((gr) => gr._id.toString() === g.grammarId.toString());
          return { ...g.toObject?.() || g, content: grammar };
        });
      } else if (category === 'conversation') {
        items = (progress.conversationStatus || []).filter(
          (c) => !c.lastReviewedAt,
        ).slice(0, limit);
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다. (vocabulary, grammar, conversation)');
      }

      return ApiResponse.success(res, items, '복습 항목 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 복습 완료 */
  completeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { category, contentId, correct } = req.body;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진도를 찾을 수 없습니다.');

      const now = new Date();

      if (category === 'vocabulary') {
        const item = progress.vocabularyStatus.find(
          (v) => v.wordId.toString() === contentId,
        );
        if (!item) throw ApiError.notFound('해당 단어의 학습 기록을 찾을 수 없습니다.');

        item.lastReviewedAt = now;

        if (correct) {
          item.correctCount = (item.correctCount || 0) + 1;
          // 다음 간격 계산
          const currentIndex = REVIEW_INTERVALS_DAYS.findIndex(
            (days) => {
              if (!item.nextReviewAt || !item.lastReviewedAt) return true;
              const diff = Math.round(
                (item.nextReviewAt.getTime() - item.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24),
              );
              return days >= diff;
            },
          );
          const nextIndex = Math.min(currentIndex + 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextDays = REVIEW_INTERVALS_DAYS[nextIndex];
          item.nextReviewAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000);
          item.status = 'completed';
        } else {
          item.wrongCount = (item.wrongCount || 0) + 1;
          // 틀리면 1일 후로 리셋
          item.nextReviewAt = new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000);
          item.status = 'wrong';
        }
      } else if (category === 'grammar') {
        const item = progress.grammarStatus.find(
          (g) => g.grammarId.toString() === contentId,
        );
        if (!item) throw ApiError.notFound('해당 문법의 학습 기록을 찾을 수 없습니다.');

        item.lastReviewedAt = now;

        if (correct) {
          item.progress = Math.min((item.progress || 0) + 1, 100);
          const currentIndex = REVIEW_INTERVALS_DAYS.findIndex(
            (days) => {
              if (!item.nextReviewAt || !item.lastReviewedAt) return true;
              const diff = Math.round(
                (item.nextReviewAt.getTime() - item.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24),
              );
              return days >= diff;
            },
          );
          const nextIndex = Math.min(currentIndex + 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextDays = REVIEW_INTERVALS_DAYS[nextIndex];
          item.nextReviewAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000);
        } else {
          item.nextReviewAt = new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000);
        }
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다.');
      }

      await progress.save();

      // XP 지급
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (profile) {
        profile.xp += XP_CONFIG.REVIEW_COMPLETE;
        await profile.save();
      }

      return ApiResponse.success(res, {
        correct,
        xpEarned: XP_CONFIG.REVIEW_COMPLETE,
      }, '복습 완료');
    } catch (err) {
      next(err);
    }
  };
}
