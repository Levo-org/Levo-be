// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

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

      // 완료 통계
      const completedLessons = progress?.completedLessons?.length || 0;
      const learnedWords = (progress?.vocabularyStatus || []).filter(
        (v) => v.status === 'completed',
      ).length;
      const learningWords = (progress?.vocabularyStatus || []).filter(
        (v) => v.status === 'learning',
      ).length;
      const completedGrammar = (progress?.grammarStatus || []).filter(
        (g) => g.progress >= 100,
      ).length;
      const totalGrammar = progress?.grammarStatus?.length || 0;
      const completedConversations = (progress?.conversationStatus || []).filter(
        (c) => c.completed,
      ).length;
      const totalConversations = progress?.conversationStatus?.length || 0;

      // 카테고리별 학습 비율
      const totalItems = (progress?.vocabularyStatus?.length || 0)
        + (progress?.grammarStatus?.length || 0)
        + (progress?.conversationStatus?.length || 0);

      const categoryRatio = {
        vocabulary: totalItems > 0
          ? Math.round(((progress?.vocabularyStatus?.length || 0) / totalItems) * 100)
          : 0,
        grammar: totalItems > 0
          ? Math.round(((progress?.grammarStatus?.length || 0) / totalItems) * 100)
          : 0,
        conversation: totalItems > 0
          ? Math.round(((progress?.conversationStatus?.length || 0) / totalItems) * 100)
          : 0,
      };

      return ApiResponse.success(res, {
        profile: {
          level: profile.level,
          userLevel: profile.userLevel,
          xp: profile.xp,
          vocabularyProgress: profile.vocabularyProgress,
          grammarProgress: profile.grammarProgress,
          conversationProgress: profile.conversationProgress,
          listeningProgress: profile.listeningProgress,
          readingProgress: profile.readingProgress,
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
        learning: {
          completedLessons,
          learnedWords,
          learningWords,
          completedGrammar,
          totalGrammar,
          completedConversations,
          totalConversations,
          wrongAnswers: progress?.wrongAnswers?.length || 0,
        },
        categoryRatio,
        period,
      }, '학습 통계 조회 성공');
    } catch (err) {
      next(err);
    }
  };
}
