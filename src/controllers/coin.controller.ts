// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { COIN_CONFIG } from '@/utils/constants';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

/** reason → 획득 코인 매핑 */
const EARN_AMOUNT: Record<string, number> = {
  ad_watch: COIN_CONFIG.AD_WATCH,
  daily_check: COIN_CONFIG.DAILY_CHECK,
  friend_invite: COIN_CONFIG.FRIEND_INVITE,
};

/** reason → 소비 코인 매핑 */
const SPEND_COST: Record<string, number> = {
  heart_refill: COIN_CONFIG.HEART_FULL,
  streak_shield: COIN_CONFIG.STREAK_SHIELD,
  hint_purchase: COIN_CONFIG.HINT_5,
  profile_item: COIN_CONFIG.PROFILE_BORDER,
};

export class CoinController {
  /** GET 코인 잔액 + 최근 거래 내역 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      const transactions = await CoinTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      return ApiResponse.success(res, {
        coins: user.coins,
        transactions,
      }, '코인 상태 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 코인 획득 */
  earn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { reason } = req.body;

      const amount = EARN_AMOUNT[reason];
      if (!amount) {
        throw ApiError.badRequest('유효하지 않은 획득 사유입니다. (ad_watch | daily_check | friend_invite)');
      }

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      user.coins += amount;
      await user.save();

      await CoinTransaction.create({
        userId,
        type: 'earn',
        amount,
        reason,
        balanceAfter: user.coins,
      });

      return ApiResponse.success(res, {
        coins: user.coins,
        earned: amount,
        reason,
      }, '코인 획득 완료');
    } catch (err) {
      next(err);
    }
  };

  /** POST 코인 소비 */
  spend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const targetLanguage = req.user.activeLanguage || req.query.targetLanguage;
      const { reason, amount: customAmount } = req.body;

      const cost = customAmount ?? SPEND_COST[reason];
      if (!cost) {
        throw ApiError.badRequest('유효하지 않은 사용 사유입니다. (heart_refill | streak_shield | hint_purchase | profile_item)');
      }

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      if (user.coins < cost) {
        throw ApiError.insufficientCoins();
      }

      user.coins -= cost;
      await user.save();

      await CoinTransaction.create({
        userId,
        type: 'spend',
        amount: cost,
        reason,
        balanceAfter: user.coins,
      });

      // streak_shield 구매 시 프로필에 쉴드 추가
      if (reason === 'streak_shield') {
        const profile = await UserLanguageProfile.findOne({ userId, targetLanguage });
        if (profile) {
          profile.streakShields = (profile.streakShields || 0) + 1;
          await profile.save();
        }
      }

      return ApiResponse.success(res, {
        coins: user.coins,
        spent: cost,
        reason,
      }, '코인 사용 완료');
    } catch (err) {
      next(err);
    }
  };
}
