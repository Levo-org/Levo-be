// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';

export class SubscriptionController {
  /** GET 구독 상태 조회 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;

      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
      }).lean();

      if (!subscription) {
        return ApiResponse.success(res, {
          isPremium: false,
          plan: null,
          status: null,
          startDate: null,
          endDate: null,
        }, '구독 상태 조회 성공');
      }

      return ApiResponse.success(res, {
        isPremium: true,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentProvider: subscription.paymentProvider,
      }, '구독 상태 조회 성공');
    } catch (err) {
      next(err);
    }
  };

  /** POST 구독 생성 */
  subscribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const { plan, paymentProvider, transactionId } = req.body;

      if (!plan || !paymentProvider || !transactionId) {
        throw ApiError.badRequest('plan, paymentProvider, transactionId가 필요합니다.');
      }

      // 이미 활성 구독이 있는지 확인
      const existing = await Subscription.findOne({ userId, status: 'active' });
      if (existing) {
        throw ApiError.alreadyPremium();
      }

      // 구독 기간 계산
      const startDate = new Date();
      const endDate = new Date();
      switch (plan) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          throw ApiError.badRequest('유효하지 않은 플랜입니다. (monthly | yearly)');
      }

      const subscription = await Subscription.create({
        userId,
        plan,
        status: 'active',
        paymentProvider,
        transactionId,
        startDate,
        endDate,
      });

      // 사용자 프리미엄 상태 업데이트
      const user = await User.findById(userId);
      if (user) {
        user.isPremium = true;
        user.premiumExpiresAt = endDate;
        await user.save();
      }

      return ApiResponse.created(res, {
        subscription: {
          _id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      }, '구독 완료');
    } catch (err) {
      next(err);
    }
  };

  /** POST 구독 취소 */
  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;

      const subscription = await Subscription.findOne({ userId, status: 'active' });
      if (!subscription) {
        throw ApiError.notFound('활성 구독을 찾을 수 없습니다.');
      }

      subscription.status = 'cancelled';
      await subscription.save();

      // 사용자 프리미엄 상태는 endDate까지 유지 (즉시 해제하지 않음)

      return ApiResponse.success(res, {
        subscription: {
          _id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      }, '구독 취소 완료');
    } catch (err) {
      next(err);
    }
  };
}
