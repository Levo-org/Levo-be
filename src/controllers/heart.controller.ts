// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { HEART_CONFIG, COIN_CONFIG } from '@/utils/constants';

export class HeartController {
  /** 하트 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      // 프리미엄 사용자는 무제한
      if (req.user!.isPremium) {
        return ApiResponse.success(res, {
          hearts: HEART_CONFIG.MAX_HEARTS,
          maxHearts: HEART_CONFIG.MAX_HEARTS,
          isPremium: true,
          nextRecoveryAt: null,
        });
      }

      // 자동 회복 계산
      const now = new Date();
      let { hearts, lastHeartLostAt } = profile;

      if (hearts < HEART_CONFIG.MAX_HEARTS && lastHeartLostAt) {
        const elapsed = now.getTime() - new Date(lastHeartLostAt).getTime();
        const recovered = Math.floor(elapsed / (HEART_CONFIG.RECOVER_MINUTES * 60 * 1000));
        if (recovered > 0) {
          hearts = Math.min(HEART_CONFIG.MAX_HEARTS, hearts + recovered);
          profile.hearts = hearts;
          if (hearts >= HEART_CONFIG.MAX_HEARTS) profile.lastHeartLostAt = undefined;
          await profile.save();
        }
      }

      const nextRecoveryAt = hearts < HEART_CONFIG.MAX_HEARTS && lastHeartLostAt
        ? new Date(new Date(lastHeartLostAt).getTime() + HEART_CONFIG.RECOVER_MINUTES * 60 * 1000)
        : null;

      return ApiResponse.success(res, {
        hearts,
        maxHearts: HEART_CONFIG.MAX_HEARTS,
        isPremium: false,
        nextRecoveryAt,
      });
    } catch (err) { next(err); }
  };

  /** 하트 사용 */
  useHeart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      if (req.user!.isPremium) {
        return ApiResponse.success(res, { hearts: HEART_CONFIG.MAX_HEARTS, isPremium: true });
      }

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      if (profile.hearts <= 0) {
        throw ApiError.heartsDepleted();
      }

      profile.hearts -= 1;
      profile.lastHeartLostAt = new Date();
      await profile.save();

      return ApiResponse.success(res, {
        hearts: profile.hearts,
        maxHearts: HEART_CONFIG.MAX_HEARTS,
      });
    } catch (err) { next(err); }
  };

  /** 하트 충전 (코인 사용) */
  refillHearts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const targetLanguage = req.user!.activeLanguage;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      if (profile.hearts >= HEART_CONFIG.MAX_HEARTS) {
        throw ApiError.badRequest('이미 하트가 가득 찼습니다.');
      }

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      const cost = COIN_CONFIG.HEART_REFILL_COST;
      if (user.coins < cost) {
        throw ApiError.insufficientCoins();
      }

      // 코인 차감
      user.coins -= cost;
      await user.save();

      // 하트 충전
      profile.hearts = HEART_CONFIG.MAX_HEARTS;
      profile.lastHeartLostAt = undefined;
      await profile.save();

      // 거래 기록
      await CoinTransaction.create({
        userId,
        type: 'spend',
        amount: cost,
        reason: 'heart_refill',
        balanceAfter: user.coins,
      });

      return ApiResponse.success(res, {
        hearts: profile.hearts,
        coins: user.coins,
        cost,
      });
    } catch (err) { next(err); }
  };
}
