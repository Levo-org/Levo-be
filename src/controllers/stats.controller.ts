import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserProgress from '@/models/UserProgress';
import UserStreak from '@/models/UserStreak';
import UserBadge from '@/models/UserBadge';
import CoinTransaction from '@/models/CoinTransaction';
import Lesson from '@/models/Lesson';

export class StatsController {
  /** 통계 조회 */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { period = 'weekly' } = req.query; // weekly, monthly, all

      const [profile, progress, streak, badgeCount, lessons] = await Promise.all([
        UserLanguageProfile.findOne({ userId, targetLanguage }),
        UserProgress.findOne({ userId, targetLanguage }),
        UserStreak.findOne({ userId, targetLanguage }),
        UserBadge.countDocuments({ userId, targetLanguage }),
        Lesson.countDocuments({ targetLanguage }),
      ]);

      if (!profile || !progress) {
        return ApiResponse.success(res, { message: '학습 데이터가 없습니다.' });
      }

      // 학습 항목 통계
      const vocabularyMastered = progress.vocabularyStatus.filter((v: any) => v.mastered).length;
      const vocabularyStudied = progress.vocabularyStatus.length;
      const grammarMastered = progress.grammarStatus.filter((g: any) => g.mastered).length;
      const grammarStudied = progress.grammarStatus.length;
      const conversationPracticed = progress.conversationStatus.length;
      const lessonsCompleted = progress.completedLessons.length;
      const wrongAnswersTotal = progress.wrongAnswers.length;
      const wrongAnswersReviewed = progress.wrongAnswers.filter((w: any) => w.reviewedAt).length;

      // 기간별 필터
      let periodStart: Date | null = null;
      const now = new Date();
      if (period === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
      } else if (period === 'monthly') {
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 1);
      }

      // 최근 코인 거래
      const coinFilter: Record<string, any> = { userId };
      if (periodStart) coinFilter.createdAt = { $gte: periodStart };

      const [coinsEarned, coinsSpent] = await Promise.all([
        CoinTransaction.aggregate([
          { $match: { ...coinFilter, type: 'earn' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        CoinTransaction.aggregate([
          { $match: { ...coinFilter, type: 'spend' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      // 학습 진행률
      const totalLessons = lessons || 1;
      const overallProgress = Math.round((lessonsCompleted / totalLessons) * 100);

      return ApiResponse.success(res, {
        period,
        level: profile.level,
        userLevel: profile.userLevel,
        xp: profile.xp,
        streak: {
          current: streak?.currentStreak || 0,
          longest: streak?.longestStreak || 0,
        },
        learning: {
          vocabulary: { studied: vocabularyStudied, mastered: vocabularyMastered },
          grammar: { studied: grammarStudied, mastered: grammarMastered },
          conversation: { practiced: conversationPracticed },
          lessons: { completed: lessonsCompleted, total: totalLessons },
          overallProgress,
        },
        review: {
          wrongAnswers: wrongAnswersTotal,
          reviewed: wrongAnswersReviewed,
          pending: wrongAnswersTotal - wrongAnswersReviewed,
        },
        badges: badgeCount,
        coins: {
          earned: coinsEarned[0]?.total || 0,
          spent: coinsSpent[0]?.total || 0,
        },
        categoryProgress: {
          vocabulary: profile.vocabularyProgress || 0,
          grammar: profile.grammarProgress || 0,
          conversation: profile.conversationProgress || 0,
          listening: profile.listeningProgress || 0,
          reading: profile.readingProgress || 0,
          quiz: profile.quizProgress || 0,
        },
      });
    } catch (err) { next(err); }
  };
}
