// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Vocabulary from '@/models/Vocabulary';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';

export class VocabularyController {
  /** 단어 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { targetLanguage, level } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const [vocabularies, total] = await Promise.all([
        Vocabulary.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Vocabulary.countDocuments(filter),
      ]);

      const userProgress = await UserProgress.findOne({
        userId,
        targetLanguage,
      });

      const vocabWithStatus = vocabularies.map((vocab) => {
        const status = userProgress?.vocabularyStatus.find(
          (v) => v.wordId.toString() === vocab._id.toString(),
        );
        return {
          ...vocab.toObject(),
          userStatus: status || { status: 'new', correctCount: 0, wrongCount: 0 },
        };
      });

      return ApiResponse.paginated(res, vocabWithStatus, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  /** 플래시카드 세트 조회 */
  getFlashcards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { targetLanguage, level } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const vocabularies = await Vocabulary.find(filter).limit(limit);

      // 셔플
      const shuffled = vocabularies.sort(() => Math.random() - 0.5);

      const userProgress = await UserProgress.findOne({
        userId,
        targetLanguage,
      });

      const flashcards = shuffled.map((vocab) => {
        const status = userProgress?.vocabularyStatus.find(
          (v) => v.wordId.toString() === vocab._id.toString(),
        );
        return {
          ...vocab.toObject(),
          isStudied: !!status && status.status !== 'new',
        };
      });

      return ApiResponse.success(res, { flashcards }, '플래시카드 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 단어 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vocabulary = await Vocabulary.findById(req.params.id);
      if (!vocabulary) throw ApiError.notFound('단어를 찾을 수 없습니다.');

      return ApiResponse.success(res, { vocabulary }, '단어 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 단어 학습 결과 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { wordId, correct } = req.body;
      const { targetLanguage } = req.query;

      const vocabulary = await Vocabulary.findById(wordId);
      if (!vocabulary) throw ApiError.notFound('단어를 찾을 수 없습니다.');

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      const statusIndex = userProgress.vocabularyStatus.findIndex(
        (v) => v.wordId.toString() === wordId,
      );

      if (statusIndex >= 0) {
        const entry = userProgress.vocabularyStatus[statusIndex];
        if (correct) {
          entry.correctCount += 1;
          const intervalIndex = Math.min(entry.correctCount - 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[intervalIndex]);
          entry.nextReviewAt = nextReviewDate;
          entry.status = entry.correctCount >= 3 ? 'completed' : 'learning';
        } else {
          entry.wrongCount += 1;
          entry.status = 'wrong';
          entry.nextReviewAt = new Date();
          // 오답 기록 추가
          userProgress.wrongAnswers.push({
            type: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            userAnswer: '',
            correctAnswer: vocabulary.meaning,
            createdAt: new Date(),
          });
        }
        entry.lastReviewedAt = new Date();
      } else {
        const nextReviewDate = new Date();
        if (correct) {
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
        }
        userProgress.vocabularyStatus.push({
          wordId,
          status: correct ? 'learning' : 'wrong',
          correctCount: correct ? 1 : 0,
          wrongCount: correct ? 0 : 1,
          lastReviewedAt: new Date(),
          nextReviewAt: nextReviewDate,
        });
        if (!correct) {
          userProgress.wrongAnswers.push({
            type: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            userAnswer: '',
            correctAnswer: vocabulary.meaning,
            createdAt: new Date(),
          });
        }
      }

      await userProgress.save();

      // XP 지급
      if (correct) {
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: XP_CONFIG.QUIZ_CORRECT } },
        );
      }

      return ApiResponse.success(res, {
        correct,
        vocabularyStatus: userProgress.vocabularyStatus.find(
          (v) => v.wordId.toString() === wordId,
        ),
      }, '답변 제출 완료');
    } catch (err) {
      next(err);
    }
  };
}

export default new VocabularyController();
