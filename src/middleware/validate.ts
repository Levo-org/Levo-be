import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '@/utils/ApiError';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: Joi.ObjectSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(', ');
      return next(ApiError.badRequest(messages, 'VALIDATION_ERROR'));
    }

    req[target] = value;
    next();
  };
};
