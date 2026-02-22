// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserStreak from '@/models/UserStreak';
import UserLanguageProfile from '@/models/UserLanguageProfile';
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
  /** GET 스트릭 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;

      let streak = await UserStreak.findOne({ userId, targetLanguage });
      if (!streak) {
        streak = await UserStreak.create({
          userId,
          targetLanguage,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          weeklyRecord: {},
          streakShields: 0,
          shieldUsedDates: [],
        });
      }

      const today = getKSTDate();
      const yesterday = getKSTYesterday();

      // 스트릭 리셋 여부 확인: 마지막 학습일이 오늘도 어제도 아닌 경우
      if (
        streak.lastStudyDate &&
        streak.lastStudyDate !== today &&
        streak.lastStudyDate !== yesterday
      ) {
        // 쉴드가 없으면 스트릭 초기화
        if (streak.streakShields <= 0) {
          streak.currentStreak = 0;
          await streak.save();
        }
      }

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

  /** POST 스트릭 쉴드 사용 */
  useShield = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;

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
        weeklyRecord: {},
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

    // 주간 기록 업데이트 (요일 키: 0=일 ~ 6=토)
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dayOfWeek = kstNow.getDay().toString();

    if (!streak.weeklyRecord) streak.weeklyRecord = {};
    streak.weeklyRecord[dayOfWeek] = true;

    await streak.save();
  };
}
