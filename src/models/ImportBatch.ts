import mongoose, { Document, Schema, Types } from 'mongoose';
import type { ImportStatus } from '@/utils/constants';
import { IMPORT_STATUSES } from '@/utils/constants';

export interface IImportBatchError {
  row: number;
  field: string;
  message: string;
}

export interface IImportBatch extends Omit<Document, 'errors'> {
  fileName: string;
  fileType: 'csv' | 'xlsx';
  contentType: string;
  sourceDataset?: string;
  datasetVersion?: string;
  artifactChecksum?: string;
  status: ImportStatus;
  uploadedBy: Types.ObjectId;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  errors: IImportBatchError[];
  metadata?: Record<string, unknown>;
  startedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importBatchSchema = new Schema<IImportBatch>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['csv', 'xlsx'], required: true },
    contentType: { type: String, required: true },
    sourceDataset: { type: String },
    datasetVersion: { type: String },
    artifactChecksum: { type: String },
    status: { type: String, enum: IMPORT_STATUSES, required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    errors: [
      {
        row: { type: Number, required: true },
        field: { type: String, required: true },
        message: { type: String, required: true },
      },
    ],
    metadata: { type: Schema.Types.Mixed },
    startedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

importBatchSchema.index({ createdAt: 1 });
importBatchSchema.index({ contentType: 1, status: 1, createdAt: -1 });

export default mongoose.model<IImportBatch>('ImportBatch', importBatchSchema);
