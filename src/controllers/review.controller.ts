// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserProgress from '@/models/UserProgress';
import UserItemProgress from '@/models/UserItemProgress';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Reading from '@/models/Reading';
import Listening from '@/models/Listening';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

const MAX_REVIEW_EXPOSURES = 3;

type CategoryKey = 'vocabulary' | 'grammar' | 'conversation' | 'reading' | 'listening';

export class ReviewController {
  private isUnderExposureLimit = (reviewExposureCount?: number | null) => {
    return (reviewExposureCount ?? 0) < MAX_REVIEW_EXPOSURES;
  };

  private isLearnedVocabulary = (entry: any) => {
    return !!entry && (
      (entry.correctCount || 0) > 0 ||
      (entry.wrongCount || 0) > 0 ||
      !!entry.lastReviewedAt ||
      !!entry.nextReviewAt ||
      (entry.status && entry.status !== 'new')
    );
  };

  private isLearnedGrammar = (entry: any) => {
    return !!entry && (
      (entry.progress || 0) > 0 ||
      (entry.correctCount || 0) > 0 ||
      (entry.wrongCount || 0) > 0 ||
      !!entry.lastReviewedAt ||
      !!entry.nextReviewAt ||
      (entry.masteryState && entry.masteryState !== 'new')
    );
  };

  private isLearnedConversation = (entry: any) => {
    return !!entry && (
      !!entry.completed ||
      (entry.correctCount || 0) > 0 ||
      (entry.wrongCount || 0) > 0 ||
      !!entry.lastReviewedAt ||
      !!entry.nextReviewAt ||
      (entry.masteryState && entry.masteryState !== 'new')
    );
  };

  private isLearnedReading = (entry: any) => {
    return !!entry && (
      (entry.progress || 0) > 0 ||
      (entry.correctCount || 0) > 0 ||
      (entry.wrongCount || 0) > 0 ||
      (entry.solvedQuizIndexes || []).length > 0 ||
      (entry.wrongQuizIndexes || []).length > 0 ||
      !!entry.lastReviewedAt ||
      (entry.masteryState && entry.masteryState !== 'new')
    );
  };

  private latestDateLabel = (dates: Array<Date | null | undefined>) => {
    const validDates = dates.filter(Boolean) as Date[];
    if (validDates.length === 0) return null;
    const latest = validDates.sort((a, b) => b.getTime() - a.getTime())[0];
    return latest.toISOString().slice(0, 10);
  };

