// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Listening from '@/models/Listening';
import UserProgress from '@/models/UserProgress';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { XP_CONFIG, COIN_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

export class QuizController {
  /** GET 데일리 퀴즈 생성 */
  getDailyQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;

      // 랜덤 콘텐츠 추출
      const [vocabItems, grammarItems, listeningItems] = await Promise.all([
        Vocabulary.aggregate([
          { $match: { targetLanguage } },
          { $sample: { size: 5 } },
        ]),
        Grammar.aggregate([
          { $match: { targetLanguage } },
          { $sample: { size: 3 } },
        ]),
        Listening.aggregate([
          { $match: { targetLanguage } },
          { $sample: { size: 2 } },
        ]),
      ]);

      // 퀴즈 문제 포맷
      const questions: any[] = [];

      for (const vocab of vocabItems) {
        // 오답 보기 생성을 위해 같은 언어의 단어 3개 추출
        const distractors = await Vocabulary.aggregate([
          { $match: { targetLanguage, _id: { $ne: vocab._id } } },
          { $sample: { size: 3 } },
        ]);
        const options = [
          vocab.meaning,
          ...distractors.map((d) => d.meaning),
        ].sort(() => Math.random() - 0.5);

        questions.push({
          questionType: 'vocabulary',
          contentId: vocab._id,
          question: vocab.word,
          options,
          correctAnswer: vocab.meaning,
        });
      }

      for (const grammar of grammarItems) {
        questions.push({
          questionType: 'grammar',
          contentId: grammar._id,
          question: grammar.example || grammar.pattern,
          options: grammar.quizOptions || [],
          correctAnswer: grammar.correctAnswer || grammar.meaning,
        });
      }

      for (const listening of listeningItems) {
        questions.push({
          questionType: 'listening',
          contentId: listening._id,
          question: listening.title || listening.audioUrl,
          options: listening.quizOptions || [],
          correctAnswer: listening.correctAnswer || '',
        });
      }

      // 셔플
      questions.sort(() => Math.random() - 0.5);

      return ApiResponse.success(res, {
        totalQuestions: questions.length,
        questions,
      }, '데일리 퀴즈 생성 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 퀴즈 답변 제출 */
  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { questionType, contentId, answer, correctAnswer } = req.body;

      const isCorrect = answer === correctAnswer;

      let progress = await UserProgress.findOne({ userId, targetLanguage });
      if (!progress) {
        progress = await UserProgress.create({
          userId,
          targetLanguage,
          completedLessons: [],
          currentLessonId: null,
          wrongAnswers: [],
        });
      }

      if (!isCorrect) {
        progress.wrongAnswers.push({
          type: questionType,
          contentId,
          question: '',
          userAnswer: answer,
          correctAnswer,
          createdAt: new Date(),
        });
        await progress.save();
      } else {
        // 정답 시 XP 지급
        const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
        if (profile) {
          profile.xp += XP_CONFIG.QUIZ_CORRECT;
          await profile.save();
        }
      }

      return ApiResponse.success(res, {
        correct: isCorrect,
        xpEarned: isCorrect ? XP_CONFIG.QUIZ_CORRECT : 0,
      }, isCorrect ? '정답!' : '오답!');
    } catch (err) {
      next(err);
    }
  };

  /** POST 퀴즈 세션 완료 */
  completeQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = (req.query.targetLanguage as string) || req.user.activeLanguage;
      const { score, totalQuestions } = req.body;

      const correctCount = Math.round((score / 100) * totalQuestions);
      const xpEarned = correctCount * XP_CONFIG.QUIZ_CORRECT;
      const coinsEarned = correctCount > 0 ? COIN_CONFIG.LESSON_COMPLETE : 0;

      // XP 지급 및 레벨업 확인
      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      let leveledUp = false;
      let newLevel = profile?.userLevel || 1;

      if (profile) {
        profile.xp += xpEarned;
        const requiredXp = XP_CONFIG.LEVEL_UP_FORMULA(profile.userLevel);
        if (profile.xp >= requiredXp) {
          profile.userLevel += 1;
          profile.xp -= requiredXp;
          leveledUp = true;
          newLevel = profile.userLevel;
        }
        await profile.save();
      }

      // 코인 지급
      if (coinsEarned > 0) {
        const user = await User.findById(userId);
        if (user) {
          user.coins = (user.coins || 0) + coinsEarned;
          await user.save();

          await CoinTransaction.create({
            userId,
            type: 'earn',
            amount: coinsEarned,
            reason: 'lesson_complete',
            balanceAfter: user.coins,
          });
        }
      }

      return ApiResponse.success(res, {
        score,
        totalQuestions,
        correctCount,
        xpEarned,
        coinsEarned,
        leveledUp,
        newLevel,
      }, '퀴즈 완료');
    } catch (err) {
      next(err);
    }
  };
}
