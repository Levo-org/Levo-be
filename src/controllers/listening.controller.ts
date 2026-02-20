// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Listening from '@/models/Listening';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ListeningController {
  /** 듣기 문제 목록 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const { level, page = '1', limit = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [items, total] = await Promise.all([
        Listening.find(filter)
          .sort({ order: 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Listening.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, items, total, pageNum, limitNum);
    } catch (err) { next(err); }
  };

  /** 듣기 정답 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const listeningId = req.params.id;
      const { answer } = req.body;

      const listening = await Listening.findById(listeningId);
      if (!listening) throw ApiError.notFound('듣기 문제를 찾을 수 없습니다.');

      const isCorrect = answer.trim().toLowerCase() === listening.correctAnswer.trim().toLowerCase();

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      if (!isCorrect) {
        progress.wrongAnswers.push({
          category: 'listening',
          contentId: listeningId as any,
          question: listening.audioText,
          userAnswer: answer,
          correctAnswer: listening.correctAnswer,
          reviewedAt: null,
        });
      }
      await progress.save();

      let xpEarned = 0;
      if (isCorrect) {
        xpEarned = XP_CONFIG.LISTENING_CORRECT;
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: xpEarned } }
        );
      }

      return ApiResponse.success(res, { isCorrect, xpEarned, correctAnswer: listening.correctAnswer });
    } catch (err) { next(err); }
  };
}
