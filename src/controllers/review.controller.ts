// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserProgress from '@/models/UserProgress';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { recordWrongAnswer } from '@/services/remediation.service';

const MAX_REVIEW_EXPOSURES = 3;

export class ReviewController {
  private isDue = (entry: { lastReviewedAt?: Date | null; nextReviewAt?: Date | null }, now: Date) => {
    return !entry.lastReviewedAt || (entry.nextReviewAt && entry.nextReviewAt <= now);
  };

  private canAppearInReview = (
    entry: { lastReviewedAt?: Date | null; nextReviewAt?: Date | null; reviewExposureCount?: number },
    now: Date,
  ) => {
    const exposureCount = entry.reviewExposureCount ?? 0;
    return this.isDue(entry, now) && exposureCount < MAX_REVIEW_EXPOSURES;
  };

  private updateNextReviewAt = (
    entry: { correctCount?: number; nextReviewAt?: Date | null },
    now: Date,
  ) => {
    const currentCorrectCount = entry.correctCount || 0;
    const intervalIndex = Math.min(Math.max(currentCorrectCount - 1, 0), REVIEW_INTERVALS_DAYS.length - 1);
    const nextDays = REVIEW_INTERVALS_DAYS[intervalIndex];
    entry.nextReviewAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000);
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) {
        return ApiResponse.success(
          res,
          {
            totalReviewItems: 0,
            categories: [
              { id: 'vocabulary', category: 'vocabulary', name: 'vocabulary', count: 0, lastReview: null },
              { id: 'grammar', category: 'grammar', name: 'grammar', count: 0, lastReview: null },
              { id: 'conversation', category: 'conversation', name: 'conversation', count: 0, lastReview: null },
            ],
            vocabulary: 0,
            grammar: 0,
            conversation: 0,
            total: 0,
          },
          '복습 대시보드 조회 성공',
        );
      }

      const now = new Date();

      const vocabularyDueItems = (progress.vocabularyStatus || []).filter((v) => this.canAppearInReview(v, now));
      const grammarDueItems = (progress.grammarStatus || []).filter((g) => this.canAppearInReview(g, now));
      const conversationDueItems = (progress.conversationStatus || []).filter((c) => this.canAppearInReview(c, now));

      const vocabularyDue = vocabularyDueItems.length;
      const grammarDue = grammarDueItems.length;
      const conversationDue = conversationDueItems.length;
      const total = vocabularyDue + grammarDue + conversationDue;

      const latestDateLabel = (dates: Array<Date | null | undefined>) => {
        const validDates = dates.filter(Boolean) as Date[];
        if (validDates.length === 0) return null;
        const latest = validDates.sort((a, b) => b.getTime() - a.getTime())[0];
        return latest.toISOString().slice(0, 10);
      };

      return ApiResponse.success(
        res,
        {
          totalReviewItems: total,
          categories: [
            {
              id: 'vocabulary',
              category: 'vocabulary',
              name: 'vocabulary',
              count: vocabularyDue,
              lastReview: latestDateLabel(vocabularyDueItems.map((item) => item.lastReviewedAt)),
            },
            {
              id: 'grammar',
              category: 'grammar',
              name: 'grammar',
              count: grammarDue,
              lastReview: latestDateLabel(grammarDueItems.map((item) => item.lastReviewedAt)),
            },
            {
              id: 'conversation',
              category: 'conversation',
              name: 'conversation',
              count: conversationDue,
              lastReview: latestDateLabel(conversationDueItems.map((item) => item.lastReviewedAt)),
            },
          ],
          vocabulary: vocabularyDue,
          grammar: grammarDue,
          conversation: conversationDue,
          total,
        },
        '복습 대시보드 조회 성공',
      );
    } catch (err) {
      next(err);
    }
  };

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
        const dueItems = (progress.vocabularyStatus || [])
          .filter((v) => this.canAppearInReview(v, now))
          .slice(0, limit);

        const wordIds = dueItems.map((v) => v.wordId);
        const words = await Vocabulary.find({ _id: { $in: wordIds }, status: 'published' }).lean();
        const wordById = new Map(words.map((word) => [word._id.toString(), word]));

        items = dueItems
          .map((entry) => {
            const word = wordById.get(entry.wordId.toString());
            if (!word) return null;
            return {
              _id: word._id.toString(),
              word: word.word,
              meaning: word.meaning,
              pronunciation: word.pronunciation || '',
              example: word.exampleSentence || '',
              reviewExposureCount: entry.reviewExposureCount ?? 0,
            };
          })
          .filter(Boolean);
      } else if (category === 'grammar') {
        const dueItems = (progress.grammarStatus || [])
          .filter((g) => this.canAppearInReview(g, now))
          .slice(0, limit);

        const grammarIds = dueItems.map((g) => g.grammarId);
        const grammars = await Grammar.find({ _id: { $in: grammarIds }, status: 'published' }).lean();
        const grammarById = new Map(grammars.map((grammar) => [grammar._id.toString(), grammar]));

        items = dueItems
          .map((entry) => {
            const grammar = grammarById.get(entry.grammarId.toString());
            if (!grammar) return null;
            return {
              _id: grammar._id.toString(),
              rule: grammar.title,
              example: grammar.formulaExample || '',
              tip: grammar.explanation || '',
              formula: grammar.formula || '',
              reviewExposureCount: entry.reviewExposureCount ?? 0,
            };
          })
          .filter(Boolean);
      } else if (category === 'conversation') {
        const dueItems = (progress.conversationStatus || [])
          .filter((c) => this.canAppearInReview(c, now))
          .slice(0, limit);

        const conversationIds = dueItems.map((c) => c.conversationId);
        const conversations = await Conversation.find({ _id: { $in: conversationIds }, status: 'published' }).lean();
        const conversationById = new Map(conversations.map((conversation) => [conversation._id.toString(), conversation]));

        items = dueItems
          .map((entry) => {
            const conversation = conversationById.get(entry.conversationId.toString());
            if (!conversation) return null;
            return {
              _id: conversation._id.toString(),
              situation: conversation.title,
              description: conversation.level,
              dialogCount: Array.isArray(conversation.dialogs) ? conversation.dialogs.length : 0,
              reviewExposureCount: entry.reviewExposureCount ?? 0,
            };
          })
          .filter(Boolean);
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다. (vocabulary, grammar, conversation)');
      }

      return ApiResponse.success(res, items, '복습 항목 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  completeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const category = (req.params.category || req.body.category || '').toString();
      const contentId = req.body.contentId ? req.body.contentId.toString() : '';
      const correct = req.body.correct !== false;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진도를 찾을 수 없습니다.');

      const now = new Date();

      const updateExposure = (item: { reviewExposureCount?: number }) => {
        item.reviewExposureCount = Math.min((item.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
      };

      if (category === 'vocabulary') {
        const candidates = (progress.vocabularyStatus || []).filter((entry) => {
          if (contentId) return entry.wordId.toString() === contentId;
          return this.canAppearInReview(entry, now);
        });

        if (contentId && candidates.length === 0) {
          throw ApiError.notFound('해당 단어의 학습 기록을 찾을 수 없습니다.');
        }

        for (const item of candidates) {
          item.lastReviewedAt = now;
          updateExposure(item);

          if (correct) {
            item.correctCount = (item.correctCount || 0) + 1;
            this.updateNextReviewAt(item, now);
            item.status = item.correctCount >= 3 ? 'completed' : 'learning';
          } else {
            item.wrongCount = (item.wrongCount || 0) + 1;
            item.nextReviewAt = new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000);
            item.status = 'wrong';
            await recordWrongAnswer({
              userId,
              targetLanguage,
              contentType: 'vocabulary',
              contentId: item.wordId,
              question: '',
              correctAnswer: '',
              userAnswer: '',
            });
          }
        }
      } else if (category === 'grammar') {
        const candidates = (progress.grammarStatus || []).filter((entry) => {
          if (contentId) return entry.grammarId.toString() === contentId;
          return this.canAppearInReview(entry, now);
        });

        if (contentId && candidates.length === 0) {
          throw ApiError.notFound('해당 문법의 학습 기록을 찾을 수 없습니다.');
        }

        for (const item of candidates) {
          item.lastReviewedAt = now;
          updateExposure(item);

          if (correct) {
            item.progress = Math.min((item.progress || 0) + 25, 100);
            item.correctCount = (item.correctCount || 0) + 1;
            this.updateNextReviewAt(item, now);
            item.masteryState = item.correctCount >= 3 ? 'completed' : 'learning';
          } else {
            item.wrongCount = (item.wrongCount || 0) + 1;
            item.nextReviewAt = new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000);
            item.masteryState = 'wrong';
            await recordWrongAnswer({
              userId,
              targetLanguage,
              contentType: 'grammar',
              contentId: item.grammarId,
              question: '',
              correctAnswer: '',
              userAnswer: '',
            });
          }
        }
      } else if (category === 'conversation') {
        const candidates = (progress.conversationStatus || []).filter((entry) => {
          if (contentId) return entry.conversationId.toString() === contentId;
          return this.canAppearInReview(entry, now);
        });

        if (contentId && candidates.length === 0) {
          throw ApiError.notFound('해당 회화의 학습 기록을 찾을 수 없습니다.');
        }

        for (const item of candidates) {
          item.lastReviewedAt = now;
          updateExposure(item);

          if (correct) {
            item.correctCount = (item.correctCount || 0) + 1;
            this.updateNextReviewAt(item, now);
            item.masteryState = item.correctCount >= 3 ? 'completed' : 'learning';
          } else {
            item.wrongCount = (item.wrongCount || 0) + 1;
            item.nextReviewAt = new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000);
            item.masteryState = 'wrong';
            await recordWrongAnswer({
              userId,
              targetLanguage,
              contentType: 'conversation',
              contentId: item.conversationId,
              question: '',
              correctAnswer: '',
              userAnswer: '',
            });
          }
        }
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다.');
      }

      await progress.save();

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (profile) {
        profile.xp += XP_CONFIG.REVIEW_COMPLETE;
        await profile.save();
      }

      return ApiResponse.success(
        res,
        {
          correct,
          xpEarned: XP_CONFIG.REVIEW_COMPLETE,
        },
        '복습 완료',
      );
    } catch (err) {
      next(err);
    }
  };
}
