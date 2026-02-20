// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Lesson from '@/models/Lesson';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';

export class LessonController {
  /** 레슨 목록 (유닛 구조) */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const { unit } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (unit) filter.unitNumber = Number(unit);

      const lessons = await Lesson.find(filter).sort({ unitNumber: 1, lessonNumber: 1 });

      const progress = await UserProgress.findOne({
        userId: req.user!._id,
        targetLanguage,
      });

      const completedSet = new Set(
        (progress?.completedLessons || []).map((cl: any) => cl.lessonId.toString())
      );

      const data = lessons.map((lesson, idx) => {
        const isCompleted = completedSet.has(lesson._id.toString());
        // 첫 번째 레슨 또는 이전 레슨 완료시 잠금 해제
        const prevLesson = idx > 0 ? lessons[idx - 1] : null;
        const isLocked = idx > 0 && prevLesson && !completedSet.has(prevLesson._id.toString());

        return {
          ...lesson.toJSON(),
          isCompleted,
          isLocked,
        };
      });

      // 유닛별 그룹핑
      const units: Record<number, any> = {};
      data.forEach(l => {
        if (!units[l.unitNumber]) {
          units[l.unitNumber] = {
            unitNumber: l.unitNumber,
            unitTitle: l.unitTitle,
            lessons: [],
          };
        }
        units[l.unitNumber].lessons.push(l);
      });

      return ApiResponse.success(res, { units: Object.values(units) });
    } catch (err) { next(err); }
  };

  /** 레슨 상세 (퀴즈 포함) */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');
      return ApiResponse.success(res, lesson);
    } catch (err) { next(err); }
  };

  /** 레슨 시작 */
  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');

      // 잠금 확인 (선행 레슨 완료 여부)
      if (lesson.prerequisiteLessonId) {
        const progress = await UserProgress.findOne({
          userId: req.user!._id,
          targetLanguage: req.user!.activeLanguage,
        });
        const completed = (progress?.completedLessons || []).some(
          (cl: any) => cl.lessonId.toString() === lesson.prerequisiteLessonId?.toString()
        );
        if (!completed) {
          throw ApiError.lessonLocked('선행 레슨을 먼저 완료해주세요.');
        }
      }

      return ApiResponse.success(res, {
        lessonId: lesson._id,
        quizzes: lesson.quizzes,
        xpReward: lesson.xpReward,
        coinReward: lesson.coinReward,
      });
    } catch (err) { next(err); }
  };

  /** 레슨 완료 */
  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const lessonId = req.params.id;
      const { correctCount, totalCount, timeTaken } = req.body;

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw ApiError.notFound('레슨을 찾을 수 없습니다.');

      // 진행도 업데이트
      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      const alreadyCompleted = progress.completedLessons.some(
        (cl: any) => cl.lessonId.toString() === lessonId
      );

      if (!alreadyCompleted) {
        progress.completedLessons.push({
          lessonId: lessonId as any,
          completedAt: new Date(),
          score: Math.round((correctCount / totalCount) * 100),
          timeTaken,
        });
        await progress.save();
      }

      // XP 부여
      const xpEarned = lesson.xpReward || XP_CONFIG.LESSON_COMPLETE;
      const profile = await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { $inc: { xp: xpEarned } },
        { new: true }
      );

      // 코인 부여
      const coinEarned = lesson.coinReward || COIN_CONFIG.LESSON_COMPLETE;
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: coinEarned } },
        { new: true }
      );

      await CoinTransaction.create({
        userId,
        type: 'earn',
        amount: coinEarned,
        reason: 'lesson_complete',
        balanceAfter: user!.coins,
        metadata: { lessonId },
      });

      return ApiResponse.success(res, {
        xpEarned,
        coinEarned,
        totalXp: profile?.xp,
        totalCoins: user?.coins,
        score: Math.round((correctCount / totalCount) * 100),
      });
    } catch (err) { next(err); }
  };
}
