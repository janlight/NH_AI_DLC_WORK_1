const authService = require('../services/authService');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

/**
 * JWT 토큰 검증 + 테넌트 격리 미들웨어
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('인증이 필요합니다');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('유효하지 않은 인증 형식입니다');
    }

    const token = authHeader.split(' ')[1];
    const result = authService.verifyToken(token);

    if (!result.valid) {
      if (result.error === 'TOKEN_EXPIRED') {
        throw new UnauthorizedError('토큰이 만료되었습니다');
      }
      throw new UnauthorizedError('유효하지 않은 토큰입니다');
    }

    req.user = result.payload;

    // 테넌트 격리: URL의 storeId와 토큰의 storeId 비교
    if (req.params.storeId && req.user.storeId !== req.params.storeId) {
      throw new ForbiddenError('접근 권한이 없습니다');
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 */
const roleMiddleware = (allowedRoles) => (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('인증이 필요합니다');
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError('접근 권한이 없습니다');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authMiddleware, roleMiddleware };
