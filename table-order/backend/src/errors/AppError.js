class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = '입력 검증 실패', details = null) {
    super(400, message, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '접근 권한이 없습니다') {
    super(403, message);
  }
}

class NotFoundError extends AppError {
  constructor(message = '데이터를 찾을 수 없습니다') {
    super(404, message);
  }
}

class ConflictError extends AppError {
  constructor(message = '이미 존재하는 데이터입니다') {
    super(409, message);
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter) {
    super(429, '로그인 시도 제한 초과', { retryAfter });
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};
