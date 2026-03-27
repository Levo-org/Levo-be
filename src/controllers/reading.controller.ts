// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Reading from '@/models/Reading';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';
import { serializeReadingForPractice } from '@/serializers/learningContent.serializer';

export class ReadingController {
  /** 읽기 지문 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const difficulty = req.query.difficulty as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (difficulty) filter.difficulty = difficulty;

      const [readings, total] = await Promise.all([
        Reading.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Reading.countDocuments(filter),
      ]);

      const serialized = readings.map((reading) =>
        serializeReadingForPractice({
          _id: reading._id.toString(),
          title: reading.title,
          content: reading.content,
          translation: reading.translation,
          difficulty: reading.difficulty,
          quizzes: reading.quizzes,
        }),
      );

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

  /** 읽기 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reading = await Reading.findOne({ _id: req.params.id, status: 'published' });
      if (!reading) throw ApiError.notFound('읽기 지문을 찾을 수 없습니다.');

      const serialized = serializeReadingForPractice({
        _id: reading._id.toString(),
        title: reading.title,
        content: reading.content,
        translation: reading.translation,
        difficulty: reading.difficulty,
        quizzes: reading.quizzes,
      });

      return ApiResponse.success(res, serialized, '읽기 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 읽기 퀴즈 답변 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const readingId = req.params.id;
      const quizIndex = Number(req.body.quizIndex);
      const selectedAnswer = req.body.selectedAnswer ?? req.body.answer;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      const reading = await Reading.findById(readingId);
      if (!reading) throw ApiError.notFound('읽기 지문을 찾을 수 없습니다.');

      if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= reading.quizzes.length) {
        throw ApiError.badRequest('유효하지 않은 퀴즈 인덱스입니다.');
      }

      const quiz = reading.quizzes[quizIndex];
      const correct = selectedAnswer === quiz.correctAnswer;

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      if (!Array.isArray(userProgress.readingStatus)) {
        userProgress.readingStatus = [];
      }

      const readingStatusIndex = userProgress.readingStatus.findIndex(
        (entry) => entry.readingId.toString() === readingId,
      );

      const totalQuizzes = Math.max(1, reading.quizzes.length);

      if (readingStatusIndex >= 0) {
        const entry = userProgress.readingStatus[readingStatusIndex];
        const solvedSet = new Set(entry.solvedQuizIndexes || []);
        const wrongSet = new Set(entry.wrongQuizIndexes || []);

        if (correct) {
          solvedSet.add(quizIndex);
          wrongSet.delete(quizIndex);
          entry.correctCount = (entry.correctCount || 0) + 1;
        } else {
          if (!solvedSet.has(quizIndex)) {
            wrongSet.add(quizIndex);
          }
          entry.wrongCount = (entry.wrongCount || 0) + 1;
        }

        const solvedIndexes = Array.from(solvedSet).sort((a, b) => a - b);
        const wrongIndexes = Array.from(wrongSet).sort((a, b) => a - b);
        const solvedCount = solvedIndexes.filter((idx) => idx >= 0 && idx < totalQuizzes).length;

        entry.solvedQuizIndexes = solvedIndexes;
        entry.wrongQuizIndexes = wrongIndexes;
        entry.progress = Math.min(100, Math.round((solvedCount / totalQuizzes) * 100));
        entry.masteryState = entry.progress >= 100 ? 'completed' : solvedCount > 0 ? 'learning' : correct ? 'learning' : 'wrong';
        entry.lastReviewedAt = new Date();
      } else {
        const solvedQuizIndexes = correct ? [quizIndex] : [];
        const wrongQuizIndexes = correct ? [] : [quizIndex];
        const solvedCount = solvedQuizIndexes.length;

        userProgress.readingStatus.push({
          readingId,
          solvedQuizIndexes,
          wrongQuizIndexes,
          progress: Math.min(100, Math.round((solvedCount / totalQuizzes) * 100)),
          masteryState: correct ? (solvedCount >= totalQuizzes ? 'completed' : 'learning') : 'wrong',
          correctCount: correct ? 1 : 0,
          wrongCount: correct ? 0 : 1,
          lastReviewedAt: new Date(),
        });
      }

      if (!correct) {
        // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
        userProgress.wrongAnswers.push({
          type: 'reading',
          contentId: reading._id,
          question: quiz.question,
          userAnswer: String(selectedAnswer),
          correctAnswer: String(quiz.correctAnswer),
          createdAt: new Date(),
        });
        await userProgress.save();
        await recordWrongAnswer({
          userId,
          targetLanguage,
          contentType: 'reading',
          contentId: reading._id,
          question: quiz.question,
          correctAnswer: String(quiz.correctAnswer),
          userAnswer: String(selectedAnswer),
        });
      }

      await userProgress.save();

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
