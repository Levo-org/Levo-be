// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';

export class BadgeController {
  /** 배지 목록 (획득 상태 포함) */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { category } = req.query;

      const filter: Record<string, any> = {};
      if (category) filter.category = category;

      const badges = await Badge.find(filter).sort({ category: 1, 'condition.value': 1 });

      const userBadges = await UserBadge.find({ userId, targetLanguage });
      const earnedSet = new Set(userBadges.map(ub => ub.badgeId.toString()));

      const data = badges.map(badge => ({
        ...badge.toJSON(),
        earned: earnedSet.has(badge._id.toString()),
        earnedAt: userBadges.find(ub => ub.badgeId.toString() === badge._id.toString())?.earnedAt || null,
      }));

      // 카테고리별 그룹핑
      const grouped: Record<string, any[]> = {};
      data.forEach(b => {
        if (!grouped[b.category]) grouped[b.category] = [];
        grouped[b.category].push(b);
      });

      return ApiResponse.success(res, {
        badges: data,
        grouped,
        totalBadges: badges.length,
        earnedCount: userBadges.length,
      });
    } catch (err) { next(err); }
  };

  /** 배지 체크 & 수여 (내부 호출용) */
  static checkAndAward = async (userId: string, targetLanguage: string, stats: any) => {
    const allBadges = await Badge.find();
    const existingBadges = await UserBadge.find({ userId, targetLanguage });
    const earnedIds = new Set(existingBadges.map(ub => ub.badgeId.toString()));
    const newBadges: any[] = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge._id.toString())) continue;

      let earned = false;
      switch (badge.condition.type) {
        case 'streak_days':
          earned = (stats.currentStreak || 0) >= badge.condition.value;
          break;
        case 'words_learned':
          earned = (stats.wordsLearned || 0) >= badge.condition.value;
          break;
        case 'lessons_completed':
          earned = (stats.lessonsCompleted || 0) >= badge.condition.value;
          break;
        case 'quiz_perfect':
          earned = (stats.perfectQuizzes || 0) >= badge.condition.value;
          break;
        case 'total_xp':
          earned = (stats.totalXp || 0) >= badge.condition.value;
          break;
        case 'grammar_mastered':
          earned = (stats.grammarMastered || 0) >= badge.condition.value;
          break;
        case 'conversation_practiced':
          earned = (stats.conversationPracticed || 0) >= badge.condition.value;
          break;
      }

      if (earned) {
        const userBadge = await UserBadge.create({
          userId,
          badgeId: badge._id,
          targetLanguage,
        });
        newBadges.push({ ...badge.toJSON(), earnedAt: userBadge.earnedAt });
      }
    }

    return newBadges;
  };
}
