export class ApiError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new ApiError(400, code, message);
  }

  static unauthorized(message = '인증이 필요합니다.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = '접근 권한이 없습니다.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = '리소스를 찾을 수 없습니다.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static heartsDepleted() {
    return new ApiError(400, 'HEARTS_DEPLETED', '하트가 부족합니다.');
  }

  static lessonLocked() {
    return new ApiError(403, 'LESSON_LOCKED', '아직 잠긴 레슨입니다.');
  }

  static insufficientCoins() {
    return new ApiError(400, 'INSUFFICIENT_COINS', '코인이 부족합니다.');
  }

  static alreadyPremium() {
    return new ApiError(400, 'ALREADY_PREMIUM', '이미 프리미엄 구독 중입니다.');
  }

  static internal(message = '서버 내부 오류가 발생했습니다.') {
    return new ApiError(500, 'INTERNAL_ERROR', message, false);
  }
}
