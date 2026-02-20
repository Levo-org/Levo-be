import { Response } from 'express';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success(res: Response, data: any, message = '성공', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static created(res: Response, data: any, message = '생성 완료') {
    return res.status(201).json({
      success: true,
      data,
      message,
    });
  }

  static paginated(res: Response, data: any[], pagination: PaginationInfo, message = '조회 성공') {
    return res.status(200).json({
      success: true,
      data,
      pagination,
      message,
    });
  }

  static error(res: Response, statusCode: number, code: string, message: string) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}
