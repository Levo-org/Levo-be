// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Listening from '@/models/Listening';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';
import { serializeListeningPractice } from '@/services/listening/serializer';

export class ListeningController {
  /** 듣기 연습 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const difficulty = req.query.difficulty as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (difficulty) filter.difficulty = difficulty;

      const [listenings, total] = await Promise.all([
        Listening.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Listening.countDocuments(filter),
      ]);

      const sameBucket = await Listening.find(filter).sort({ order: 1 });
      const bucketAnswers = sameBucket.map((item) => item.correctAnswer);

      const serialized = listenings.map((item) => {
        const distractors = bucketAnswers
          .filter((answer) => answer !== item.correctAnswer)
          .sort((a, b) => a.localeCompare(b))
          .slice(0, 3);

        return serializeListeningPractice(
          {
            _id: item._id,
            audioText: item.audioText,
            correctAnswer: item.correctAnswer,
            difficulty: item.difficulty,
          },
          distractors,
        );
      });

      return ApiResponse.paginated(res, serialized, {
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
      const listeningId = req.params.id;
      const { answer } = req.body;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      const listening = await Listening.findOne({ _id: listeningId, status: 'published' });
      if (!listening) throw ApiError.notFound('듣기 문제를 찾을 수 없습니다.');

      const correct = answer.trim().toLowerCase() === listening.correctAnswer.trim().toLowerCase();

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      if (!correct) {
        // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
        userProgress.wrongAnswers.push({
          type: 'listening',
          contentId: listening._id,
          question: listening.audioText,
          userAnswer: answer,
          correctAnswer: listening.correctAnswer,
          createdAt: new Date(),
        });
        await userProgress.save();
        await recordWrongAnswer({
          userId,
          targetLanguage,
          contentType: 'listening',
          contentId: listening._id,
          question: listening.audioText,
          correctAnswer: listening.correctAnswer,
          userAnswer: answer,
        });
      }

      // XP 지급 (정답인 경우)
      let xpEarned = 0;
      let heartsRemaining: number | undefined;
      if (correct) {
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: XP_CONFIG.QUIZ_CORRECT } },
        );
        xpEarned = XP_CONFIG.QUIZ_CORRECT;
      }

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      heartsRemaining = profile?.hearts;

      return ApiResponse.success(res, {
        correct,
        correctAnswer: listening.correctAnswer,
        userAnswer: answer,
        xpEarned,
        heartsRemaining,
      }, correct ? '정답입니다!' : '오답입니다.');
    } catch (err) {
      next(err);
    }
  };
}

export default new ListeningController();
