// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import Lesson from '@/models/Lesson';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
const getKSTDate = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

export class HomeController {
  /** GET 홈 화면 데이터 */
  getHome = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      // 병렬 조회
      const [user, profile, streak, progress] = await Promise.all([
        User.findById(userId).lean(),
        UserLanguageProfile.findOne({ userId, targetLanguage }).lean(),
        UserStreak.findOne({ userId, targetLanguage }).lean(),
        UserProgress.findOne({ userId, targetLanguage }).lean(),
      ]);

      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      // 다음 학습할 레슨
      let nextLesson = null;
      if (progress?.currentLessonId) {
        nextLesson = await Lesson.findById(progress.currentLessonId).lean();
      }

      // currentLessonId가 없으면 첫 미완료 레슨 추천
      if (!nextLesson) {
        const completedSet = new Set(
          (progress?.completedLessons || []).map((id) => id.toString()),
        );
        const allLessons = await Lesson.find({ targetLanguage }).sort({ order: 1 }).lean();
        nextLesson = allLessons.find(
          (l) => !completedSet.has(l._id.toString()),
        ) || null;
      }

      const today = getKSTDate();
      const todayStudied = streak?.lastStudyDate === today;

      return ApiResponse.success(res, {
        user: {
          name: user.name,
          profileImage: user.profileImage,
          coins: user.coins || 0,
          isPremium: user.isPremium || false,
        },
        profile: profile ? {
          level: profile.level,
          userLevel: profile.userLevel,
          xp: profile.xp,
          hearts: profile.hearts,
          vocabularyProgress: profile.vocabularyProgress,
          grammarProgress: profile.grammarProgress,
          conversationProgress: profile.conversationProgress,
          listeningProgress: profile.listeningProgress,
          readingProgress: profile.readingProgress,
        } : null,
        streak: streak ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          todayCompleted: todayStudied,
        } : {
          currentStreak: 0,
          longestStreak: 0,
          todayCompleted: false,
        },
        nextLesson: nextLesson ? {
          _id: nextLesson._id,
          unitNumber: nextLesson.unitNumber,
          unitTitle: nextLesson.unitTitle,
          lessonNumber: nextLesson.lessonNumber,
          lessonTitle: nextLesson.lessonTitle,
          estimatedMinutes: nextLesson.estimatedMinutes,
          xpReward: nextLesson.xpReward,
        } : null,
        todaySummary: {
          studied: todayStudied,
          completedLessons: progress?.completedLessons?.length || 0,
          learnedWords: (progress?.vocabularyStatus || []).filter(
            (v) => v.status === 'completed',
          ).length,
        },
      }, '홈 화면 조회 성공');
    } catch (err) {
      next(err);
    }
  };
}
