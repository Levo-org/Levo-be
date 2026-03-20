// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import WrongAnswerEntry from '@/models/WrongAnswerEntry';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import {
  calculateCategoryRatio,
  calculateLearningStats,
  calculateProfileProgress,
} from '@/services/learningSummary.service';

export class StatsController {
  /** GET 학습 통계 */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const period = (req.query.period as string) || 'all'; // week | month | all

      // 언어 프로필
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      // 스트릭
      const streak = await UserStreak.findOne({ userId, targetLanguage });

      // 학습 진도
      const progress = await UserProgress.findOne({ userId, targetLanguage });

      const profileProgress = calculateProfileProgress(progress || null);
      const learningStats = calculateLearningStats(progress || null);
      const categoryRatio = calculateCategoryRatio(progress || null);

      const wrongAnswerCount = await WrongAnswerEntry.countDocuments({
        userId,
        targetLanguage,
        remediationStatus: { $in: ['pending', 'in_progress'] },
      });

      return ApiResponse.success(res, {
        profile: {
          level: profile.level,
          userLevel: profile.userLevel,
          xp: profile.xp,
          vocabularyProgress: profileProgress.vocabularyProgress,
          grammarProgress: profileProgress.grammarProgress,
          conversationProgress: profileProgress.conversationProgress,
          listeningProgress: profileProgress.listeningProgress,
          readingProgress: profileProgress.readingProgress,
        },
        streak: streak ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastStudyDate: streak.lastStudyDate,
          weeklyRecord: streak.weeklyRecord,
        } : {
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          weeklyRecord: [],
        },
        learning: { ...learningStats, wrongAnswers: wrongAnswerCount },
        categoryRatio,
        period,
      }, '학습 통계 조회 성공');
    } catch (err) {
      next(err);
    }
  };
}
