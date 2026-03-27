// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Grammar from '@/models/Grammar';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { REVIEW_INTERVALS_DAYS, XP_CONFIG } from '@/utils/constants';
import { recordWrongAnswer } from '@/services/remediation.service';

export class GrammarController {
  /** 문법 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const baseFilter: Record<string, any> = { targetLanguage };
      if (level) baseFilter.level = level;

      const publishedFilter = { ...baseFilter, status: 'published' };
      const publishedCount = await Grammar.countDocuments(publishedFilter);
      const filter = publishedCount > 0 ? publishedFilter : baseFilter;

      const [grammars, total, userProgress] = await Promise.all([
        Grammar.find(filter).sort({ order: 1 }).skip(skip).limit(limit).lean(),
        Grammar.countDocuments(filter),
        UserProgress.findOne({ userId, targetLanguage }).lean(),
      ]);

      const grammarStatusMap = new Map(
        (userProgress?.grammarStatus || []).map((entry: any) => [entry.grammarId.toString(), entry]),
      );

      const topics = grammars.map((grammar: any) => {
        const statusEntry = grammarStatusMap.get(grammar._id.toString());
        const progress = statusEntry?.progress || 0;
        const status = progress >= 100 || statusEntry?.masteryState === 'completed' ? 'completed' : progress > 0 ? 'learning' : 'learning';

        return {
          _id: grammar._id,
          icon: grammar.icon,
          title: grammar.title,
          subtitle: grammar.subtitle,
          level: grammar.level,
          progress,
          status,
          locked: false,
        };
      });

      return ApiResponse.paginated(res, topics, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  /** 문법 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      let grammar = await Grammar.findOne({ _id: req.params.id, status: 'published' }).lean();
      if (!grammar) {
        grammar = await Grammar.findById(req.params.id).lean();
      }
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      const userProgress = await UserProgress.findOne({ userId, targetLanguage }).lean();
      const grammarStatus = userProgress?.grammarStatus?.find(
        (entry: any) => entry.grammarId.toString() === grammar._id.toString(),
      );

      const detail = {
        _id: grammar._id,
        title: grammar.title,
        level: grammar.level,
        explanation: grammar.explanation,
        formula: grammar.formula,
        formulaDesc: grammar.formulaExample || '',
        examples: grammar.examples || [],
        keyPoints: [] as string[],
        progress: grammarStatus?.progress || 0,
      };

      return ApiResponse.success(res, detail, '문법 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 문법 퀴즈 조회 */
  getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grammar = await Grammar.findById(req.params.id);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      const questions = (grammar.quizzes || []).map((quiz) => ({
        question: quiz.question,
        options: quiz.options,
        correctIndex: quiz.correctAnswer,
      }));

      return ApiResponse.success(res, {
        topicTitle: grammar.title,
        questions,
      }, '문법 퀴즈 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 문법 퀴즈 답변 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const grammarId = (req.params.id || req.body.grammarId || '').toString();
      const quizIndex = Number(req.body.quizIndex);
      const selectedAnswer = Number(req.body.selectedAnswer);
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      const grammar = await Grammar.findById(grammarId);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      let correct = false;
      let correctAnswer = -1;
      let explanation = '';

      if (typeof req.body.correct === 'boolean') {
        correct = req.body.correct;
      } else {
        if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= grammar.quizzes.length) {
          throw ApiError.badRequest('유효하지 않은 quizIndex입니다.');
        }
        if (!Number.isInteger(selectedAnswer)) {
          throw ApiError.badRequest('유효하지 않은 selectedAnswer입니다.');
        }

        const quiz = grammar.quizzes[quizIndex];
        correctAnswer = quiz.correctAnswer;
        explanation = quiz.explanation || '';
        correct = selectedAnswer === quiz.correctAnswer;
      }

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      const statusIndex = userProgress.grammarStatus.findIndex(
        (g) => g.grammarId.toString() === grammarId,
      );
      const canTrackQuizIndex = Number.isInteger(quizIndex) && quizIndex >= 0;

      if (statusIndex >= 0) {
        const entry = userProgress.grammarStatus[statusIndex];
        if (correct && canTrackQuizIndex) {
          const solvedSet = new Set(entry.solvedQuizIndexes || []);
          solvedSet.add(quizIndex);
          const solvedIndexes = Array.from(solvedSet).sort((a, b) => a - b);
          entry.solvedQuizIndexes = solvedIndexes;
          entry.quizScore = solvedIndexes.length;

          const totalQuizzes = Math.max(1, grammar.quizzes.length || 1);
          entry.progress = Math.min(100, Math.round((solvedIndexes.length / totalQuizzes) * 100));

          entry.correctCount = (entry.correctCount || 0) + 1;
          const intervalIndex = Math.min(entry.correctCount - 1, REVIEW_INTERVALS_DAYS.length - 1);
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[intervalIndex]);
          entry.nextReviewAt = nextReviewDate;
          entry.masteryState = entry.correctCount >= 3 ? 'completed' : 'learning';
        } else {
          entry.wrongCount = (entry.wrongCount || 0) + 1;
          entry.masteryState = 'wrong';
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
          entry.nextReviewAt = nextReviewDate;
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
          userProgress.wrongAnswers.push({
            type: 'grammar',
            contentId: grammar._id,
            question: grammar.title,
            userAnswer: '',
            correctAnswer: grammar.pattern || grammar.formula || '',
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'grammar',
            contentId: grammar._id,
            question: grammar.title,
            correctAnswer: grammar.pattern || grammar.formula || '',
            userAnswer: '',
          });
        }
        entry.lastReviewedAt = new Date();
      } else {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS_DAYS[0]);
        userProgress.grammarStatus.push({
          grammarId,
          progress: correct && canTrackQuizIndex
            ? Math.min(100, Math.round((1 / Math.max(1, grammar.quizzes.length || 1)) * 100))
            : 0,
          quizScore: correct && canTrackQuizIndex ? 1 : 0,
          solvedQuizIndexes: correct && canTrackQuizIndex ? [quizIndex] : [],
          lastReviewedAt: new Date(),
          nextReviewAt: nextReviewDate,
          masteryState: correct && canTrackQuizIndex ? 'learning' : 'wrong',
          correctCount: correct && canTrackQuizIndex ? 1 : 0,
          wrongCount: correct ? 0 : 1,
        });
        if (!correct) {
          // TODO: legacy embedded wrongAnswers — remove after migration to WrongAnswerEntry collection
          userProgress.wrongAnswers.push({
            type: 'grammar',
            contentId: grammar._id,
            question: grammar.title,
            userAnswer: '',
            correctAnswer: grammar.pattern || grammar.formula || '',
            createdAt: new Date(),
          });
          await recordWrongAnswer({
            userId,
            targetLanguage,
            contentType: 'grammar',
            contentId: grammar._id,
            question: grammar.title,
            correctAnswer: grammar.pattern || grammar.formula || '',
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
        correctAnswer,
        explanation,
        grammarStatus: userProgress.grammarStatus.find(
          (g) => g.grammarId.toString() === grammarId,
        ),
      }, '퀴즈 답변 제출 완료');
    } catch (err) {
      next(err);
    }
  };
}

export default new GrammarController();
