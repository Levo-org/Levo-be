// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';
import WrongAnswerEntry from '@/models/WrongAnswerEntry';
import { ApiResponse } from '@/utils/ApiResponse';
import {
  calculateCategoryRatio,
  calculateLearningStats,
  calculateProfileProgress,
} from '@/services/learningSummary.service';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getKSTDateByOffset = (offsetDays: number) => {
  const shifted = new Date(Date.now() + KST_OFFSET_MS + offsetDays * DAY_MS);
  return shifted.toISOString().split('T')[0];
};

const toRecentWeeklyRecord = (weeklyRecord: any[] = []) => {
  const map = new Map<string, { date: string; completed: boolean; minutesStudied: number }>();

  for (const entry of weeklyRecord || []) {
    if (!entry?.date) continue;
    map.set(entry.date, {
      date: entry.date,
      completed: !!entry.completed,
      minutesStudied: Math.max(0, Number(entry.minutesStudied) || 0),
    });
  }

  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
};

const buildWeeklyXp = (
  period: 'week' | 'month' | 'all',
  weeklyRecord: Array<{ date: string; completed: boolean; minutesStudied: number }>,
) => {
  const recordMap = new Map(weeklyRecord.map((entry) => [entry.date, entry]));

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, idx) => {
      const offset = idx - 6;
      const date = getKSTDateByOffset(offset);
      const item = recordMap.get(date);
      const dayIndex = new Date(`${date}T00:00:00.000Z`).getUTCDay();
      return {
        day: DAY_NAMES[dayIndex],
        xp: Math.max(0, Number(item?.minutesStudied) || 0),
      };
    });
  }

  return weeklyRecord.slice(-7).map((entry) => ({
    day: entry.date.slice(5).replace('-', '/'),
    xp: Math.max(0, Number(entry.minutesStudied) || 0),
  }));
};

const calculateAccuracy = (progress: any) => {
  if (!progress) return 0;

  const sumCounts = (items: any[] = []) => items.reduce(
    (acc, item) => ({
      correct: acc.correct + Math.max(0, Number(item?.correctCount) || 0),
      wrong: acc.wrong + Math.max(0, Number(item?.wrongCount) || 0),
    }),
    { correct: 0, wrong: 0 },
  );

  const vocab = sumCounts(progress.vocabularyStatus || []);
  const grammar = sumCounts(progress.grammarStatus || []);
  const conversation = sumCounts(progress.conversationStatus || []);
  const reading = sumCounts(progress.readingStatus || []);

  const correct = vocab.correct + grammar.correct + conversation.correct + reading.correct;
  const wrong = vocab.wrong + grammar.wrong + conversation.wrong + reading.wrong;
  const total = correct + wrong;

  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
};

const calculateQuizzesCompleted = (progress: any) => {
  if (!progress) return 0;

  const grammarSolved = (progress.grammarStatus || []).reduce(
    (acc: number, entry: any) => acc + (Array.isArray(entry?.solvedQuizIndexes) ? entry.solvedQuizIndexes.length : 0),
    0,
  );

  const readingSolved = (progress.readingStatus || []).reduce(
    (acc: number, entry: any) => acc + (Array.isArray(entry?.solvedQuizIndexes) ? entry.solvedQuizIndexes.length : 0),
    0,
  );

  return grammarSolved + readingSolved;
};

export class StatsController {
  /** GET 학습 통계 */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const rawPeriod = (req.query.period as string) || 'all';
      const period: 'week' | 'month' | 'all' = rawPeriod === 'week' || rawPeriod === 'month' ? rawPeriod : 'all';

      // 언어 프로필
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });

      // 스트릭
      const streak = await UserStreak.findOne({ userId, targetLanguage });

      // 학습 진도
      const progress = await UserProgress.findOne({ userId, targetLanguage });

      const profileProgress = calculateProfileProgress(progress || null);
      const learningStats = calculateLearningStats(progress || null);
      const categoryRatio = calculateCategoryRatio(progress || null);
      const normalizedWeeklyRecord = toRecentWeeklyRecord(streak?.weeklyRecord || []);
      const weeklyXp = buildWeeklyXp(period, normalizedWeeklyRecord);
      const totalStudyMinutes = weeklyXp.reduce((sum, item) => sum + (Number(item.xp) || 0), 0);
      const accuracy = calculateAccuracy(progress || null);
      const quizzesCompleted = calculateQuizzesCompleted(progress || null);

      const wrongAnswerCount = await WrongAnswerEntry.countDocuments({
        userId,
        targetLanguage,
        remediationStatus: { $in: ['pending', 'in_progress'] },
      });

      return ApiResponse.success(res, {
        profile: {
          level: profile?.level || 'beginner',
          userLevel: profile?.userLevel || 1,
          xp: profile?.xp || 0,
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
          weeklyRecord: normalizedWeeklyRecord,
        } : {
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          weeklyRecord: [],
        },
        learning: { ...learningStats, wrongAnswers: wrongAnswerCount },
        weeklyXp,
        totalStudyMinutes,
        accuracy,
        lessonsCompleted: learningStats.completedLessons,
        wordsLearned: learningStats.learnedWords,
        quizzesCompleted,
        categoryRatio,
        period,
      }, '학습 통계 조회 성공');
    } catch (err) {
      next(err);
    }
  };
}
