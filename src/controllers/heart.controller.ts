// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { HEART_CONFIG, COIN_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

export class HeartController {
  /** GET 하트 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      let hearts = profile.hearts;

      if (hearts < 5 && profile.lastHeartLostAt) {
        const elapsed = Date.now() - new Date(profile.lastHeartLostAt).getTime();
        const recovered = Math.floor(elapsed / (HEART_CONFIG.REFILL_INTERVAL_MINUTES * 60 * 1000));
        hearts = Math.min(5, hearts + recovered);
        if (hearts >= 5) {
          profile.lastHeartLostAt = null;
        }
        profile.hearts = hearts;
        await profile.save();
      }

      const data: any = {
        hearts,
        maxHearts: HEART_CONFIG.MAX_HEARTS,
      };

      if (hearts < 5 && profile.lastHeartLostAt) {
        const elapsed = Date.now() - new Date(profile.lastHeartLostAt).getTime();
        const msPerRefill = HEART_CONFIG.REFILL_INTERVAL_MINUTES * 60 * 1000;
        const msUntilNext = msPerRefill - (elapsed % msPerRefill);
        data.nextRefillAt = new Date(Date.now() + msUntilNext).toISOString();
      }

      return ApiResponse.success(res, data, '하트 상태 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 하트 사용 (오답 시 호출) */
  useHeart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      if (profile.hearts <= 0) {
        throw ApiError.heartsDepleted();
      }

      profile.hearts -= 1;

      if (!profile.lastHeartLostAt) {
        profile.lastHeartLostAt = new Date();
      }

      await profile.save();

      return ApiResponse.success(res, {
        hearts: profile.hearts,
        maxHearts: HEART_CONFIG.MAX_HEARTS,
      }, '하트 1개 사용');
    } catch (err) {
      next(err);
    }
  };

  /** POST 하트 충전 */
  refillHearts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;
      const { method } = req.body;

      const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
      if (!profile) throw ApiError.notFound('언어 프로필을 찾을 수 없습니다.');

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      switch (method) {
        case 'coin': {
          const cost = COIN_CONFIG.HEART_FULL;
          if (user.coins < cost) {
            throw ApiError.insufficientCoins();
          }
          user.coins -= cost;
          await user.save();

          await CoinTransaction.create({
            userId,
            type: 'spend',
            amount: cost,
            reason: 'heart_refill',
            balanceAfter: user.coins,
          });

          profile.hearts = HEART_CONFIG.MAX_HEARTS;
          profile.lastHeartLostAt = null;
          await profile.save();
          break;
        }

        case 'ad': {
          profile.hearts = Math.min(HEART_CONFIG.MAX_HEARTS, profile.hearts + 1);
          if (profile.hearts >= HEART_CONFIG.MAX_HEARTS) {
            profile.lastHeartLostAt = null;
          }
          await profile.save();
          break;
        }

        case 'premium': {
          if (!user.isPremium) {
            throw ApiError.forbidden('프리미엄 회원만 이용 가능합니다.');
          }
          profile.hearts = HEART_CONFIG.MAX_HEARTS;
          profile.lastHeartLostAt = null;
          await profile.save();
          break;
        }

        default:
          throw ApiError.badRequest('유효하지 않은 충전 방법입니다. (coin | ad | premium)');
      }

      return ApiResponse.success(res, {
        hearts: profile.hearts,
        maxHearts: HEART_CONFIG.MAX_HEARTS,
        coins: user.coins,
      }, '하트 충전 완료');
    } catch (err) {
      next(err);
    }
  };
}
