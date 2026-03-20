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
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';
      const level = req.query.level as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const [grammars, total] = await Promise.all([
        Grammar.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
        Grammar.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, grammars, {
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
      const grammar = await Grammar.findById(req.params.id);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      return ApiResponse.success(res, { grammar }, '문법 상세 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 문법 퀴즈 조회 */
  getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grammar = await Grammar.findById(req.params.id);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      const quizQuestions = grammar.examples.map((example, index) => ({
        index,
        sentence: example.sentence,
        translation: example.translation,
        highlight: example.highlight,
      }));

      return ApiResponse.success(res, {
        grammarId: grammar._id,
        title: grammar.title,
        quizzes: grammar.quizzes,
        examples: quizQuestions,
      }, '문법 퀴즈 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 문법 퀴즈 답변 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { grammarId, correct } = req.body;
      const targetLanguage = (req.query.targetLanguage as string) || req.user?.activeLanguage || 'en';

      const grammar = await Grammar.findById(grammarId);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      let userProgress = await UserProgress.findOne({ userId, targetLanguage });
      if (!userProgress) {
        userProgress = await UserProgress.create({ userId, targetLanguage });
      }

      const statusIndex = userProgress.grammarStatus.findIndex(
        (g) => g.grammarId.toString() === grammarId,
      );

      if (statusIndex >= 0) {
        const entry = userProgress.grammarStatus[statusIndex];
        if (correct) {
          entry.quizScore += 1;
          entry.correctCount = (entry.correctCount || 0) + 1;
          entry.progress = Math.min(entry.progress + 25, 100);
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
          progress: correct ? 25 : 0,
          quizScore: correct ? 1 : 0,
          lastReviewedAt: new Date(),
          nextReviewAt: nextReviewDate,
          masteryState: correct ? 'learning' : 'wrong',
          correctCount: correct ? 1 : 0,
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
