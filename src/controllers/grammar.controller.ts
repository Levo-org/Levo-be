// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Grammar from '@/models/Grammar';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG } from '@/utils/constants';

export class GrammarController {
  /** 문법 목록 */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const { level, page = '1', limit = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [items, total] = await Promise.all([
        Grammar.find(filter).sort({ order: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
        Grammar.countDocuments(filter),
      ]);

      const progress = await UserProgress.findOne({ userId: req.user!._id, targetLanguage });
      const statusMap = new Map(
        (progress?.grammarStatus || []).map((g: any) => [g.contentId.toString(), g])
      );

      const data = items.map(item => ({
        ...item.toJSON(),
        studied: !!statusMap.get(item._id.toString()),
        mastered: statusMap.get(item._id.toString())?.mastered || false,
      }));

      return ApiResponse.paginated(res, data, total, pageNum, limitNum);
    } catch (err) { next(err); }
  };

  /** 문법 상세 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Grammar.findById(req.params.id);
      if (!item) throw ApiError.notFound('문법을 찾을 수 없습니다.');
      return ApiResponse.success(res, item);
    } catch (err) { next(err); }
  };

  /** 문법 퀴즈 문제 조회 */
  getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Grammar.findById(req.params.id);
      if (!item) throw ApiError.notFound('문법을 찾을 수 없습니다.');
      return ApiResponse.success(res, { grammarId: item._id, title: item.title, quizzes: item.quizzes });
    } catch (err) { next(err); }
  };

  /** 문법 퀴즈 정답 제출 */
  submitQuizAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const grammarId = req.params.id;
      const { quizIndex, answer, isCorrect } = req.body;

      const grammar = await Grammar.findById(grammarId);
      if (!grammar) throw ApiError.notFound('문법을 찾을 수 없습니다.');

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      const existing = progress.grammarStatus.find(
        (g: any) => g.contentId.toString() === grammarId
      );

      if (existing) {
        if (isCorrect) existing.correctCount += 1;
        else existing.wrongCount += 1;
        if (existing.correctCount >= grammar.quizzes.length) existing.mastered = true;
        existing.lastStudiedAt = new Date();
      } else {
        progress.grammarStatus.push({
          contentId: grammarId as any,
          mastered: false,
          correctCount: isCorrect ? 1 : 0,
          wrongCount: isCorrect ? 0 : 1,
          lastStudiedAt: new Date(),
        });
      }

      await progress.save();

      let xpEarned = 0;
      if (isCorrect) {
        xpEarned = XP_CONFIG.GRAMMAR_CORRECT;
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: xpEarned } }
        );
      }

      return ApiResponse.success(res, { isCorrect, xpEarned });
    } catch (err) { next(err); }
  };
}
