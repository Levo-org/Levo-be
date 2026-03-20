import { Request, Response, NextFunction } from 'express';
import { Model, Document, Types } from 'mongoose';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { createAuditLog } from '@/utils/auditLogger';
import { transitionContent, validateStatusTransition } from '@/utils/contentStatus';
import type { ContentStatus, UserRole } from '@/utils/constants';
import type { IEditorialMetadata } from '@/types/editorial';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import ExampleSentence from '@/models/ExampleSentence';
import AuditLog from '@/models/AuditLog';

const VALID_CONTENT_TYPES = [
  'vocabulary',
  'grammar',
  'conversation',
  'listening',
  'reading',
  'exampleSentence',
] as const;

type WorkflowContentType = typeof VALID_CONTENT_TYPES[number];

const MODEL_MAP: Record<WorkflowContentType, Model<Document>> = {
  vocabulary: Vocabulary as unknown as Model<Document>,
  grammar: Grammar as unknown as Model<Document>,
  conversation: Conversation as unknown as Model<Document>,
  listening: Listening as unknown as Model<Document>,
  reading: Reading as unknown as Model<Document>,
  exampleSentence: ExampleSentence as unknown as Model<Document>,
};

function isValidContentType(value: string): value is WorkflowContentType {
  return (VALID_CONTENT_TYPES as readonly string[]).includes(value);
}

export function getContentModel(contentType: string): Model<Document> {
  if (!isValidContentType(contentType)) {
    throw ApiError.badRequest(
      `유효하지 않은 콘텐츠 타입입니다: ${contentType}. 허용: ${VALID_CONTENT_TYPES.join(', ')}`,
    );
  }
  return MODEL_MAP[contentType];
}

const ROLE_TRANSITION_RULES: Record<UserRole, Array<[ContentStatus, ContentStatus]>> = {
  learner: [],
  editor: [
    ['draft', 'in_review'],
    ['in_review', 'draft'],
    ['approved', 'draft'],
  ],
  reviewer: [
    ['draft', 'in_review'],
    ['in_review', 'draft'],
    ['approved', 'draft'],
    ['in_review', 'approved'],
  ],
  admin: [
    ['draft', 'in_review'],
    ['in_review', 'draft'],
    ['approved', 'draft'],
    ['in_review', 'approved'],
    ['approved', 'published'],
    ['published', 'archived'],
    ['archived', 'draft'],
  ],
};

