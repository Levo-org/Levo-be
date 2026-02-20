// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import UserStreak from '@/models/UserStreak';
import UserLanguageProfile from '@/models/UserLanguageProfile';

export class StreakController {
  /** 스트릭 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      let streak = await UserStreak.findOne({ userId, targetLanguage });
      if (!streak) {
        streak = await UserStreak.create({ userId, targetLanguage });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const dayOfWeek = today.getDay(); // 0=일 ~ 6=토
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);

      // 이번 주 기록
      const weeklyRecord = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        weeklyRecord.push({
          date: dateStr,
          completed: streak.weeklyRecord?.some(
            (w: any) => new Date(w.date).toISOString().split('T')[0] === dateStr && w.completed
          ) || false,
        });
      }

      // 스트릭 유지 확인 (어제 학습 안 했으면 리셋, 단 쉴드 사용 가능)
      const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
      let isActive = false;
      if (lastStudy) {
        lastStudy.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastStudyStr = lastStudy.toISOString().split('T')[0];
        isActive = lastStudyStr === todayStr || lastStudyStr === yesterdayStr;
      }

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });

      return ApiResponse.success(res, {
        currentStreak: isActive ? streak.currentStreak : 0,
        longestStreak: streak.longestStreak,
        lastStudyDate: streak.lastStudyDate,
        weeklyRecord,
        streakShields: profile?.streakShields || 0,
        todayCompleted: streak.weeklyRecord?.some(
          (w: any) => new Date(w.date).toISOString().split('T')[0] === todayStr && w.completed
        ) || false,
      });
    } catch (err) { next(err); }
  };

  /** 스트릭 쉴드 사용 */
  useShield = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      if ((profile.streakShields || 0) <= 0) {
        throw ApiError.badRequest('스트릭 쉴드가 없습니다.');
      }

      const streak = await UserStreak.findOne({ userId, targetLanguage });
      if (!streak) throw ApiError.notFound('스트릭을 찾을 수 없습니다.');

      // 쉴드 사용
      profile.streakShields = (profile.streakShields || 0) - 1;
      await profile.save();

      // 어제 날짜로 쉴드 사용 기록
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (!streak.shieldUsedDates) streak.shieldUsedDates = [];
      streak.shieldUsedDates.push(yesterday);
      streak.lastStudyDate = yesterday; // 쉴드로 스트릭 유지
      await streak.save();

      return ApiResponse.success(res, {
        streakShields: profile.streakShields,
        currentStreak: streak.currentStreak,
        message: '스트릭 쉴드를 사용했습니다!',
      });
    } catch (err) { next(err); }
  };

  /** 스트릭 기록 (내부 호출용) - 학습 완료 시 호출 */
  static recordStudy = async (userId: string, targetLanguage: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let streak = await UserStreak.findOne({ userId, targetLanguage });
    if (!streak) {
      streak = await UserStreak.create({ userId, targetLanguage });
    }

    // 오늘 이미 기록됨
    const alreadyRecorded = streak.weeklyRecord?.some(
      (w: any) => new Date(w.date).toISOString().split('T')[0] === todayStr && w.completed
    );

    if (alreadyRecorded) return streak;

    // 주간 기록 추가
    if (!streak.weeklyRecord) streak.weeklyRecord = [];
    streak.weeklyRecord.push({ date: today, completed: true });

    // 스트릭 계산
    const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastStudyStr = lastStudy.toISOString().split('T')[0];

      if (lastStudyStr === yesterdayStr) {
        streak.currentStreak += 1;
      } else if (lastStudyStr !== todayStr) {
        streak.currentStreak = 1; // 리셋
      }
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastStudyDate = today;
    await streak.save();

    return streak;
  };
}
