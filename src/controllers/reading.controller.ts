// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Reading from '@/models/Reading';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ReadingController {
  /** 읽기 목록 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const { level, page = '1', limit = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [items, total] = await Promise.all([
        Reading.find(filter)
          .select('-content -quizzes')
          .sort({ order: 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Reading.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, items, total, pageNum, limitNum);
    } catch (err) { next(err); }
  };

  /** 읽기 상세 (본문 + 퀴즈) */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Reading.findById(req.params.id);
      if (!item) throw ApiError.notFound('읽기를 찾을 수 없습니다.');
      return ApiResponse.success(res, item);
    } catch (err) { next(err); }
  };

  /** 읽기 퀴즈 정답 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const readingId = req.params.id;
      const { quizIndex, answer, isCorrect } = req.body;

      const reading = await Reading.findById(readingId);
      if (!reading) throw ApiError.notFound('읽기를 찾을 수 없습니다.');

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      if (!isCorrect) {
        const quiz = reading.quizzes[quizIndex];
        progress.wrongAnswers.push({
          category: 'reading',
          contentId: readingId as any,
          question: quiz?.question || '',
          userAnswer: answer,
          correctAnswer: quiz?.correctAnswer || '',
          reviewedAt: null,
        });
      }
      await progress.save();

      let xpEarned = 0;
      if (isCorrect) {
        xpEarned = XP_CONFIG.READING_CORRECT;
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: xpEarned } }
        );
      }

      return ApiResponse.success(res, { isCorrect, xpEarned });
    } catch (err) { next(err); }
  };
}
