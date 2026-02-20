import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import User from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import Lesson from '@/models/Lesson';

export class HomeController {
  /** 홈 화면 데이터 */
  getHome = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      const [user, profile, streak, progress] = await Promise.all([
        User.findById(userId),
        UserLanguageProfile.findOne({ userId, targetLanguage }),
        UserStreak.findOne({ userId, targetLanguage }),
        UserProgress.findOne({ userId, targetLanguage }),
      ]);

      if (!profile) {
        return ApiResponse.success(res, { needsOnboarding: true });
      }

      // 오늘 학습 여부
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const todayCompleted = streak?.weeklyRecord?.some(
        (w: any) => new Date(w.date).toISOString().split('T')[0] === todayStr && w.completed
      ) || false;

      // 다음 레슨
      const completedLessonIds = (progress?.completedLessons || []).map(
        (cl: any) => cl.lessonId.toString()
      );

      const nextLesson = await Lesson.findOne({
        targetLanguage,
        _id: { $nin: completedLessonIds },
      }).sort({ unitNumber: 1, lessonNumber: 1 });

      // 복습 필요 항목 수
      const unreviewedWrong = (progress?.wrongAnswers || []).filter((w: any) => !w.reviewedAt).length;

      // 카테고리별 진행률
      const categories = [
        { key: 'vocabulary', emoji: '📝', name: '단어', progress: profile.vocabularyProgress || 0 },
        { key: 'grammar', emoji: '📖', name: '문법', progress: profile.grammarProgress || 0 },
        { key: 'conversation', emoji: '💬', name: '회화', progress: profile.conversationProgress || 0 },
        { key: 'listening', emoji: '🎧', name: '듣기', progress: profile.listeningProgress || 0 },
        { key: 'reading', emoji: '📚', name: '읽기', progress: profile.readingProgress || 0 },
        { key: 'quiz', emoji: '🧩', name: '퀴즈', progress: profile.quizProgress || 0 },
      ];

      return ApiResponse.success(res, {
        user: {
          name: user?.name,
          profileImage: user?.profileImage,
          isPremium: user?.isPremium,
          coins: user?.coins,
        },
        language: {
          targetLanguage,
          level: profile.level,
          userLevel: profile.userLevel,
          xp: profile.xp,
        },
        hearts: {
          current: profile.hearts,
          max: 5,
          isPremium: user?.isPremium,
        },
        streak: {
          current: streak?.currentStreak || 0,
          todayCompleted,
        },
        dailyGoal: {
          minutes: user?.settings?.dailyGoalMinutes || 15,
          completed: todayCompleted,
        },
        nextLesson: nextLesson ? {
          id: nextLesson._id,
          unitNumber: nextLesson.unitNumber,
          unitTitle: nextLesson.unitTitle,
          lessonNumber: nextLesson.lessonNumber,
        } : null,
        reviewCount: unreviewedWrong,
        categories,
      });
    } catch (err) { next(err); }
  };
}
