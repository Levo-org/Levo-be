// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import UserStreak from '@/models/UserStreak';
import UserProgress from '@/models/UserProgress';

export class UserController {
  /** 내 프로필 조회 */
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user._id).select('-__v');
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      const languageProfile = await UserLanguageProfile.findOne({
        userId: req.user._id,
        targetLanguage: user.activeLanguage,
      }).select('-__v');

      const streak = await UserStreak.findOne({
        userId: req.user._id,
        targetLanguage: user.activeLanguage,
      }).select('-__v');

      return ApiResponse.success(res, {
        user,
        languageProfile,
        streak,
      }, '프로필 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** 프로필 수정 (이름, 프로필 이미지) */
  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, profileImage } = req.body;

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (profileImage !== undefined) updateData.profileImage = profileImage;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      return ApiResponse.success(res, { user }, '프로필 수정 완료');
    } catch (err) {
      next(err);
    }
  };

  /** 설정 변경 */
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dailyGoalMinutes, notificationEnabled, notificationHour, soundEnabled, effectsEnabled } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      if (dailyGoalMinutes !== undefined) user.settings.dailyGoalMinutes = dailyGoalMinutes;
      if (notificationEnabled !== undefined) user.settings.notificationEnabled = notificationEnabled;
      if (notificationHour !== undefined) user.settings.notificationHour = notificationHour;
      if (soundEnabled !== undefined) user.settings.soundEnabled = soundEnabled;
      if (effectsEnabled !== undefined) user.settings.effectsEnabled = effectsEnabled;

      await user.save();

      return ApiResponse.success(res, { settings: user.settings }, '설정 변경 완료');
    } catch (err) {
      next(err);
    }
  };

  /** 학습 언어 변경 */
  changeLanguage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage } = req.body;

      if (!['en', 'ja', 'zh'].includes(targetLanguage)) {
        throw ApiError.badRequest('지원하지 않는 언어입니다. (en, ja, zh)');
      }

      const user = await User.findById(req.user._id);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      user.activeLanguage = targetLanguage;
      await user.save();

      // UserLanguageProfile 없으면 생성
      let languageProfile = await UserLanguageProfile.findOne({
        userId: req.user._id,
        targetLanguage,
      });
      if (!languageProfile) {
        languageProfile = await UserLanguageProfile.create({
          userId: req.user._id,
          targetLanguage,
          level: 'beginner',
        });
      }

      // UserStreak 없으면 생성
      let streak = await UserStreak.findOne({
        userId: req.user._id,
        targetLanguage,
      });
      if (!streak) {
        streak = await UserStreak.create({
          userId: req.user._id,
          targetLanguage,
        });
      }

      // UserProgress 없으면 생성
      let progress = await UserProgress.findOne({
        userId: req.user._id,
        targetLanguage,
      });
      if (!progress) {
        progress = await UserProgress.create({
          userId: req.user._id,
          targetLanguage,
        });
      }

      return ApiResponse.success(res, {
        user,
        languageProfile,
        streak,
        progress,
      }, '언어 변경 완료');
    } catch (err) {
      next(err);
    }
  };

  /** 온보딩 완료 */
  completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage, level, dailyGoalMinutes } = req.body;

      if (!['en', 'ja', 'zh'].includes(targetLanguage)) {
        throw ApiError.badRequest('지원하지 않는 언어입니다. (en, ja, zh)');
      }

      const user = await User.findById(req.user._id);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      if (user.onboardingCompleted) {
        throw ApiError.badRequest('이미 온보딩이 완료되었습니다.');
      }

      user.activeLanguage = targetLanguage;
      user.onboardingCompleted = true;
      if (dailyGoalMinutes !== undefined) {
        user.settings.dailyGoalMinutes = dailyGoalMinutes;
      }
      await user.save();

      // UserLanguageProfile 생성
      const languageProfile = await UserLanguageProfile.findOneAndUpdate(
        { userId: req.user._id, targetLanguage },
        { $setOnInsert: { userId: req.user._id, targetLanguage, level: level || 'beginner' } },
        { upsert: true, new: true }
      );

      // UserStreak 생성
      const streak = await UserStreak.findOneAndUpdate(
        { userId: req.user._id, targetLanguage },
        { $setOnInsert: { userId: req.user._id, targetLanguage } },
        { upsert: true, new: true }
      );

      // UserProgress 생성
      const progress = await UserProgress.findOneAndUpdate(
        { userId: req.user._id, targetLanguage },
        { $setOnInsert: { userId: req.user._id, targetLanguage } },
        { upsert: true, new: true }
      );

      return ApiResponse.success(res, {
        user,
        languageProfile,
        streak,
        progress,
      }, '온보딩 완료');
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
