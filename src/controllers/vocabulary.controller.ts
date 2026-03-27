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
  applyVocabularyAnswer = async (
    userProgress: any,
    vocabulary: any,
    wordId: string,
    correct: boolean,
    userId: any,
    targetLanguage: string,
  ) => {
    const statusIndex = userProgress.vocabularyStatus.findIndex(
      (v: any) => v.wordId.toString() === wordId,
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
      return entry;
    }

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

    return userProgress.vocabularyStatus[userProgress.vocabularyStatus.length - 1];
  };

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

      const baseFilter: Record<string, any> = { targetLanguage, status: 'published' };
      if (level) baseFilter.level = level;

      const userProgress = await UserProgress.findOne({
        userId,
        targetLanguage,
      });

      const isChapterMode = typeof chapter === 'number' && !Number.isNaN(chapter);

      if (wordIds.length > 0) {
        const explicitCards = await Vocabulary.find({
          ...baseFilter,
          _id: { $in: wordIds },
        });

        const explicitCardMap = new Map(explicitCards.map((card) => [card._id.toString(), card.toObject()]));
        const orderedCards = wordIds
          .map((id) => explicitCardMap.get(id))
          .filter((card): card is Record<string, any> => !!card)
          .slice(0, limit);

        const flashcards = orderedCards.map((vocab) => {
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
      }

      const carryOverWordIds = includeWrong && isChapterMode
        ? (userProgress?.vocabularyStatus || [])
            .filter((entry) => entry.status !== 'completed' && entry.wrongCount > 0)
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .map((entry) => entry.wordId)
        : [];

      const carryOverCards = carryOverWordIds.length > 0
        ? await Vocabulary.find({
            ...baseFilter,
            chapter: { $lt: chapter },
            _id: { $in: carryOverWordIds },
          }).sort({ chapter: 1, order: 1 })
        : [];

      const carryOverCardObjects = carryOverCards.map((card) => card.toObject());
      const carryOverIds = carryOverCardObjects.map((card) => card._id);

      const chapterFilter: Record<string, any> = { ...baseFilter };
      if (isChapterMode) chapterFilter.chapter = chapter;

      const remainingLimit = Math.max(limit - carryOverCardObjects.length, 0);
      if (carryOverIds.length > 0) {
        chapterFilter._id = { $nin: carryOverIds };
      }

      const chapterCards = remainingLimit > 0
        ? (await Vocabulary.find(chapterFilter)).sort(() => Math.random() - 0.5).slice(0, remainingLimit).map((card) => card.toObject())
        : [];

      const cards = [...carryOverCardObjects, ...chapterCards].slice(0, limit);

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

      await this.applyVocabularyAnswer(userProgress, vocabulary, wordId, correct, userId, targetLanguage);

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

  submitBatchAnswers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

      if (answers.length === 0) throw ApiError.badRequest('answers가 필요합니다.');

      const normalizedAnswers = answers
        .map((item) => ({
          wordId: typeof item.wordId === 'string' ? item.wordId : '',
          correct: !!item.correct,
        }))
        .filter((item) => !!item.wordId);

      if (normalizedAnswers.length === 0) throw ApiError.badRequest('유효한 answers가 필요합니다.');

      const uniqueWordIds = Array.from(new Set(normalizedAnswers.map((item) => item.wordId)));
      const vocabularies = await Vocabulary.find({ _id: { $in: uniqueWordIds }, status: 'published' });
      const vocabularyMap = new Map(vocabularies.map((vocabulary) => [vocabulary._id.toString(), vocabulary]));

      const missingWordId = uniqueWordIds.find((id) => !vocabularyMap.has(id));
      if (missingWordId) throw ApiError.notFound('단어를 찾을 수 없습니다.');

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      let correctCount = 0;
      const updatedStatuses: any[] = [];

      for (const answer of normalizedAnswers) {
        const vocabulary = vocabularyMap.get(answer.wordId);
        if (!vocabulary) continue;

        const updatedEntry = await this.applyVocabularyAnswer(
          userProgress,
          vocabulary,
          answer.wordId,
          answer.correct,
          userId,
          targetLanguage,
        );

        if (answer.correct) correctCount += 1;

        updatedStatuses.push({
          wordId: answer.wordId,
          status: updatedEntry.status,
          correctCount: updatedEntry.correctCount,
          wrongCount: updatedEntry.wrongCount,
        });
      }

      await userProgress.save();

      if (correctCount > 0) {
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: XP_CONFIG.QUIZ_CORRECT * correctCount } },
        );
      }

      return ApiResponse.success(res, {
        processed: normalizedAnswers.length,
        correctCount,
        updatedStatuses,
      }, '플래시카드 답변 저장 완료');
    } catch (err) {
      next(err);
    }
  };
}

export default new VocabularyController();