  private getEligibleCollections = async (userId: any, targetLanguage: string) => {
    const [progress, listeningItems] = await Promise.all([
      UserProgress.findOne({ userId, targetLanguage }),
      UserItemProgress.find({
        userId,
        targetLanguage,
        contentType: 'listening',
        status: 'active',
        attemptCount: { $gt: 0 },
      }),
    ]);

    const vocabulary = (progress?.vocabularyStatus || []).filter(
      (entry: any) => this.isLearnedVocabulary(entry) && this.isUnderExposureLimit(entry.reviewExposureCount),
    );
    const grammar = (progress?.grammarStatus || []).filter(
      (entry: any) => this.isLearnedGrammar(entry) && this.isUnderExposureLimit(entry.reviewExposureCount),
    );
    const conversation = (progress?.conversationStatus || []).filter(
      (entry: any) => this.isLearnedConversation(entry) && this.isUnderExposureLimit(entry.reviewExposureCount),
    );
    const reading = (progress?.readingStatus || []).filter(
      (entry: any) => this.isLearnedReading(entry) && this.isUnderExposureLimit(entry.reviewExposureCount),
    );
    const listening = (listeningItems || []).filter(
      (entry: any) => this.isUnderExposureLimit(entry.reviewExposureCount),
    );

    return {
      progress,
      vocabulary,
      grammar,
      conversation,
      reading,
      listening,
    };
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      const eligible = await this.getEligibleCollections(userId, targetLanguage);

      const vocabularyCount = eligible.vocabulary.length;
      const grammarCount = eligible.grammar.length;
      const conversationCount = eligible.conversation.length;
      const readingCount = eligible.reading.length;
      const listeningCount = eligible.listening.length;
      const total = vocabularyCount + grammarCount + conversationCount + readingCount + listeningCount;

      return ApiResponse.success(
        res,
        {
          totalReviewItems: total,
          categories: [
            {
              id: 'vocabulary',
              category: 'vocabulary',
              name: 'vocabulary',
              count: vocabularyCount,
              lastReview: this.latestDateLabel(eligible.vocabulary.map((item: any) => item.lastReviewedAt)),
            },
            {
              id: 'grammar',
              category: 'grammar',
              name: 'grammar',
              count: grammarCount,
              lastReview: this.latestDateLabel(eligible.grammar.map((item: any) => item.lastReviewedAt)),
            },
            {
              id: 'conversation',
              category: 'conversation',
              name: 'conversation',
              count: conversationCount,
              lastReview: this.latestDateLabel(eligible.conversation.map((item: any) => item.lastReviewedAt)),
            },
            {
              id: 'listening',
              category: 'listening',
              name: 'listening',
              count: listeningCount,
              lastReview: this.latestDateLabel(eligible.listening.map((item: any) => item.lastStudiedAt)),
            },
            {
              id: 'reading',
              category: 'reading',
              name: 'reading',
              count: readingCount,
              lastReview: this.latestDateLabel(eligible.reading.map((item: any) => item.lastReviewedAt)),
            },
          ],
          vocabulary: vocabularyCount,
          grammar: grammarCount,
          conversation: conversationCount,
          listening: listeningCount,
          reading: readingCount,
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
      const { category } = req.params as { category: CategoryKey };
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const eligible = await this.getEligibleCollections(userId, targetLanguage);
      let items: any[] = [];

      if (category === 'vocabulary') {
        const dueItems = eligible.vocabulary.slice(0, limit);
        const wordIds = dueItems.map((entry: any) => entry.wordId);
        const words = await Vocabulary.find({ _id: { $in: wordIds }, status: 'published' }).lean();
        const wordById = new Map(words.map((word: any) => [word._id.toString(), word]));

        items = dueItems
          .map((entry: any) => {
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
        const dueItems = eligible.grammar.slice(0, limit);
        const grammarIds = dueItems.map((entry: any) => entry.grammarId);
        const grammars = await Grammar.find({ _id: { $in: grammarIds }, status: 'published' }).lean();
        const grammarById = new Map(grammars.map((grammar: any) => [grammar._id.toString(), grammar]));

        items = dueItems
          .map((entry: any) => {
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
        const dueItems = eligible.conversation.slice(0, limit);
        const conversationIds = dueItems.map((entry: any) => entry.conversationId);
        const conversations = await Conversation.find({ _id: { $in: conversationIds }, status: 'published' }).lean();
        const conversationById = new Map(conversations.map((conversation: any) => [conversation._id.toString(), conversation]));

        items = dueItems
          .map((entry: any) => {
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
      } else if (category === 'reading') {
        const dueItems = eligible.reading.slice(0, limit);
        const readingIds = dueItems.map((entry: any) => entry.readingId);
        const readings = await Reading.find({ _id: { $in: readingIds }, status: 'published' }).lean();
        const readingById = new Map(readings.map((reading: any) => [reading._id.toString(), reading]));

        items = dueItems
          .map((entry: any) => {
            const reading = readingById.get(entry.readingId.toString());
            if (!reading) return null;
            return {
              _id: reading._id.toString(),
              title: reading.title,
              description: reading.translation || '',
              difficulty: reading.difficulty || '',
              reviewExposureCount: entry.reviewExposureCount ?? 0,
            };
          })
          .filter(Boolean);
      } else if (category === 'listening') {
        const dueItems = eligible.listening.slice(0, limit);
        const listeningIds = dueItems.map((entry: any) => entry.contentId);
        const listenings = await Listening.find({ _id: { $in: listeningIds }, status: 'published' }).lean();
        const listeningById = new Map(listenings.map((listening: any) => [listening._id.toString(), listening]));

        items = dueItems
          .map((entry: any) => {
            const listening = listeningById.get(entry.contentId.toString());
            if (!listening) return null;
            const titleText = listening.audioText || '';
            const title = titleText.length > 42 ? `${titleText.slice(0, 42)}...` : titleText;
            return {
              _id: listening._id.toString(),
              title: title || '듣기 문장',
              description: listening.correctAnswer || '',
              duration: '',
              reviewExposureCount: entry.reviewExposureCount ?? 0,
            };
          })
          .filter(Boolean);
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다.');
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
      const category = (req.params.category || req.body.category || '').toString() as CategoryKey;
      const contentId = req.body.contentId ? req.body.contentId.toString() : '';

      const [progress, listeningItems] = await Promise.all([
        UserProgress.findOne({ userId, targetLanguage }),
        category === 'listening'
          ? UserItemProgress.find({ userId, targetLanguage, contentType: 'listening', status: 'active', attemptCount: { $gt: 0 } })
          : Promise.resolve([]),
      ]);

      const now = new Date();
      let touched = 0;

      if (['vocabulary', 'grammar', 'conversation', 'reading'].includes(category)) {
        if (!progress) throw ApiError.notFound('학습 진도를 찾을 수 없습니다.');

        if (category === 'vocabulary') {
          const candidates = (progress.vocabularyStatus || []).filter((entry: any) => {
            if (contentId) return entry.wordId.toString() === contentId;
            return this.isLearnedVocabulary(entry) && this.isUnderExposureLimit(entry.reviewExposureCount);
          });
          for (const entry of candidates) {
            entry.reviewExposureCount = Math.min((entry.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
            entry.lastReviewedAt = now;
            touched += 1;
          }
        }

        if (category === 'grammar') {
          const candidates = (progress.grammarStatus || []).filter((entry: any) => {
            if (contentId) return entry.grammarId.toString() === contentId;
            return this.isLearnedGrammar(entry) && this.isUnderExposureLimit(entry.reviewExposureCount);
          });
          for (const entry of candidates) {
            entry.reviewExposureCount = Math.min((entry.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
            entry.lastReviewedAt = now;
            touched += 1;
          }
        }

        if (category === 'conversation') {
          const candidates = (progress.conversationStatus || []).filter((entry: any) => {
            if (contentId) return entry.conversationId.toString() === contentId;
            return this.isLearnedConversation(entry) && this.isUnderExposureLimit(entry.reviewExposureCount);
          });
          for (const entry of candidates) {
            entry.reviewExposureCount = Math.min((entry.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
            entry.lastReviewedAt = now;
            touched += 1;
          }
        }

        if (category === 'reading') {
          const candidates = (progress.readingStatus || []).filter((entry: any) => {
            if (contentId) return entry.readingId.toString() === contentId;
            return this.isLearnedReading(entry) && this.isUnderExposureLimit(entry.reviewExposureCount);
          });
          for (const entry of candidates) {
            entry.reviewExposureCount = Math.min((entry.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
            entry.lastReviewedAt = now;
            touched += 1;
          }
        }

        await progress.save();
      } else if (category === 'listening') {
        const candidates = (listeningItems || []).filter((entry: any) => {
          if (contentId) return entry.contentId.toString() === contentId;
          return this.isUnderExposureLimit(entry.reviewExposureCount);
        });
        for (const entry of candidates) {
          entry.reviewExposureCount = Math.min((entry.reviewExposureCount ?? 0) + 1, MAX_REVIEW_EXPOSURES);
          entry.lastStudiedAt = now;
          await entry.save();
          touched += 1;
        }
      } else {
        throw ApiError.badRequest('유효하지 않은 카테고리입니다.');
      }

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (profile && touched > 0) {
        profile.xp += XP_CONFIG.REVIEW_COMPLETE;
        await profile.save();
      }

      return ApiResponse.success(
        res,
        {
          processedCount: touched,
          xpEarned: profile && touched > 0 ? XP_CONFIG.REVIEW_COMPLETE : 0,
        },
        '복습 완료',
      );
    } catch (err) {
      next(err);
    }
  };
}
