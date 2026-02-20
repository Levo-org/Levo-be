// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Vocabulary from '@/models/Vocabulary';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';

export class VocabularyController {
  /** 단어 목록 조회 (레벨/챕터 필터) */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { level, chapter, page = '1', limit = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;
      if (chapter) filter.chapter = Number(chapter);

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [items, total] = await Promise.all([
        Vocabulary.find(filter)
          .sort({ chapter: 1, order: 1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Vocabulary.countDocuments(filter),
      ]);

      // 학습 상태 매핑
      const progress = await UserProgress.findOne({ userId, targetLanguage });
      const statusMap = new Map(
        (progress?.vocabularyStatus || []).map((v: any) => [v.contentId.toString(), v])
      );

      const data = items.map(item => {
        const s = statusMap.get(item._id.toString());
        return {
          ...item.toJSON(),
          studied: !!s,
          mastered: s?.mastered || false,
          correctCount: s?.correctCount || 0,
          wrongCount: s?.wrongCount || 0,
        };
      });

      return ApiResponse.paginated(res, data, total, pageNum, limitNum);
    } catch (err) { next(err); }
  };

  /** 플래시카드 목록 (셔플 + 미학습 우선) */
  getFlashcards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { level, chapter, count = '20' } = req.query;

      const filter: Record<string, any> = { targetLanguage };
      if (level) filter.level = level;
      if (chapter) filter.chapter = Number(chapter);

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      const studiedIds = new Set(
        (progress?.vocabularyStatus || []).filter((v: any) => v.mastered).map((v: any) => v.contentId.toString())
      );

      // 미학습 우선, 나머지 랜덤
      const all = await Vocabulary.find(filter);
      const unstudied = all.filter(v => !studiedIds.has(v._id.toString()));
      const studied = all.filter(v => studiedIds.has(v._id.toString()));

      // 셔플
      const shuffle = <T>(arr: T[]) => arr.sort(() => Math.random() - 0.5);
      const cards = [...shuffle(unstudied), ...shuffle(studied)].slice(0, Number(count));

      return ApiResponse.success(res, { cards, total: cards.length });
    } catch (err) { next(err); }
  };

  /** 단어 상세 조회 */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await Vocabulary.findById(req.params.id);
      if (!item) throw ApiError.notFound('단어를 찾을 수 없습니다.');

      return ApiResponse.success(res, item);
    } catch (err) { next(err); }
  };

  /** 단어 정답 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const vocabId = req.params.id;
      const { answer, isCorrect } = req.body;

      const vocab = await Vocabulary.findById(vocabId);
      if (!vocab) throw ApiError.notFound('단어를 찾을 수 없습니다.');

      // 진행도 업데이트
      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      const existing = progress.vocabularyStatus.find(
        (v: any) => v.contentId.toString() === vocabId
      );

      if (existing) {
        if (isCorrect) {
          existing.correctCount += 1;
          if (existing.correctCount >= 3) existing.mastered = true;
        } else {
          existing.wrongCount += 1;
          // 오답노트 추가
          await this.addWrongAnswer(progress, vocabId, 'vocabulary', vocab.word, answer, vocab.meaning);
        }
        existing.lastStudiedAt = new Date();
      } else {
        progress.vocabularyStatus.push({
          contentId: vocabId as any,
          mastered: isCorrect && false, // 첫 정답은 아직 마스터 아님
          correctCount: isCorrect ? 1 : 0,
          wrongCount: isCorrect ? 0 : 1,
          lastStudiedAt: new Date(),
        });
        if (!isCorrect) {
          await this.addWrongAnswer(progress, vocabId, 'vocabulary', vocab.word, answer, vocab.meaning);
        }
      }

      await progress.save();

      // XP 부여
      let xpEarned = 0;
      if (isCorrect) {
        xpEarned = XP_CONFIG.VOCABULARY_CORRECT;
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: xpEarned } }
        );
      }

      return ApiResponse.success(res, { isCorrect, xpEarned, correctAnswer: vocab.meaning });
    } catch (err) { next(err); }
  };

  private addWrongAnswer = async (
    progress: any, contentId: string, category: string,
    question: string, userAnswer: string, correctAnswer: string
  ) => {
    progress.wrongAnswers.push({
      category,
      contentId,
      question,
      userAnswer,
      correctAnswer,
      reviewedAt: null,
    });
  };
}
