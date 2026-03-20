import mongoose from 'mongoose';
import AuditLog from '@/models/AuditLog';
import ImportBatch from '@/models/ImportBatch';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from '../setup';
import { transitionContent, validateStatusTransition } from '@/utils/contentStatus';
import type { IEditorialMetadata } from '@/types/editorial';
import type { ContentStatus } from '@/utils/constants';

describe('Editorial metadata and audit models', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it('creates audit log with required fields', async () => {
    const { user } = await createTestUser();
    const entityId = new mongoose.Types.ObjectId();

    const log = await AuditLog.create({
      actor: user._id,
      action: 'create',
      entityType: 'Vocabulary',
      entityId,
      metadata: { reason: 'seed' },
    });

    expect(log.actor.toString()).toBe(user._id.toString());
    expect(log.action).toBe('create');
    expect(log.entityType).toBe('Vocabulary');
    expect(log.entityId.toString()).toBe(entityId.toString());
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('audit log has no updatedAt timestamp', async () => {
    const { user } = await createTestUser();
    const entityId = new mongoose.Types.ObjectId();

    const log = await AuditLog.create({
      actor: user._id,
      action: 'update',
      entityType: 'Grammar',
      entityId,
    });

    const logWithUpdatedAt = log as typeof log & { updatedAt?: Date };
    expect(logWithUpdatedAt.updatedAt).toBeUndefined();
  });

  it('creates import batch and tracks status', async () => {
    const { user } = await createTestUser();

    const batch = await ImportBatch.create({
      fileName: 'vocab.csv',
      fileType: 'csv',
      contentType: 'vocabulary',
      status: 'pending',
      uploadedBy: user._id,
      totalRows: 10,
      validRows: 8,
      invalidRows: 2,
      duplicateRows: 1,
      importedRows: 0,
      errors: [{ row: 2, field: 'word', message: 'missing' }],
    });

    expect(batch.status).toBe('pending');
    expect(batch.errors).toHaveLength(1);

    batch.status = 'completed';
    batch.importedRows = 8;
    batch.completedAt = new Date();
    await batch.save();

    const reloaded = await ImportBatch.findById(batch._id);
    expect(reloaded?.status).toBe('completed');
    expect(reloaded?.importedRows).toBe(8);
  });

  it('validates allowed status transitions', () => {
    const allowed: Array<[ContentStatus, ContentStatus]> = [
      ['draft', 'in_review'],
      ['in_review', 'approved'],
      ['approved', 'published'],
      ['published', 'archived'],
    ];

    for (const [from, to] of allowed) {
      expect(validateStatusTransition(from, to)).toBe(true);
    }
  });

  it('rejects invalid status transitions', () => {
    expect(validateStatusTransition('draft', 'published')).toBe(false);
    expect(validateStatusTransition('published', 'in_review')).toBe(false);
  });

  it('tracks reviewer and publisher on transitions', () => {
    const userId = new mongoose.Types.ObjectId();

    const doc: IEditorialMetadata = {
      status: 'draft',
      sourceType: 'manual',
    };

    transitionContent(doc, 'in_review', userId);
    expect(doc.status).toBe('in_review');
    expect(doc.reviewedBy).toBeUndefined();

    transitionContent(doc, 'approved', userId);
    expect(doc.status).toBe('approved');
    expect(doc.reviewedBy?.toString()).toBe(userId.toString());

    transitionContent(doc, 'published', userId);
    expect(doc.status).toBe('published');
    expect(doc.publishedBy?.toString()).toBe(userId.toString());
    expect(doc.publishedAt).toBeInstanceOf(Date);
  });
});