export function canPerformTransition(
  role: UserRole,
  from: ContentStatus,
  to: ContentStatus
): boolean {
  const rules = ROLE_TRANSITION_RULES[role] ?? [];
  return rules.some(([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to);
}

function resolveAuditAction(from: ContentStatus, to: ContentStatus) {
  if (from === 'draft' && to === 'in_review') return 'submit_review';
  if (from === 'in_review' && to === 'approved') return 'approve';
  if (from === 'in_review' && to === 'draft') return 'reject';
  if (from === 'approved' && to === 'published') return 'publish';
  if (to === 'archived') return 'archive';
  return 'update';
}

function getIpAddress(req: Request): string | undefined {
  if (typeof req.ip === 'string' && req.ip.length > 0) return req.ip;
  return undefined;
}

function paramAsString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class WorkflowController {
  transition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = paramAsString(req.params.contentType);
      const id = paramAsString(req.params.id);
      const { targetStatus } = req.body as { targetStatus?: ContentStatus };

      if (!targetStatus) {
        throw ApiError.badRequest('targetStatus가 필요합니다.');
      }

      const ContentModel = getContentModel(contentType);
      const content = await ContentModel.findById(id);
      if (!content) {
        throw ApiError.notFound('콘텐츠를 찾을 수 없습니다.');
      }

      const currentStatus = (content as unknown as { status: ContentStatus }).status;
      if (!validateStatusTransition(currentStatus, targetStatus)) {
        throw ApiError.badRequest(
          `'${currentStatus}'에서 '${targetStatus}'(으)로 상태를 변경할 수 없습니다.`,
        );
      }

      const role = req.user!.role as UserRole;
      if (!canPerformTransition(role, currentStatus, targetStatus)) {
        throw ApiError.forbidden('이 상태 전환을 수행할 권한이 없습니다.');
      }

      const changedFields = {
        status: { from: currentStatus, to: targetStatus },
      };

      transitionContent(content as unknown as IEditorialMetadata, targetStatus, req.user!._id);
      await content.save();

      const action = resolveAuditAction(currentStatus, targetStatus);
      await createAuditLog({
        actor: req.user!._id,
        action,
        entityType: contentType,
        entityId: content._id,
        changedFields,
        metadata: {
          contentType,
          fromStatus: currentStatus,
          toStatus: targetStatus,
        },
        ipAddress: getIpAddress(req),
      });

      return ApiResponse.success(res, content, '콘텐츠 상태가 변경되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  batchTransition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contentType, ids, targetStatus } = req.body as {
        contentType?: string;
        ids?: string[];
        targetStatus?: ContentStatus;
      };

      if (!contentType || !targetStatus || !Array.isArray(ids)) {
        throw ApiError.badRequest('contentType, ids, targetStatus가 필요합니다.');
      }

      if (ids.length === 0) {
        return ApiResponse.success(res, { succeeded: 0, failed: [] }, '전환할 항목이 없습니다.');
      }

      const ContentModel = getContentModel(contentType);
      const role = req.user!.role as UserRole;
      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const id of ids) {
        try {
          const content = await ContentModel.findById(id);
          if (!content) {
            throw ApiError.notFound('콘텐츠를 찾을 수 없습니다.');
          }

          const currentStatus = (content as unknown as { status: ContentStatus }).status;
          if (!validateStatusTransition(currentStatus, targetStatus)) {
            throw ApiError.badRequest(
              `'${currentStatus}'에서 '${targetStatus}'(으)로 상태를 변경할 수 없습니다.`,
            );
          }

          if (!canPerformTransition(role, currentStatus, targetStatus)) {
            throw ApiError.forbidden('이 상태 전환을 수행할 권한이 없습니다.');
          }

          const changedFields = {
            status: { from: currentStatus, to: targetStatus },
          };

          transitionContent(content as unknown as IEditorialMetadata, targetStatus, req.user!._id);
          await content.save();

          const action = resolveAuditAction(currentStatus, targetStatus);
          await createAuditLog({
            actor: req.user!._id,
            action,
            entityType: contentType,
            entityId: content._id,
            changedFields,
            metadata: {
              contentType,
              fromStatus: currentStatus,
              toStatus: targetStatus,
              batch: true,
            },
            ipAddress: getIpAddress(req),
          });

          succeeded.push(id);
        } catch (error) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류입니다.';
          failed.push({ id, error: message });
        }
      }

      return ApiResponse.success(res, {
        succeeded: succeeded.length,
        failed,
      }, '배치 전환이 완료되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        entityType,
        entityId,
        action,
        actor,
        page = '1',
        limit = '20',
        from,
        to,
      } = req.query as Record<string, string>;

      const pageNumber = Math.max(1, parseInt(page, 10) || 1);
      const limitNumber = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (pageNumber - 1) * limitNumber;

      const filter: Record<string, unknown> = {};
      if (entityType) filter.entityType = entityType;
      if (entityId) {
        if (!Types.ObjectId.isValid(entityId)) {
          throw ApiError.badRequest('entityId 형식이 올바르지 않습니다.');
        }
        filter.entityId = new Types.ObjectId(entityId);
      }
      if (action) filter.action = action;
      if (actor) {
        if (!Types.ObjectId.isValid(actor)) {
          throw ApiError.badRequest('actor 형식이 올바르지 않습니다.');
        }
        filter.actor = new Types.ObjectId(actor);
      }

      if (from || to) {
        filter.createdAt = {};
        if (from) {
          const parsedFrom = new Date(from);
          if (Number.isNaN(parsedFrom.getTime())) {
            throw ApiError.badRequest('from 날짜 형식이 올바르지 않습니다.');
          }
          (filter.createdAt as Record<string, Date>).$gte = parsedFrom;
        }
        if (to) {
          const parsedTo = new Date(to);
          if (Number.isNaN(parsedTo.getTime())) {
            throw ApiError.badRequest('to 날짜 형식이 올바르지 않습니다.');
          }
          (filter.createdAt as Record<string, Date>).$lte = parsedTo;
        }
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate('actor', 'name email role'),
        AuditLog.countDocuments(filter),
      ]);

      return ApiResponse.paginated(res, logs, {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      });
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  getAuditLogByEntity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = paramAsString(req.params.entityType);
      const entityId = paramAsString(req.params.entityId);
      if (!entityType || !entityId) {
        throw ApiError.badRequest('entityType, entityId가 필요합니다.');
      }

      if (!Types.ObjectId.isValid(entityId)) {
        throw ApiError.badRequest('entityId 형식이 올바르지 않습니다.');
      }

      const logs = await AuditLog.find({
        entityType,
        entityId: new Types.ObjectId(entityId),
      })
        .sort({ createdAt: -1 })
        .populate('actor', 'name email role');

      return ApiResponse.success(res, logs, '감사 로그 조회 성공');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };
}

export default new WorkflowController();
