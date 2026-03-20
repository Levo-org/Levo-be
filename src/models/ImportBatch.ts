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
  status: ImportStatus;
  uploadedBy: Types.ObjectId;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  errors: IImportBatchError[];
  metadata?: Record<string, unknown>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importBatchSchema = new Schema<IImportBatch>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['csv', 'xlsx'], required: true },
    contentType: { type: String, required: true },
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
    completedAt: { type: Date },
  },
  { timestamps: true }
);

importBatchSchema.index({ createdAt: 1 });

export default mongoose.model<IImportBatch>('ImportBatch', importBatchSchema);
