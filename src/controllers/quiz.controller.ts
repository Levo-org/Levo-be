// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';

export class QuizController {
  /** 데일리 퀴즈 가져오기 */
  getDailyQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetLanguage = req.user!.activeLanguage;
      const profile = await UserLanguageProfile.findOne({
        userId: req.user!._id,
        targetLanguage,
      });

      const level = profile?.level || 'beginner';
      const count = 10;

      // 각 카테고리에서 랜덤으로 문제 수집
      const [vocabs, grammars, listenings, readings] = await Promise.all([
        Vocabulary.aggregate([
          { $match: { targetLanguage, level } },
          { $sample: { size: 3 } },
        ]),
        Grammar.aggregate([
          { $match: { targetLanguage, level } },
          { $sample: { size: 2 } },
        ]),
        Listening.aggregate([
          { $match: { targetLanguage, level } },
          { $sample: { size: 3 } },
        ]),
        Reading.aggregate([
          { $match: { targetLanguage, level } },
          { $sample: { size: 2 } },
        ]),
      ]);

      const quizzes: any[] = [];

      // 단어 → 의미 맞추기
      vocabs.forEach((v: any) => {
        quizzes.push({
          type: 'vocabulary',
          contentId: v._id,
          question: v.word,
          hint: v.pronunciation,
          correctAnswer: v.meaning,
          category: 'vocabulary',
        });
      });

      // 문법 → 내장 퀴즈 활용
      grammars.forEach((g: any) => {
        if (g.quizzes && g.quizzes.length > 0) {
          const q = g.quizzes[Math.floor(Math.random() * g.quizzes.length)];
          quizzes.push({
            type: 'grammar',
            contentId: g._id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            category: 'grammar',
          });
        }
      });

      // 듣기 → 받아쓰기
      listenings.forEach((l: any) => {
        quizzes.push({
          type: 'listening',
          contentId: l._id,
          question: l.audioText,
          hint: l.hint,
          correctAnswer: l.correctAnswer,
          category: 'listening',
        });
      });

      // 읽기 → 내장 퀴즈
      readings.forEach((r: any) => {
        if (r.quizzes && r.quizzes.length > 0) {
          const q = r.quizzes[Math.floor(Math.random() * r.quizzes.length)];
          quizzes.push({
            type: 'reading',
            contentId: r._id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            passage: r.title,
            category: 'reading',
          });
        }
      });

      // 셔플
      quizzes.sort(() => Math.random() - 0.5);

      return ApiResponse.success(res, {
        date: new Date().toISOString().split('T')[0],
        quizzes: quizzes.slice(0, count),
        totalCount: Math.min(quizzes.length, count),
      });
    } catch (err) { next(err); }
  };

  /** 퀴즈 개별 정답 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { contentId, category, answer, isCorrect } = req.body;

      const progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) throw ApiError.notFound('학습 진행도를 찾을 수 없습니다.');

      if (!isCorrect) {
        progress.wrongAnswers.push({
          category,
          contentId,
          question: '',
          userAnswer: answer,
          correctAnswer: '',
          reviewedAt: null,
        });
        await progress.save();
      }

      let xpEarned = 0;
      if (isCorrect) {
        xpEarned = XP_CONFIG.QUIZ_CORRECT;
        await UserLanguageProfile.findOneAndUpdate(
          { userId, targetLanguage },
          { $inc: { xp: xpEarned } }
        );
      }

      return ApiResponse.success(res, { isCorrect, xpEarned });
    } catch (err) { next(err); }
  };

  /** 데일리 퀴즈 완료 */
  completeQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;
      const { correctCount, totalCount, timeTaken } = req.body;

      const score = Math.round((correctCount / totalCount) * 100);

      // XP 부여
      const xpEarned = XP_CONFIG.DAILY_QUIZ_COMPLETE;
      const profile = await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { $inc: { xp: xpEarned } },
        { new: true }
      );

      // 코인 부여
      const coinEarned = COIN_CONFIG.DAILY_QUIZ_COMPLETE;
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: coinEarned } },
        { new: true }
      );

      await CoinTransaction.create({
        userId,
        type: 'earn',
        amount: coinEarned,
        reason: 'daily_quiz',
        balanceAfter: user!.coins,
      });

      return ApiResponse.success(res, {
        score,
        xpEarned,
        coinEarned,
        totalXp: profile?.xp,
        totalCoins: user?.coins,
      });
    } catch (err) { next(err); }
  };
}
