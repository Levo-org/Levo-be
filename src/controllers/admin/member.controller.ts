import { NextFunction, Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import User, { IUser } from '@/models/User';
import UserLanguageProfile from '@/models/UserLanguageProfile';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';
import { LEVELS, SUPPORTED_LANGUAGES, USER_ROLES } from '@/utils/constants';

interface AdminMemberListQuery {
  page?: string;
  limit?: string;
  search?: string;
  provider?: string;
  role?: string;
  targetLanguage?: string;
  level?: string;
  onboardingCompleted?: string;
  sortBy?: string;
  sortOrder?: string;
}

const MAX_PAGE_SIZE = 100;
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'email', 'coins'] as const;

type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];

function parseBooleanQuery(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw ApiError.badRequest('onboardingCompleted는 true/false 여야 합니다.');
}

function parseSortField(value?: string): AllowedSortField {
  if (!value) return 'createdAt';
  if (!(ALLOWED_SORT_FIELDS as readonly string[]).includes(value)) {
    throw ApiError.badRequest(`지원하지 않는 정렬 필드입니다: ${value}`);
  }
  return value as AllowedSortField;
}

export class AdminMemberController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page: pageQuery,
        limit: limitQuery,
        search,
        provider,
        role,
        targetLanguage,
        level,
        onboardingCompleted,
        sortBy,
        sortOrder,
      } = req.query as AdminMemberListQuery;

      const page = Math.max(1, parseInt(pageQuery || '1', 10) || 1);
      let limit = parseInt(limitQuery || '20', 10) || 20;
      if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
      if (limit < 1) limit = 1;
      const skip = (page - 1) * limit;

      const filter: FilterQuery<IUser> = {};

      if (provider) {
        if (!['google', 'apple', 'email'].includes(provider)) {
          throw ApiError.badRequest(`지원하지 않는 provider입니다: ${provider}`);
        }
        filter.provider = provider;
      }

      if (role) {
        if (!(USER_ROLES as readonly string[]).includes(role)) {
          throw ApiError.badRequest(`지원하지 않는 role입니다: ${role}`);
        }
        filter.role = role;
      }

      if (targetLanguage) {
        if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(targetLanguage)) {
          throw ApiError.badRequest(`지원하지 않는 언어입니다: ${targetLanguage}`);
        }
        filter.activeLanguage = targetLanguage;
      }

      const parsedOnboardingCompleted = parseBooleanQuery(onboardingCompleted);
      if (parsedOnboardingCompleted !== undefined) {
        filter.onboardingCompleted = parsedOnboardingCompleted;
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        filter.$or = [
          { email: searchRegex },
          { name: searchRegex },
          { providerId: searchRegex },
        ];
      }

      const sortField = parseSortField(sortBy);
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

      if (level && !(LEVELS as readonly string[]).includes(level)) {
        throw ApiError.badRequest(`지원하지 않는 레벨입니다: ${level}`);
      }

      const basePipeline: Record<string, unknown>[] = [
        { $match: filter },
        {
          $lookup: {
            from: UserLanguageProfile.collection.name,
            let: {
              userId: '$_id',
              targetLanguage: '$activeLanguage',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$targetLanguage', '$$targetLanguage'] },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  userId: 1,
                  targetLanguage: 1,
                  level: 1,
                  userLevel: 1,
                  xp: 1,
                  hearts: 1,
                  updatedAt: 1,
                },
              },
            ],
            as: 'languageProfile',
          },
        },
        {
          $addFields: {
            languageProfile: { $arrayElemAt: ['$languageProfile', 0] },
          },
        },
        {
          $addFields: {
            level: '$languageProfile.level',
          },
        },
      ];

      if (level) {
        basePipeline.push({ $match: { level } });
      }

      const countResult = await User.collection.aggregate<{ total: number }>([
        ...basePipeline,
        { $count: 'total' },
      ]).toArray();

      const total = countResult[0]?.total ? Number(countResult[0].total) : 0;

      const members = await User.collection.aggregate([
        ...basePipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            email: 1,
            name: 1,
            role: 1,
            provider: 1,
            providerId: 1,
            activeLanguage: 1,
            onboardingCompleted: 1,
            isPremium: 1,
            coins: 1,
            settings: 1,
            level: 1,
            languageProfile: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]).toArray();

      return ApiResponse.paginated(res, members, {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      });
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };
}

export default new AdminMemberController();
