import { Schema, Types } from 'mongoose';
import type { SchemaDefinition } from 'mongoose';
import type { ContentStatus } from '@/utils/constants';
import { CONTENT_STATUSES } from '@/utils/constants';

export interface IEditorialMetadata {
  status: ContentStatus;
  sourceType: 'manual' | 'csv_import' | 'xlsx_import' | 'seed_import' | 'api' | 'dataset_import';
  sourceReference?: string;
  sourceDataset?: string;
  datasetVersion?: string;
  artifactChecksum?: string;
  license?: string;
  datasetManaged?: boolean;
  translationStatus?: 'pending' | 'complete' | 'failed';
  translationProvider?: string;
  translationVersion?: string;
  translationError?: string;
  lastTranslatedAt?: Date;
  createdBy?: Types.ObjectId;
  lastEditedBy?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date;
  importBatchId?: Types.ObjectId;
}

const DEFAULT_CONTENT_STATUS: ContentStatus = 'draft';
const DEFAULT_SOURCE_TYPE: IEditorialMetadata['sourceType'] = 'manual';

export const editorialMetadataSchema: SchemaDefinition<IEditorialMetadata> = {
  status: { type: String, enum: CONTENT_STATUSES, default: DEFAULT_CONTENT_STATUS, index: true },
  sourceType: {
    type: String,
    enum: ['manual', 'csv_import', 'xlsx_import', 'seed_import', 'api', 'dataset_import'],
    default: DEFAULT_SOURCE_TYPE,
  },
  sourceReference: { type: String },
  sourceDataset: { type: String },
  datasetVersion: { type: String },
  artifactChecksum: { type: String },
  license: { type: String },
  datasetManaged: { type: Boolean, default: false, index: true },
  translationStatus: {
    type: String,
    enum: ['pending', 'complete', 'failed'],
    default: 'pending',
    index: true,
  },
  translationProvider: { type: String },
  translationVersion: { type: String },
  translationError: { type: String },
  lastTranslatedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
  importBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch' },
};
