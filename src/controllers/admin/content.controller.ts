import { Request, Response, NextFunction } from 'express';
import { Model, Document } from 'mongoose';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { createAuditLog } from '@/utils/auditLogger';
import { CONTENT_STATUSES, SUPPORTED_LANGUAGES, LEVELS } from '@/utils/constants';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import ExampleSentence from '@/models/ExampleSentence';

const VALID_CONTENT_TYPES = [
  'vocabulary',
  'grammar',
  'conversation',
  'listening',
  'reading',
  'exampleSentence',
] as const;

type AdminContentType = typeof VALID_CONTENT_TYPES[number];

const MODEL_MAP: Record<AdminContentType, Model<Document>> = {
  vocabulary: Vocabulary as unknown as Model<Document>,
  grammar: Grammar as unknown as Model<Document>,
  conversation: Conversation as unknown as Model<Document>,
  listening: Listening as unknown as Model<Document>,
  reading: Reading as unknown as Model<Document>,
  exampleSentence: ExampleSentence as unknown as Model<Document>,
};

const SEARCH_FIELD_MAP: Record<AdminContentType, string[]> = {
  vocabulary: ['word', 'meaning'],
  grammar: ['title', 'englishTitle'],
  conversation: ['title'],
  listening: ['audioText'],
  reading: ['title', 'content'],
  exampleSentence: ['originalText', 'translation'],
};

const EDITORIAL_POPULATE = [
  { path: 'createdBy', select: 'name email' },
  { path: 'lastEditedBy', select: 'name email' },
  { path: 'reviewedBy', select: 'name email' },
  { path: 'publishedBy', select: 'name email' },
];

const MAX_PAGE_SIZE = 100;

function isValidContentType(value: string): value is AdminContentType {
  return (VALID_CONTENT_TYPES as readonly string[]).includes(value);
}

function getModel(contentType: string): Model<Document> {
  if (!isValidContentType(contentType)) {
    throw ApiError.badRequest(
      `유효하지 않은 콘텐츠 타입입니다: ${contentType}. 허용: ${VALID_CONTENT_TYPES.join(', ')}`,
    );
  }
  return MODEL_MAP[contentType];
}

function getSearchFields(contentType: AdminContentType): string[] {
  return SEARCH_FIELD_MAP[contentType];
}

function computeChangedFields(
  oldDoc: Record<string, unknown>,
  updates: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changedFields: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(updates)) {
    const oldVal = oldDoc[key];
    const newVal = updates[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedFields[key] = { from: oldVal, to: newVal };
    }
  }
  return changedFields;
}

function paramAsString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class AdminContentController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      if (!isValidContentType(contentType)) {
        throw ApiError.badRequest(
          `유효하지 않은 콘텐츠 타입입니다: ${contentType}. 허용: ${VALID_CONTENT_TYPES.join(', ')}`,
        );
      }

      const ContentModel = getModel(contentType);

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      let limit = parseInt(req.query.limit as string) || 20;
      if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
      if (limit < 1) limit = 1;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      const { status, targetLanguage, level, topic, search } = req.query;

      if (status) {
        if (!(CONTENT_STATUSES as readonly string[]).includes(status as string)) {
          throw ApiError.badRequest(`유효하지 않은 상태입니다: ${status}`);
        }
        filter.status = status;
      }

      if (targetLanguage) {
        if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(targetLanguage as string)) {
          throw ApiError.badRequest(`유효하지 않은 언어입니다: ${targetLanguage}`);
        }
        filter.targetLanguage = targetLanguage;
      }

      if (level) {
        if (!(LEVELS as readonly string[]).includes(level as string)) {
          throw ApiError.badRequest(`유효하지 않은 레벨입니다: ${level}`);
        }
        if (contentType === 'listening' || contentType === 'reading') {
          filter.difficulty = level;
        } else {
          filter.level = level;
        }
      }

      if (topic) {
        filter.topic = topic;
      }

      if (search) {
        const searchFields = getSearchFields(contentType);
        const searchRegex = { $regex: search as string, $options: 'i' };
        filter.$or = searchFields.map((field) => ({ [field]: searchRegex }));
      }

      const sortBy = (req.query.sortBy as string) || 'updatedAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const [items, total] = await Promise.all([
        ContentModel.find(filter).sort(sort).skip(skip).limit(limit),
        ContentModel.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      const id = paramAsString(req.params.id);
      const ContentModel = getModel(contentType);

      const item = await ContentModel.findById(id).populate(EDITORIAL_POPULATE);
      if (!item) {
        throw ApiError.notFound('콘텐츠를 찾을 수 없습니다.');
      }

      return ApiResponse.success(res, item);
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      const ContentModel = getModel(contentType);

      const data = {
        ...req.body,
        status: 'draft',
        sourceType: 'manual',
        createdBy: req.user!._id,
        lastEditedBy: req.user!._id,
      };

      const item = await ContentModel.create(data);

      await createAuditLog({
        actor: req.user!._id,
        action: 'create',
        entityType: contentType,
        entityId: item._id,
        metadata: { contentType },
      });

      return ApiResponse.created(res, item, '콘텐츠가 생성되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      const id = paramAsString(req.params.id);
      const ContentModel = getModel(contentType);

      const existing = await ContentModel.findById(id);
      if (!existing) {
        throw ApiError.notFound('콘텐츠를 찾을 수 없습니다.');
      }

      const currentStatus = (existing as unknown as { status: string }).status;
      if (currentStatus !== 'draft' && currentStatus !== 'in_review') {
        throw ApiError.badRequest(
          '게시된 콘텐츠는 직접 수정할 수 없습니다. 먼저 보관(archive) 처리해주세요.',
        );
      }

      const oldDoc = existing.toObject() as unknown as Record<string, unknown>;
      const updates = req.body as Record<string, unknown>;

      delete updates.status;
      delete updates.createdBy;
      delete updates.sourceType;
      delete updates.importBatchId;

      const changedFields = computeChangedFields(oldDoc, updates);

      Object.assign(existing, updates);
      (existing as unknown as { lastEditedBy: unknown }).lastEditedBy = req.user!._id;
      await existing.save();

      await createAuditLog({
        actor: req.user!._id,
        action: 'update',
        entityType: contentType,
        entityId: existing._id,
        changedFields,
        metadata: { contentType },
      });

      return ApiResponse.success(res, existing, '콘텐츠가 수정되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      const id = paramAsString(req.params.id);
      const ContentModel = getModel(contentType);

      const existing = await ContentModel.findById(id);
      if (!existing) {
        throw ApiError.notFound('콘텐츠를 찾을 수 없습니다.');
      }

      (existing as unknown as { status: string }).status = 'archived';
      (existing as unknown as { lastEditedBy: unknown }).lastEditedBy = req.user!._id;
      await existing.save();

      await createAuditLog({
        actor: req.user!._id,
        action: 'archive',
        entityType: contentType,
        entityId: existing._id,
        metadata: { contentType },
      });

      return ApiResponse.success(res, null, '콘텐츠가 보관(archive) 처리되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result: Record<string, Record<string, number>> = {};

      for (const contentType of VALID_CONTENT_TYPES) {
        const ContentModel = MODEL_MAP[contentType];

        const aggregation = await ContentModel.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const statusCounts: Record<string, number> = {};
        for (const entry of aggregation) {
          statusCounts[entry._id as string] = entry.count as number;
        }

        result[contentType] = statusCounts;
      }

      return ApiResponse.success(res, result, '콘텐츠 통계 조회 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };
}

export default new AdminContentController();
