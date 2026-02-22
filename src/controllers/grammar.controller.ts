// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Grammar from '@/models/Grammar';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class GrammarController {
  /** 문법 목록 조회 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage, level } = req.query;
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
      const { targetLanguage } = req.query;

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
          entry.progress = Math.min(entry.progress + 25, 100);
        }
        entry.lastReviewedAt = new Date();
      } else {
        userProgress.grammarStatus.push({
          grammarId,
          progress: correct ? 25 : 0,
          quizScore: correct ? 1 : 0,
          lastReviewedAt: new Date(),
          nextReviewAt: null,
        });
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
