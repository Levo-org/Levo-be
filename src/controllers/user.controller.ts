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
      const user = req.user!;
      const langProfile = await UserLanguageProfile.findOne({
        userId: user._id,
        targetLanguage: user.activeLanguage,
      });

      return ApiResponse.success(res, { user, languageProfile: langProfile });
    } catch (err) { next(err); }
  };

  /** 프로필 수정 */
  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, profileImage } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user!._id,
        { ...(name && { name }), ...(profileImage && { profileImage }) },
        { new: true }
      );
      return ApiResponse.success(res, { user }, '프로필 수정 완료');
    } catch (err) { next(err); }
  };

  /** 설정 변경 */
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates: Record<string, any> = {};
      const allowedFields = ['dailyGoalMinutes', 'notificationEnabled', 'notificationHour', 'soundEnabled', 'effectsEnabled'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`settings.${field}`] = req.body[field];
        }
      }
      const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true });
      return ApiResponse.success(res, { user }, '설정 변경 완료');
    } catch (err) { next(err); }
  };

  /** 활성 언어 변경 */
  changeLanguage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage } = req.body;
      const userId = req.user!._id;

      await User.findByIdAndUpdate(userId, { activeLanguage: targetLanguage });

      // 해당 언어 프로필 찾기 또는 생성
      let langProfile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      let isNew = false;

      if (!langProfile) {
        langProfile = await UserLanguageProfile.create({ userId, targetLanguage });
        await UserStreak.create({ userId, targetLanguage });
        await UserProgress.create({ userId, targetLanguage });
        isNew = true;
      }

      return ApiResponse.success(res, { activeLanguage: targetLanguage, languageProfile: langProfile, isNew });
    } catch (err) { next(err); }
  };

  /** 온보딩 완료 */
  completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetLanguage, level, dailyGoalMinutes, notificationEnabled = true, notificationHour = 7 } = req.body;
      const userId = req.user!._id;

      // 사용자 업데이트
      const user = await User.findByIdAndUpdate(userId, {
        activeLanguage: targetLanguage,
        onboardingCompleted: true,
        'settings.dailyGoalMinutes': dailyGoalMinutes,
        'settings.notificationEnabled': notificationEnabled,
        'settings.notificationHour': notificationHour,
      }, { new: true });

      // 언어 프로필 생성
      const langProfile = await UserLanguageProfile.findOneAndUpdate(
        { userId, targetLanguage },
        { userId, targetLanguage, level },
        { upsert: true, new: true }
      );

      // 스트릭 생성
      await UserStreak.findOneAndUpdate(
        { userId, targetLanguage },
        { userId, targetLanguage },
        { upsert: true }
      );

      // 진행도 생성
      await UserProgress.findOneAndUpdate(
        { userId, targetLanguage },
        { userId, targetLanguage },
        { upsert: true }
      );

      return ApiResponse.created(res, { user, languageProfile: langProfile }, '온보딩 완료! 학습을 시작하세요.');
    } catch (err) { next(err); }
  };
}
