import { ApiError } from '@/utils/ApiError';
import type { ContentStatus } from '@/utils/constants';
import { VALID_STATUS_TRANSITIONS } from '@/utils/constants';
import type { IEditorialMetadata } from '@/types/editorial';
import { Types } from 'mongoose';

export function validateStatusTransition(
  currentStatus: ContentStatus,
  targetStatus: ContentStatus
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
  return allowed.includes(targetStatus);
}

export function transitionContent<T extends IEditorialMetadata>(
  doc: T,
  targetStatus: ContentStatus,
  userId: Types.ObjectId
): T {
  const currentStatus = doc.status;
  if (!validateStatusTransition(currentStatus, targetStatus)) {
    throw ApiError.badRequest(
      `'${currentStatus}'에서 '${targetStatus}'(으)로 상태를 변경할 수 없습니다.`
    );
  }

  doc.status = targetStatus;

  if (targetStatus === 'approved') {
    doc.reviewedBy = userId;
  }

  if (targetStatus === 'published') {
    doc.publishedBy = userId;
    doc.publishedAt = new Date();
  }

  return doc;
}
