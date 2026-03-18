const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { UnauthorizedError, NotFoundError, RateLimitError } = require('../errors/AppError');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '16h';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS, 10) || 5;
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;

class AuthService {
  /**
   * 테이블 로그인
   */
  async tableLogin(storeSlug, tableNumber, password, ipAddress) {
    // 매장 조회
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store || !store.isActive) {
      throw new NotFoundError('매장을 찾을 수 없습니다');
    }

    // 테이블 조회
    const table = await prisma.table.findUnique({
      where: { storeId_tableNumber: { storeId: store.id, tableNumber } },
    });
    if (!table || !table.isActive) {
      throw new NotFoundError('테이블 정보가 올바르지 않습니다');
    }

    // Rate Limit 확인
    const identifier = `${store.id}:table:${tableNumber}`;
    await this._checkRateLimit(identifier);

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, table.passwordHash);
    if (!isValid) {
      await this._recordAttempt(identifier, false, ipAddress);
      throw new UnauthorizedError('비밀번호가 올바르지 않습니다');
    }
    await this._recordAttempt(identifier, true, ipAddress);

    // 세션 처리 (활성 세션 재사용 또는 새 세션 생성)
    let session = await prisma.tableSession.findFirst({
      where: { tableId: table.id, isActive: true },
    });
    if (!session) {
      session = await prisma.tableSession.create({
        data: { tableId: table.id, storeId: store.id, isActive: true },
      });
      // Table의 currentSessionId 업데이트
      await prisma.table.update({
        where: { id: table.id },
        data: { currentSessionId: session.id },
      });
    }

    // JWT 발급
    const token = jwt.sign(
      {
        storeId: store.id,
        tableId: table.id,
        sessionId: session.id,
        tableNumber: table.tableNumber,
        role: 'customer',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info('Table login successful', {
      context: { storeId: store.id, tableNumber, sessionId: session.id },
    });

    return { token, tableId: table.id, sessionId: session.id, tableNumber: table.tableNumber };
  }

  /**
   * 관리자 로그인
   */
  async adminLogin(storeSlug, username, password, ipAddress) {
    // 매장 조회
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store || !store.isActive) {
      throw new NotFoundError('매장을 찾을 수 없습니다');
    }

    // 관리자 조회
    const admin = await prisma.admin.findUnique({
      where: { storeId_username: { storeId: store.id, username } },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedError('로그인 정보가 올바르지 않습니다');
    }

    // Rate Limit 확인
    const identifier = `${store.id}:admin:${username}`;
    await this._checkRateLimit(identifier);

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      await this._recordAttempt(identifier, false, ipAddress);
      throw new UnauthorizedError('로그인 정보가 올바르지 않습니다');
    }
    await this._recordAttempt(identifier, true, ipAddress);

    // JWT 발급
    const token = jwt.sign(
      {
        storeId: store.id,
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info('Admin login successful', {
      context: { storeId: store.id, username },
    });

    return { token, role: admin.role, username: admin.username };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return { valid: true, payload };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return { valid: false, error: 'TOKEN_EXPIRED' };
      }
      return { valid: false, error: 'INVALID_TOKEN' };
    }
  }

  /**
   * 비밀번호 해싱
   */
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Rate Limit 확인 (Sliding Window)
   */
  async _checkRateLimit(identifier) {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 60 * 1000);

    const failCount = await prisma.loginAttempt.count({
      where: {
        identifier,
        attemptedAt: { gte: windowStart },
        success: false,
      },
    });

    if (failCount >= RATE_LIMIT_MAX) {
      const lastFail = await prisma.loginAttempt.findFirst({
        where: { identifier, success: false },
        orderBy: { attemptedAt: 'desc' },
      });

      if (lastFail) {
        const retryAfter = Math.ceil(
          (lastFail.attemptedAt.getTime() + RATE_LIMIT_WINDOW * 60 * 1000 - Date.now()) / 1000
        );
        if (retryAfter > 0) {
          logger.warn('Rate limit exceeded', { context: { identifier, failCount } });
          throw new RateLimitError(retryAfter);
        }
      }
    }
  }

  /**
   * 로그인 시도 기록
   */
  async _recordAttempt(identifier, success, ipAddress) {
    await prisma.loginAttempt.create({
      data: { identifier, success, ipAddress },
    });
  }
}

module.exports = new AuthService();
