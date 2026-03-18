const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  // AppError (예상된 에러)
  if (err instanceof AppError) {
    logger.info(`Operational error: ${err.message}`, {
      requestId,
      context: { statusCode: err.statusCode, path: req.path },
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details || undefined,
      },
    });
  }

  // Prisma 에러
  if (err.code && err.code.startsWith('P')) {
    const prismaErrors = {
      P2002: { status: 409, message: '이미 존재하는 데이터입니다' },
      P2025: { status: 404, message: '데이터를 찾을 수 없습니다' },
    };

    const mapped = prismaErrors[err.code];
    if (mapped) {
      logger.warn(`Prisma error: ${err.code}`, {
        requestId,
        context: { code: err.code, path: req.path },
      });

      return res.status(mapped.status).json({
        success: false,
        error: { message: mapped.message },
      });
    }
  }

  // 예상치 못한 에러
  logger.error('Unexpected error', {
    requestId,
    context: {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
  });

  return res.status(500).json({
    success: false,
    error: { message: '서버 오류가 발생했습니다' },
  });
};

module.exports = errorHandler;
