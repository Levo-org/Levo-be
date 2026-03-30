// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserStreak from '@/models/UserStreak';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
const getKSTDate = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

/** KST 기준 어제 날짜 (YYYY-MM-DD) */
const getKSTYesterday = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

export class StreakController {
  private static resolveTargetLanguage = (req: Request): string => {
    const queryLanguage = typeof req.query.targetLanguage === 'string' ? req.query.targetLanguage : '';
    const userLanguage = typeof req.user?.activeLanguage === 'string' ? req.user.activeLanguage : '';
    return queryLanguage || userLanguage || 'en';
  };

  private static getRecentWeeklyRecord = (weeklyRecord: Array<{ date: string; completed: boolean; minutesStudied: number }> = []) => {
    const deduped = new Map<string, { date: string; completed: boolean; minutesStudied: number }>();

    for (const entry of weeklyRecord) {
      if (!entry?.date) continue;
      deduped.set(entry.date, {
        date: entry.date,
        completed: !!entry.completed,
        minutesStudied: Number(entry.minutesStudied) || 0,
      });
    }

    return Array.from(deduped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  };

  private static normalizeStreakForToday = async (streak: any) => {
    if (!streak) return;

    const today = getKSTDate();
    const yesterday = getKSTYesterday();

    if (streak.lastStudyDate && streak.lastStudyDate !== today && streak.lastStudyDate !== yesterday) {
      streak.currentStreak = 0;
    }

    streak.weeklyRecord = StreakController.getRecentWeeklyRecord(streak.weeklyRecord || []);
    await streak.save();
  };

  private static upsertDailyWeeklyRecord = (
    weeklyRecord: Array<{ date: string; completed: boolean; minutesStudied: number }>,
    date: string,
    completed: boolean,
    minutesStudied: number,
  ) => {
    const map = new Map<string, { date: string; completed: boolean; minutesStudied: number }>();
    for (const entry of weeklyRecord || []) {
      if (!entry?.date) continue;
      map.set(entry.date, {
        date: entry.date,
        completed: !!entry.completed,
        minutesStudied: Number(entry.minutesStudied) || 0,
      });
    }

    const existing = map.get(date);
    map.set(date, {
      date,
      completed,
      minutesStudied: Math.max(Number(minutesStudied) || 0, Number(existing?.minutesStudied) || 0),
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  };

  /** GET 스트릭 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = StreakController.resolveTargetLanguage(req);

      let streak = await UserStreak.findOne({ userId, targetLanguage });
      if (!streak) {
        streak = await UserStreak.create({
          userId,
          targetLanguage,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          weeklyRecord: [],
          streakShields: 0,
          shieldUsedDates: [],
        });
      }

      await StreakController.normalizeStreakForToday(streak);

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });

      return ApiResponse.success(res, {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastStudyDate: streak.lastStudyDate,
        weeklyRecord: streak.weeklyRecord,
        streakShields: profile?.streakShields ?? 0,
      }, '스트릭 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  syncDailyGoalProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = StreakController.resolveTargetLanguage(req);
      const minutesStudied = Math.max(0, Number(req.body?.minutesStudied) || 0);

      const user = await User.findById(userId).select('settings.dailyGoalMinutes').lean();
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      const dailyGoalMinutes = Math.max(1, user.settings?.dailyGoalMinutes || 10);
      const today = getKSTDate();
      const yesterday = getKSTYesterday();
      const todayCompleted = minutesStudied >= dailyGoalMinutes;

      let streak = await UserStreak.findOne({ userId, targetLanguage });
      if (!streak) {
        streak = await UserStreak.create({
          userId,
          targetLanguage,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: '',
          weeklyRecord: [],
          shieldUsedDates: [],
        });
      }

      await StreakController.normalizeStreakForToday(streak);

      const shouldIncrement = todayCompleted && streak.lastStudyDate !== today;
      if (shouldIncrement) {
        if (streak.lastStudyDate === yesterday) {
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }

        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        streak.lastStudyDate = today;
      }

      streak.weeklyRecord = StreakController.upsertDailyWeeklyRecord(
        streak.weeklyRecord || [],
        today,
        todayCompleted,
        minutesStudied,
      );

      await streak.save();

      return ApiResponse.success(res, {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        todayCompleted,
        dailyGoalMinutes,
        minutesStudied,
      }, '일일 목표 스트릭 동기화 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 스트릭 쉴드 사용 */
  useShield = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = StreakController.resolveTargetLanguage(req);

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      if (profile.streakShields <= 0) {
        throw ApiError.badRequest('사용 가능한 스트릭 쉴드가 없습니다.');
      }

      profile.streakShields -= 1;
      await profile.save();

      const streak = await UserStreak.findOne({ userId, targetLanguage });
      if (streak) {
        const today = getKSTDate();
        if (!streak.shieldUsedDates) streak.shieldUsedDates = [];
        streak.shieldUsedDates.push(today);
        await streak.save();
      }

      return ApiResponse.success(res, {
        streakShields: profile.streakShields,
      }, '스트릭 쉴드 사용 완료');
    } catch (err) {
      next(err);
    }
  };

  /** 학습 활동 완료 시 내부적으로 호출 */
  static recordStudy = async (userId: string, targetLanguage: string) => {
    const today = getKSTDate();

    let streak = await UserStreak.findOne({ userId, targetLanguage });
    if (!streak) {
      streak = await UserStreak.create({
        userId,
        targetLanguage,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        weeklyRecord: [],
        streakShields: 0,
        shieldUsedDates: [],
      });
    }

    if (streak.lastStudyDate !== today) {
      streak.currentStreak += 1;

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }

      streak.lastStudyDate = today;
    }

    streak.weeklyRecord = StreakController.upsertDailyWeeklyRecord(
      streak.weeklyRecord || [],
      today,
      false,
      0,
    );

    await streak.save();
  };
}
