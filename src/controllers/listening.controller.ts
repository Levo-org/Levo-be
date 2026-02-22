// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Listening from '@/models/Listening';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ListeningController {
  /** 듣기 연습 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage, difficulty } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage };
      if (difficulty) filter.difficulty = difficulty;

      const [listenings, total] = await Promise.all([
        Listening.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Listening.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, listenings, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  /** 듣기 답변 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { listeningId, answer } = req.body;
      const { targetLanguage } = req.query;

      const listening = await Listening.findById(listeningId);
      if (!listening) throw ApiError.notFound('듣기 문제를 찾을 수 없습니다.');

      const correct = answer.trim().toLowerCase() === listening.correctAnswer.trim().toLowerCase();

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      if (!correct) {
        userProgress.wrongAnswers.push({
          type: 'listening',
          contentId: listening._id,
          question: listening.audioText,
          userAnswer: answer,
          correctAnswer: listening.correctAnswer,
          createdAt: new Date(),
        });
        await userProgress.save();
      }

      // XP 지급 (정답인 경우)
      if (correct) {
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: XP_CONFIG.QUIZ_CORRECT } },
        );
      }

      return ApiResponse.success(res, {
        correct,
        correctAnswer: listening.correctAnswer,
        userAnswer: answer,
      }, correct ? '정답입니다!' : '오답입니다.');
    } catch (err) {
      next(err);
    }
  };
}

export default new ListeningController();
