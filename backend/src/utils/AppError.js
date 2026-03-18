/**
 * AppError - 비즈니스 에러 클래스 (Unit 1 공유)
 * Fail-closed 원칙: 예상된 에러만 isOperational=true
 */
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
