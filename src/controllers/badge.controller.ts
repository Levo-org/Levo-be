// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';
import UserStreak from '@/models/UserStreak';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserProgress from '@/models/UserProgress';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

export class BadgeController {
  /** GET 전체 뱃지 목록 + 사용자 달성 상태 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;

      const allBadges = await Badge.find().lean();
      const userBadges = await UserBadge.find({ userId, targetLanguage }).lean();

      const achievedIds = new Set(userBadges.map((ub: any) => ub.badgeId.toString()));

      const badges = allBadges.map((badge: any) => ({
        ...badge,
        achieved: achievedIds.has(badge._id.toString()),
        achievedAt: userBadges.find(
          (ub: any) => ub.badgeId.toString() === badge._id.toString()
        )?.achievedAt || null,
      }));

      return ApiResponse.success(res, { badges }, '뱃지 목록 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 조건 확인 후 뱃지 자동 부여 (내부 호출) */
  static checkAndAward = async (userId: string, targetLanguage: string) => {
    try {
      const allBadges = await Badge.find().lean();
      const userBadges = await UserBadge.find({ userId, targetLanguage }).lean();
      const achievedIds = new Set(userBadges.map((ub: any) => ub.badgeId.toString()));

      const streak = await UserStreak.findOne({ userId, targetLanguage }).lean();
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage }).lean();
      const progress = await UserProgress.find({ userId, targetLanguage }).lean();

      // 학습 통계 집계
      const wordsLearned = progress.filter(
        (p: any) => p.contentType === 'vocabulary' && p.status === 'completed'
      ).length;
      const lessonsCompleted = progress.filter(
        (p: any) => p.status === 'completed'
      ).length;

      const newBadges: any[] = [];

      for (const badge of allBadges) {
        if (achievedIds.has(badge._id.toString())) continue;

        let qualified = false;

        switch (badge.category) {
          case 'streak': {
            const currentStreak = streak?.currentStreak ?? 0;
            if (badge.condition?.streakDays && currentStreak >= badge.condition.streakDays) {
              qualified = true;
            }
            break;
          }

          case 'learning': {
            if (badge.condition?.wordsLearned && wordsLearned >= badge.condition.wordsLearned) {
              qualified = true;
            }
            if (badge.condition?.lessonsCompleted && lessonsCompleted >= badge.condition.lessonsCompleted) {
              qualified = true;
            }
            break;
          }

          case 'level': {
            const userLevel = profile?.userLevel ?? 1;
            if (badge.condition?.level && userLevel >= badge.condition.level) {
              qualified = true;
            }
            break;
          }

          case 'special': {
            // 특수 뱃지는 별도 로직으로 처리
            break;
          }
        }

        if (qualified) {
          const created = await UserBadge.create({
            userId,
            targetLanguage,
            badgeId: badge._id,
            achievedAt: new Date(),
          });
          newBadges.push({ ...badge, achievedAt: created.achievedAt });
        }
      }

      return newBadges;
    } catch (err) {
      console.error('Badge checkAndAward error:', err);
      return [];
    }
  };
}
