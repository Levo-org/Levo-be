import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { UserRole } from '@/utils/constants';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(ApiError.forbidden('이 작업을 수행할 권한이 없습니다.'));
    }

    next();
  };
};
