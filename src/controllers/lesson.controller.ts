// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import Lesson from '@/models/Lesson';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { StreakController } from '@/controllers/streak.controller';

export class LessonController {
  /** GET 레슨 맵 (유닛별 레슨 목록 + 잠금 상태) */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      const lessons = await Lesson.find({ targetLanguage }).sort({ order: 1 }).lean();

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      const completedSet = new Set(
        (progress?.completedLessons || []).map((id) => id.toString()),
      );

      const lessonsWithStatus = lessons.map((lesson) => {
        let status: 'completed' | 'current' | 'locked';

        if (completedSet.has(lesson._id.toString())) {
          status = 'completed';
        } else if (
          !lesson.prerequisiteLessonId ||
          completedSet.has(lesson.prerequisiteLessonId.toString())
        ) {
          status = 'current';
        } else {
          status = 'locked';
        }

        return { ...lesson, status };
      });

      // 유닛별 그룹핑
      const units: Record<number, { unitNumber: number; unitTitle: string; lessons: any[] }> = {};
      for (const lesson of lessonsWithStatus) {
        if (!units[lesson.unitNumber]) {
          units[lesson.unitNumber] = {
            unitNumber: lesson.unitNumber,
            unitTitle: lesson.unitTitle,
            lessons: [],
          };
        }
        units[lesson.unitNumber].lessons.push(lesson);
      }

      const result = Object.values(units).sort((a, b) => a.unitNumber - b.unitNumber);

      return ApiResponse.success(res, result, '레슨 맵 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** GET 레슨 상세 조회 (퀴즈 포함) */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const lesson = await Lesson.findById(id)
        .populate('newWords')
        .populate('grammarPoints')
        .lean();

      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');

      return ApiResponse.success(res, lesson, '레슨 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 레슨 시작 */
  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { id } = req.params;

      const lesson = await Lesson.findById(id);
      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      const completedSet = new Set(
        (progress?.completedLessons || []).map((lid) => lid.toString()),
      );

      // 잠금 확인
      if (
        lesson.prerequisiteLessonId &&
        !completedSet.has(lesson.prerequisiteLessonId.toString())
      ) {
        throw ApiError.lessonLocked();
      }

      // currentLessonId 업데이트
      if (progress) {
        progress.currentLessonId = lesson._id;
        await progress.save();
      } else {
        await UserProgress.create({
          userId,
          targetLanguage,
          currentLessonId: lesson._id,
          completedLessons: [],
        });
      }

      return ApiResponse.success(res, { lessonId: lesson._id }, '레슨 시작');
    } catch (err) {
      next(err);
    }
  };

  /** POST 레슨 완료 */
  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { id } = req.params;
      const { score, correctAnswers, totalQuizzes } = req.body;

      const lesson = await Lesson.findById(id);
      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');

      // UserProgress 업데이트
      let progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) {
        progress = await UserProgress.create({
          userId,
          targetLanguage,
          completedLessons: [],
          currentLessonId: null,
        });
      }

      if (!progress.completedLessons.map((l) => l.toString()).includes(id)) {
        progress.completedLessons.push(id);
      }
      progress.currentLessonId = null;
      await progress.save();

      // XP 지급
      const xpEarned = XP_CONFIG.LESSON_COMPLETE;
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      let leveledUp = false;
      let newLevel = profile?.userLevel || 1;

      if (profile) {
        profile.xp += xpEarned;
        const requiredXp = XP_CONFIG.LEVEL_UP_FORMULA(profile.userLevel);
        if (profile.xp >= requiredXp) {
          profile.userLevel += 1;
          profile.xp -= requiredXp;
          leveledUp = true;
          newLevel = profile.userLevel;
        }
        await profile.save();
      }

      // 코인 지급
      const coinsEarned = lesson.coinReward || COIN_CONFIG.LESSON_COMPLETE;
      const user = await User.findById(userId);
      if (user) {
        user.coins = (user.coins || 0) + coinsEarned;
        await user.save();

        await CoinTransaction.create({
          userId,
          type: 'earn',
          amount: coinsEarned,
          reason: 'lesson_complete',
          balanceAfter: user.coins,
        });
      }

      // 스트릭 기록
      await StreakController.recordStudy(userId.toString(), targetLanguage);

      return ApiResponse.success(res, {
        xpEarned,
        coinsEarned,
        leveledUp,
        newLevel,
        score,
        correctAnswers,
        totalQuizzes,
      }, '레슨 완료');
    } catch (err) {
      next(err);
    }
  };
}
