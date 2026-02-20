// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

export class SubscriptionController {
  /** 구독 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;

      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
      }).sort({ createdAt: -1 });

      if (!subscription) {
        return ApiResponse.success(res, {
          isSubscribed: false,
          plan: null,
          status: null,
        });
      }

      return ApiResponse.success(res, {
        isSubscribed: true,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
      });
    } catch (err) { next(err); }
  };

  /** 구독 시작 */
  subscribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const { plan, paymentProvider, transactionId } = req.body;

      // 기존 활성 구독 확인
      const existing = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
      });

      if (existing) {
        throw ApiError.badRequest('이미 활성 구독이 있습니다.');
      }

      const startDate = new Date();
      const endDate = new Date();
      switch (plan) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        case 'lifetime':
          endDate.setFullYear(endDate.getFullYear() + 100);
          break;
      }

      const subscription = await Subscription.create({
        userId,
        plan,
        status: 'active',
        startDate,
        endDate,
        paymentProvider: paymentProvider || 'test',
        transactionId: transactionId || `test_${Date.now()}`,
      });

      // 사용자 프리미엄 상태 업데이트
      await User.findByIdAndUpdate(userId, { isPremium: true });

      return ApiResponse.created(res, {
        subscription,
        message: '프리미엄 구독이 시작되었습니다! 🎉',
      });
    } catch (err) { next(err); }
  };

  /** 구독 취소 */
  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;

      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
      });

      if (!subscription) {
        throw ApiError.notFound('활성 구독을 찾을 수 없습니다.');
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;
      await subscription.save();

      // 구독 기간 끝까지는 프리미엄 유지 (endDate 이후 cron으로 처리)
      return ApiResponse.success(res, {
        message: '구독이 취소되었습니다. 구독 기간 종료 후 무료 플랜으로 전환됩니다.',
        endDate: subscription.endDate,
      });
    } catch (err) { next(err); }
  };
}
