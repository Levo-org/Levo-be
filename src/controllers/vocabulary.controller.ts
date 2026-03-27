// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Vocabulary from '@/models/Vocabulary';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';

export class VocabularyController {
  /** 단어 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const status = req.query.status as string | undefined;
      const chapter = req.query.chapter ? parseInt(req.query.chapter as string, 10) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (level) filter.level = level;
      if (typeof chapter === 'number' && !Number.isNaN(chapter)) filter.chapter = chapter;

      const vocabularies = await Vocabulary.find(filter).sort({ order: 1 });

      const userProgress = await UserProgress.findOne({
        userId,
        targetLanguage,
      });

      const resolveStatus = (rawStatus: string | undefined) => (rawStatus === 'wrong' ? 'learning' : (rawStatus || 'new'));

      const allWords = vocabularies.map((vocab) => {
        const progressStatus = userProgress?.vocabularyStatus.find(
          (v) => v.wordId.toString() === vocab._id.toString(),
        );
        const normalizedStatus = resolveStatus(progressStatus?.status);

        return {
          ...vocab.toObject(),
          userStatus: {
            ...(progressStatus || { status: 'new', correctCount: 0, wrongCount: 0 }),
            status: normalizedStatus,
          },
        };
      });

      const filteredWords = status && status !== 'all'
        ? allWords.filter((word) => {
            const wordStatus = word.userStatus?.status || 'new';
            if (status === 'learning') {
              return wordStatus === 'learning';
            }
            return wordStatus === status;
          })
        : allWords;

      const total = filteredWords.length;
      const pagedWords = filteredWords.slice(skip, skip + limit);

      const tabs = {
        all: allWords.length,
        learning: allWords.filter((word) => (word.userStatus?.status || 'new') === 'learning').length,
        completed: allWords.filter((word) => (word.userStatus?.status || 'new') === 'completed').length,
        wrong: allWords.filter((word) => (word.userStatus?.status || 'new') === 'wrong').length,
      };

      return ApiResponse.paginated(res, {
        words: pagedWords,
        tabs,
      }, {
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
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const chapter = req.query.chapter ? parseInt(req.query.chapter as string, 10) : undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const includeWrong = req.query.includeWrong === 'true';
      const wordIds = typeof req.query.wordIds === 'string'
        ? req.query.wordIds.split(',').map((id) => id.trim()).filter(Boolean)
        : [];

      const filter: Record<string, any> = { targetLanguage, status: 'published' };
      if (level) filter.level = level;
      if (typeof chapter === 'number' && !Number.isNaN(chapter)) filter.chapter = chapter;
      if (wordIds.length > 0) filter._id = { $in: wordIds };

      const userProgress = await UserProgress.findOne({
        userId,
        targetLanguage,
      });

      const prioritizedWordIds = wordIds.length > 0
        ? []
        : includeWrong
        ? (userProgress?.vocabularyStatus || [])
            .filter((entry) => entry.wrongCount > 0 && entry.status !== 'completed')
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .map((entry) => entry.wordId)
        : [];

      const prioritizedCards = prioritizedWordIds.length > 0
        ? await Vocabulary.find({
            ...filter,
            _id: { $in: prioritizedWordIds },
          }).limit(limit)
        : [];

      const remainingLimit = Math.max(limit - prioritizedCards.length, 0);
      const randomFilter = prioritizedWordIds.length > 0
        ? { ...filter, _id: { $nin: prioritizedWordIds } }
        : filter;
      const randomCards = remainingLimit > 0
        ? (await Vocabulary.find(randomFilter)).sort(() => Math.random() - 0.5).slice(0, remainingLimit).map((card) => card.toObject())
        : [];

      const cards = [...prioritizedCards.map((card) => card.toObject()), ...randomCards];

      const flashcards = cards.map((vocab) => {
        const status = userProgress?.vocabularyStatus.find(
          (v) => v.wordId.toString() === vocab._id.toString(),
        );
        const normalizedStatus = status?.status === 'wrong' ? 'learning' : (status?.status || 'new');

        return {
          ...vocab,
          isStudied: !!status && normalizedStatus !== 'new',
          userStatus: {
            ...(status || { status: 'new', correctCount: 0, wrongCount: 0 }),
            status: normalizedStatus,
          },
        };
      });

      return ApiResponse.success(res, { flashcards, total: flashcards.length }, '플래시카드 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 단어 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vocabulary = await Vocabulary.findOne({ _id: req.params.id, status: 'published' });
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
      const wordId = (req.body.wordId as string) || req.params.id;
      const correct = !!req.body.correct;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      if (!wordId) throw ApiError.badRequest('wordId가 필요합니다.');

      const vocabulary = await Vocabulary.findOne({ _id: wordId, status: 'published' });
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
          entry.correctCount = (entry.correctCount || 0) + 1;
          const intervalIndex = Math.min(entry.correctCount - 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[intervalIndex]);
          entry.nextReviewAt = nextReviewDate;
          entry.status = 'completed';
        } else {
          entry.wrongCount = (entry.wrongCount || 0) + 1;
          entry.status = 'learning';
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
          entry.nextReviewAt = nextReviewDate;
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
          userProgress.wrongAnswers.push({
            type: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            userAnswer: '',
            correctAnswer: vocabulary.meaning,
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            correctAnswer: vocabulary.meaning,
            userAnswer: '',
          });
        }
        entry.lastReviewedAt = new Date();
      } else {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
        userProgress.vocabularyStatus.push({
          wordId,
          status: correct ? 'completed' : 'learning',
          correctCount: correct ? 1 : 0,
          wrongCount: correct ? 0 : 1,
          lastReviewedAt: new Date(),
          nextReviewAt: nextReviewDate,
        });
        if (!correct) {
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
          userProgress.wrongAnswers.push({
            type: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            userAnswer: '',
            correctAnswer: vocabulary.meaning,
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'vocabulary',
            contentId: vocabulary._id,
            question: vocabulary.word,
            correctAnswer: vocabulary.meaning,
            userAnswer: '',
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
