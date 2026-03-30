// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';
import UserStreak from '@/models/UserStreak';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserProgress from '@/models/UserProgress';
import UserItemProgress from '@/models/UserItemProgress';
import User from '@/models/User';
import { ApiResponse } from '@/utils/ApiResponse';

const CATEGORY_MAP: Record<string, 'all' | 'streak' | 'learning' | 'level' | 'special'> = {
  all: 'all',
  전체: 'all',
  streak: 'streak',
  스트릭: 'streak',
  learning: 'learning',
  학습: 'learning',
  level: 'level',
  레벨: 'level',
  quiz: 'learning',
  quizzes: 'learning',
  퀴즈: 'learning',
  special: 'special',
  특별: 'special',
};

const normalizeCategory = (category: unknown): 'all' | 'streak' | 'learning' | 'level' | 'special' => {
  if (typeof category !== 'string') return 'all';
  return CATEGORY_MAP[category] || 'all';
};

export class BadgeController {
  /** GET 전체 뱃지 목록 + 사용자 달성 상태 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id.toString();
      const targetLanguage = (typeof req.query.targetLanguage === 'string' && req.query.targetLanguage)
        ? req.query.targetLanguage
        : req.user.activeLanguage;
      const category = normalizeCategory(req.query.category);

      await BadgeController.checkAndAward(userId, targetLanguage);

      const badgeQuery = category === 'all' ? {} : { category };
      const allBadgesRaw = await Badge.find(badgeQuery).sort({ createdAt: 1 }).lean();
      const dedupedByName = new Map<string, any>();

      for (const badge of allBadgesRaw) {
        if (!badge?.name) continue;
        if (!dedupedByName.has(badge.name)) {
          dedupedByName.set(badge.name, badge);
        }
      }

      const allBadges = Array.from(dedupedByName.values());
      const badgeIds = allBadges.map((badge) => badge._id);
      const userBadges = await UserBadge.find({ userId, targetLanguage, badgeId: { $in: badgeIds } }).lean();

      const achievedMap = new Map(userBadges.map((ub: any) => [ub.badgeId.toString(), ub]));

      const badges = allBadges.map((badge: any) => {
        const matched = achievedMap.get(badge._id.toString());
        const achieved = !!matched;

        return {
          ...badge,
          achieved,
          earned: achieved,
          achievedAt: matched?.achievedAt || null,
          earnedAt: matched?.achievedAt || null,
          icon: badge.emoji,
        };
      });

      const achievedCount = badges.filter((badge: any) => badge.achieved).length;
      const totalCount = badges.length;

      return ApiResponse.success(res, { badges, achievedCount, totalCount }, '뱃지 목록 조회 성공');
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
      const progress = await UserProgress.findOne({ userId, targetLanguage }).lean();
      const user = await User.findById(userId).select('coins').lean();
      const languageProfilesCount = await UserLanguageProfile.countDocuments({ userId });
      const listeningCompleted = await UserItemProgress.countDocuments({
        userId,
        targetLanguage,
        contentType: 'listening',
        masteryState: 'completed',
      });

      const vocabularyStatus = progress?.vocabularyStatus || [];
      const grammarStatus = progress?.grammarStatus || [];
      const conversationStatus = progress?.conversationStatus || [];
      const readingStatus = progress?.readingStatus || [];

      const wordsLearned = vocabularyStatus.filter((entry: any) => entry?.status === 'completed').length;
      const lessonsCompleted = Array.isArray(progress?.completedLessons) ? progress.completedLessons.length : 0;
      const grammarCompleted = grammarStatus.filter((entry: any) => Number(entry?.progress) >= 100).length;
      const conversationsCompleted = conversationStatus.filter((entry: any) => !!entry?.completed).length;
      const readingCompleted = readingStatus.filter((entry: any) => Number(entry?.progress) >= 100).length;
      const quizzesCorrect = [
        ...vocabularyStatus,
        ...grammarStatus,
        ...conversationStatus,
        ...readingStatus,
      ].reduce((sum: number, entry: any) => sum + (Number(entry?.correctCount) || 0), 0);
      const reviewCompleted = [
        ...vocabularyStatus,
        ...grammarStatus,
        ...conversationStatus,
        ...readingStatus,
      ].reduce((sum: number, entry: any) => sum + (Number(entry?.reviewExposureCount) || 0), 0);

      const todayDate = new Date();
      const kstNow = new Date(todayDate.getTime() + 9 * 60 * 60 * 1000);
      const kstHour = kstNow.getUTCHours();
      const studiedAtAfterMidnight = [
        ...vocabularyStatus,
        ...grammarStatus,
        ...conversationStatus,
        ...readingStatus,
      ].some((entry: any) => {
        const raw = entry?.lastReviewedAt || entry?.lastStudiedAt;
        if (!raw) return false;
        const date = new Date(raw);
        const hour = new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
        return hour < 6;
      });

      const newBadges: any[] = [];

      for (const badge of allBadges) {
        if (achievedIds.has(badge._id.toString())) continue;

        let qualified = false;
        const conditionType = badge.condition?.type;
        const conditionValue = Number(badge.condition?.value) || 0;

        switch (conditionType) {
          case 'streak_days':
            qualified = (streak?.currentStreak || 0) >= conditionValue;
            break;
          case 'words_learned':
            qualified = wordsLearned >= conditionValue;
            break;
          case 'lessons_completed':
            qualified = lessonsCompleted >= conditionValue;
            break;
          case 'quizzes_correct':
            qualified = quizzesCorrect >= conditionValue;
            break;
          case 'grammar_completed':
            qualified = grammarCompleted >= conditionValue;
            break;
          case 'conversations_completed':
            qualified = conversationsCompleted >= conditionValue;
            break;
          case 'listening_completed':
            qualified = listeningCompleted >= conditionValue;
            break;
          case 'reading_completed':
            qualified = readingCompleted >= conditionValue;
            break;
          case 'user_level':
            qualified = (profile?.userLevel || 1) >= conditionValue;
            break;
          case 'total_xp':
            qualified = (profile?.xp || 0) >= conditionValue;
            break;
          case 'account_created':
            qualified = true;
            break;
          case 'reviews_completed':
            qualified = reviewCompleted >= conditionValue;
            break;
          case 'study_after_midnight':
            qualified = studiedAtAfterMidnight || kstHour < 6;
            break;
          case 'study_before_6am':
            qualified = studiedAtAfterMidnight || kstHour < 6;
            break;
          case 'languages_studying':
            qualified = languageProfilesCount >= conditionValue;
            break;
          case 'coins_earned':
            qualified = (user?.coins || 0) >= conditionValue;
            break;
          default:
            qualified = false;
            break;
        }

        if (qualified) {
          try {
            const created = await UserBadge.create({
              userId,
              targetLanguage,
              badgeId: badge._id,
              achievedAt: new Date(),
            });
            newBadges.push({ ...badge, achievedAt: created.achievedAt });
            achievedIds.add(badge._id.toString());
          } catch {
            continue;
          }
        }
      }

      return newBadges;
    } catch (err) {
      console.error('Badge checkAndAward error:', err);
      return [];
    }
  };
}
