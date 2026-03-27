// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Listening from '@/models/Listening';
import UserProgress from '@/models/UserProgress';
import UserItemProgress from '@/models/UserItemProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';
import { serializeListeningPractice } from '@/services/listening/serializer';

export class ListeningController {
  private buildSerializedListenings = (
    listenings: Array<{
      _id: any;
      audioText: string;
      correctAnswer: string;
      difficulty: string;
    }>,
    answerPool: string[],
  ) => {
    return listenings.map((item) => {
      const distractors = answerPool
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
  };

  getPracticeList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const difficulty = req.query.difficulty as string | undefined;
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (difficulty) filter.difficulty = difficulty;

      const [listenings, answerPool] = await Promise.all([
        Listening.find(filter)
          .sort({ order: 1 })
          .limit(limit)
          .select('_id audioText correctAnswer difficulty')
          .lean(),
        Listening.distinct('correctAnswer', filter),
      ]);

      const serialized = this.buildSerializedListenings(listenings, answerPool as string[]);
      return ApiResponse.success(res, serialized, '듣기 연습 문제 조회 성공');
    } catch (err) {
      next(err);
    }
  };

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

      const [listenings, total, answerPool] = await Promise.all([
        Listening.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Listening.countDocuments(filter),
        Listening.distinct('correctAnswer', filter),
      ]);

      const serialized = this.buildSerializedListenings(listenings, answerPool as string[]);

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

      const normalizedAnswer = String(answer || '').trim();
      const correct = normalizedAnswer.toLowerCase() === listening.correctAnswer.trim().toLowerCase();

      let itemProgress = await UserItemProgress.findOne({
        userId,
        targetLanguage,
        contentType: 'listening',
        contentId: listening._id,
      });

      if (!itemProgress) {
        itemProgress = await UserItemProgress.create({
          userId,
          targetLanguage,
          contentType: 'listening',
          contentId: listening._id,
          status: 'active',
        });
      }

      itemProgress.attemptCount = (itemProgress.attemptCount || 0) + 1;
      itemProgress.lastStudiedAt = new Date();
      itemProgress.lastResult = correct ? 'correct' : 'wrong';

      if (correct) {
        itemProgress.correctCount = (itemProgress.correctCount || 0) + 1;
        itemProgress.masteryState = 'completed';
      } else {
        itemProgress.wrongCount = (itemProgress.wrongCount || 0) + 1;
        if (itemProgress.masteryState === 'new') {
          itemProgress.masteryState = 'wrong';
        }
      }

      await itemProgress.save();

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
          userAnswer: normalizedAnswer,
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
          userAnswer: normalizedAnswer,
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
        userAnswer: normalizedAnswer,
        xpEarned,
        heartsRemaining,
      }, correct ? '정답입니다!' : '오답입니다.');
    } catch (err) {
      next(err);
    }
  };
}

export default new ListeningController();
