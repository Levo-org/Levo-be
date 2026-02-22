// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Reading from '@/models/Reading';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class ReadingController {
  /** 읽기 지문 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage, difficulty } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage };
      if (difficulty) filter.difficulty = difficulty;

      const [readings, total] = await Promise.all([
        Reading.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Reading.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, readings, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  /** 읽기 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reading = await Reading.findById(req.params.id);
      if (!reading) throw ApiError.notFound('읽기 지문을 찾을 수 없습니다.');

      return ApiResponse.success(res, {
        reading: {
          ...reading.toObject(),
          content: reading.content,
          quizzes: reading.quizzes,
        },
      }, '읽기 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 읽기 퀴즈 답변 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { readingId, quizIndex, answer } = req.body;
      const { targetLanguage } = req.query;

      const reading = await Reading.findById(readingId);
      if (!reading) throw ApiError.notFound('읽기 지문을 찾을 수 없습니다.');

      if (!reading.quizzes[quizIndex]) {
        throw ApiError.badRequest('유효하지 않은 퀴즈 인덱스입니다.');
      }

      const quiz = reading.quizzes[quizIndex];
      const correct = answer === quiz.correctAnswer;

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      if (!correct) {
        userProgress.wrongAnswers.push({
          type: 'reading',
          contentId: reading._id,
          question: quiz.question,
          userAnswer: String(answer),
          correctAnswer: String(quiz.correctAnswer),
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
        correctAnswer: quiz.correctAnswer,
        explanation: quiz.explanation,
      }, correct ? '정답입니다!' : '오답입니다.');
    } catch (err) {
      next(err);
    }
  };
}

export default new ReadingController();
