// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import Lesson from '@/models/Lesson';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import UserItemProgress from '@/models/UserItemProgress';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import {
  calculateProfileProgress,
  calculateTodaySummary,
} from '@/services/learningSummary.service';

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
const getKSTDate = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

export class HomeController {
  getPercent = (completed: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((completed / total) * 100);
  };

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

      const profileProgress = calculateProfileProgress(progress || null);
      const todaySummary = calculateTodaySummary(progress || null, todayStudied);

      const effectiveLevel = (req.query.level as string) || profile?.level || 'beginner';

      const [
        vocabularyDocs,
        grammarDocs,
        conversationDocs,
        listeningDocs,
        readingDocs,
      ] = await Promise.all([
        Vocabulary.find({ targetLanguage, level: effectiveLevel, status: 'published' }).select('_id').lean(),
        Grammar.find({ targetLanguage, level: effectiveLevel, status: 'published' }).select('_id').lean(),
        Conversation.find({ targetLanguage, level: effectiveLevel, status: 'published' }).select('_id').lean(),
        Listening.find({ targetLanguage, difficulty: effectiveLevel, status: 'published' }).select('_id').lean(),
        Reading.find({ targetLanguage, difficulty: effectiveLevel, status: 'published' }).select('_id').lean(),
      ]);

      const vocabularyIdSet = new Set(vocabularyDocs.map((item: any) => item._id.toString()));
      const grammarIdSet = new Set(grammarDocs.map((item: any) => item._id.toString()));
      const conversationIdSet = new Set(conversationDocs.map((item: any) => item._id.toString()));
      const listeningIds = listeningDocs.map((item: any) => item._id);
      const readingIds = readingDocs.map((item: any) => item._id);

      const vocabularyCompleted = (progress?.vocabularyStatus || []).filter(
        (entry: any) => entry.status === 'completed' && vocabularyIdSet.has(entry.wordId.toString()),
      ).length;
      const grammarCompleted = (progress?.grammarStatus || []).filter(
        (entry: any) => entry.progress >= 100 && grammarIdSet.has(entry.grammarId.toString()),
      ).length;
      const conversationCompleted = (progress?.conversationStatus || []).filter(
        (entry: any) => entry.completed && conversationIdSet.has(entry.conversationId.toString()),
      ).length;

      const [listeningCompleted, readingCompleted] = await Promise.all([
        listeningIds.length > 0
          ? UserItemProgress.countDocuments({
              userId,
              targetLanguage,
              contentType: 'listening',
              contentId: { $in: listeningIds },
              masteryState: 'completed',
            })
          : 0,
        readingIds.length > 0
          ? UserItemProgress.countDocuments({
              userId,
              targetLanguage,
              contentType: 'reading',
              contentId: { $in: readingIds },
              masteryState: 'completed',
            })
          : 0,
      ]);

      const categories = [
        {
          id: 'vocabulary',
          label: '어휘',
          total: vocabularyDocs.length,
          completed: vocabularyCompleted,
          progress: this.getPercent(vocabularyCompleted, vocabularyDocs.length),
        },
        {
          id: 'grammar',
          label: '문법',
          total: grammarDocs.length,
          completed: grammarCompleted,
          progress: this.getPercent(grammarCompleted, grammarDocs.length),
        },
        {
          id: 'conversation',
          label: '회화',
          total: conversationDocs.length,
          completed: conversationCompleted,
          progress: this.getPercent(conversationCompleted, conversationDocs.length),
        },
        {
          id: 'listening',
          label: '듣기',
          total: listeningDocs.length,
          completed: listeningCompleted,
          progress: this.getPercent(listeningCompleted, listeningDocs.length),
        },
        {
          id: 'reading',
          label: '읽기',
          total: readingDocs.length,
          completed: readingCompleted,
          progress: this.getPercent(readingCompleted, readingDocs.length),
        },
      ];

      const dailyGoalMinutes = user.settings?.dailyGoalMinutes || 10;
      const todayLessonCompletedMinutes = todayStudied
        ? Math.min(dailyGoalMinutes, Math.max(1, todaySummary.completedLessons + todaySummary.learnedWords))
        : 0;
      const todayLessonProgress = this.getPercent(todayLessonCompletedMinutes, dailyGoalMinutes);

      return ApiResponse.success(res, {
        user: {
          name: user.name,
          profileImage: user.profileImage,
          coins: user.coins || 0,
          isPremium: user.isPremium || false,
          settings: {
            dailyGoalMinutes,
          },
        },
        profile: profile ? {
          level: profile.level,
          userLevel: profile.userLevel,
          xp: profile.xp,
          hearts: profile.hearts,
          vocabularyProgress: profileProgress.vocabularyProgress,
          grammarProgress: profileProgress.grammarProgress,
          conversationProgress: profileProgress.conversationProgress,
          listeningProgress: profileProgress.listeningProgress,
          readingProgress: profileProgress.readingProgress,
        } : null,
        hearts: {
          current: profile?.hearts || 5,
          max: 5,
          timeUntilRefill: null,
        },
        streak: streak ? {
          current: streak.currentStreak,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          todayCompleted: todayStudied,
          isInDanger: streak.isInDanger || false,
        } : {
          current: 0,
          currentStreak: 0,
          longestStreak: 0,
          todayCompleted: false,
          isInDanger: false,
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
        todaySummary,
        todayLesson: {
          progress: todayLessonProgress,
          completed: todayLessonCompletedMinutes,
          total: dailyGoalMinutes,
          nextLessonId: nextLesson?._id,
        },
        categories,
        state: streak?.isInDanger ? 'streak-danger' : 'normal',
      }, '홈 화면 조회 성공');
    } catch (err) {
      next(err);
    }
  };
}
