import AuditLog from '@/models/AuditLog';
import type { AuditAction } from '@/utils/constants';
import type { Types } from 'mongoose';

interface CreateAuditLogInput {
  actor: Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId: Types.ObjectId;
  changedFields?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return AuditLog.create({
    actor: input.actor,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    changedFields: input.changedFields,
    metadata: input.metadata,
    ipAddress: input.ipAddress,
  });
}
