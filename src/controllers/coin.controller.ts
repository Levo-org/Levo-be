import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User';
import CoinTransaction from '@/models/CoinTransaction';
import { COIN_CONFIG } from '@/utils/constants';

export class CoinController {
  /** 코인 상태 + 거래 내역 */
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const { page = '1', limit = '20' } = req.query;

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [transactions, total] = await Promise.all([
        CoinTransaction.find({ userId })
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        CoinTransaction.countDocuments({ userId }),
      ]);

      return ApiResponse.success(res, {
        coins: user.coins,
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) { next(err); }
  };

  /** 코인 획득 */
  earn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const { amount, reason, metadata } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: amount } },
        { new: true }
      );
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      await CoinTransaction.create({
        userId,
        type: 'earn',
        amount,
        reason,
        balanceAfter: user.coins,
        metadata,
      });

      return ApiResponse.success(res, { coins: user.coins, earned: amount });
    } catch (err) { next(err); }
  };

  /** 코인 사용 */
  spend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const { amount, reason, metadata } = req.body;

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('사용자를 찾을 수 없습니다.');

      if (user.coins < amount) {
        throw ApiError.insufficientCoins();
      }

      user.coins -= amount;
      await user.save();

      await CoinTransaction.create({
        userId,
        type: 'spend',
        amount,
        reason,
        balanceAfter: user.coins,
        metadata,
      });

      return ApiResponse.success(res, { coins: user.coins, spent: amount });
    } catch (err) { next(err); }
  };
}
