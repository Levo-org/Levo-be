import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import {
  uploadImportFile,
  confirmImportBatch,
  cancelImportBatch,
  listImportBatches,
  getImportBatchDetail,
  getImportBatchErrors,
  summarizeBatchErrors,
} from '@/services/import.service';

function paramAsString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class ImportController {
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) throw ApiError.badRequest('업로드 파일이 필요합니다.');

      const contentType = req.query.contentType as string;
      const targetLanguage = req.query.targetLanguage as string;
      if (!contentType) throw ApiError.badRequest('contentType이 필요합니다.');
      if (!targetLanguage) throw ApiError.badRequest('targetLanguage이 필요합니다.');

      const fileType = file.originalname.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'csv';

      const result = await uploadImportFile({
        fileName: file.originalname,
        fileType,
        contentType,
        targetLanguage,
        uploaderId: req.user!._id,
        buffer: file.buffer,
        ipAddress: req.ip,
      });

      return ApiResponse.created(res, {
        batchId: result.batch._id,
        fileName: result.batch.fileName,
        contentType: result.batch.contentType,
        totalRows: result.batch.totalRows,
        validRows: result.batch.validRows,
        invalidRows: result.batch.invalidRows,
        duplicateRows: result.batch.duplicateRows,
        preview: result.preview,
        errors: result.batch.errors,
      }, '업로드 및 검증 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = paramAsString(req.params.batchId);
      const result = await confirmImportBatch({
        batchId,
        actorId: req.user!._id,
        ipAddress: req.ip,
      });

      return ApiResponse.success(res, {
        importedRows: result.importedRows,
        skippedRows: result.skippedRows,
        batch: result.batch,
      }, '임포트 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = paramAsString(req.params.batchId);
      const batch = await cancelImportBatch({
        batchId,
        actorId: req.user!._id,
        ipAddress: req.ip,
      });

      return ApiResponse.success(res, { batch }, '임포트 취소 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const contentType = req.query.contentType as string | undefined;

      const { batches, total } = await listImportBatches({ page, limit, status, contentType });

      return ApiResponse.paginated(res, batches, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, '임포트 배치 조회 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = paramAsString(req.params.batchId);
      const batch = await getImportBatchDetail(batchId);
      const errorSummary = summarizeBatchErrors(batch.errors || []);

      return ApiResponse.success(res, { batch, errorSummary }, '임포트 배치 상세 조회 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  errors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = paramAsString(req.params.batchId);
      const errors = await getImportBatchErrors(batchId);

      return ApiResponse.success(res, { errors }, '임포트 오류 목록 조회 완료');
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };
}
