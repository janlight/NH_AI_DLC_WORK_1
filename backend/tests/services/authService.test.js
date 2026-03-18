const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock PrismaClient
const mockPrisma = {
  store: { findUnique: jest.fn() },
  table: { findUnique: jest.fn() },
  admin: { findUnique: jest.fn() },
  tableSession: { findFirst: jest.fn(), create: jest.fn() },
  loginAttempt: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Set env before requiring authService
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars!!';
process.env.JWT_EXPIRES_IN = '16h';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.RATE_LIMIT_MAX_ATTEMPTS = '5';
process.env.RATE_LIMIT_WINDOW_MINUTES = '15';

const authService = require('../../src/services/authService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.loginAttempt.count.mockResolvedValue(0);
    mockPrisma.loginAttempt.create.mockResolvedValue({});
  });

  describe('tableLogin', () => {
    const mockStore = { id: 'store-1', slug: 'sample-store', isActive: true };
    const mockTable = {
      id: 'table-1',
      storeId: 'store-1',
      tableNumber: 1,
      passwordHash: '',
      isActive: true,
    };
    const mockSession = { id: 'session-1', tableId: 'table-1', storeId: 'store-1', isActive: true };

    beforeEach(async () => {
      mockTable.passwordHash = await bcrypt.hash('1234', 4);
    });

    it('should login successfully with valid credentials', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.table.findUnique.mockResolvedValue(mockTable);
      mockPrisma.tableSession.findFirst.mockResolvedValue(mockSession);

      const result = await authService.tableLogin('sample-store', 1, '1234', '127.0.0.1');

      expect(result).toHaveProperty('token');
      expect(result.tableId).toBe('table-1');
      expect(result.sessionId).toBe('session-1');
      expect(result.tableNumber).toBe(1);

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.role).toBe('customer');
      expect(decoded.storeId).toBe('store-1');
    });

    it('should create new session if none active', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.table.findUnique.mockResolvedValue(mockTable);
      mockPrisma.tableSession.findFirst.mockResolvedValue(null);
      mockPrisma.tableSession.create.mockResolvedValue(mockSession);

      const result = await authService.tableLogin('sample-store', 1, '1234', '127.0.0.1');

      expect(mockPrisma.tableSession.create).toHaveBeenCalled();
      expect(result.sessionId).toBe('session-1');
    });

    it('should throw NotFoundError for invalid store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null);

      await expect(
        authService.tableLogin('invalid-store', 1, '1234', '127.0.0.1')
      ).rejects.toThrow('매장을 찾을 수 없습니다');
    });

    it('should throw NotFoundError for invalid table', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.table.findUnique.mockResolvedValue(null);

      await expect(
        authService.tableLogin('sample-store', 99, '1234', '127.0.0.1')
      ).rejects.toThrow('테이블 정보가 올바르지 않습니다');
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.table.findUnique.mockResolvedValue(mockTable);

      await expect(
        authService.tableLogin('sample-store', 1, 'wrong', '127.0.0.1')
      ).rejects.toThrow('비밀번호가 올바르지 않습니다');
    });

    it('should throw RateLimitError after 5 failed attempts', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.table.findUnique.mockResolvedValue(mockTable);
      mockPrisma.loginAttempt.count.mockResolvedValue(5);
      mockPrisma.loginAttempt.findFirst.mockResolvedValue({
        attemptedAt: new Date(),
      });

      await expect(
        authService.tableLogin('sample-store', 1, '1234', '127.0.0.1')
      ).rejects.toThrow('로그인 시도 제한 초과');
    });
  });

  describe('adminLogin', () => {
    const mockStore = { id: 'store-1', slug: 'sample-store', isActive: true };
    const mockAdmin = {
      id: 'admin-1',
      storeId: 'store-1',
      username: 'admin',
      passwordHash: '',
      role: 'OWNER',
      isActive: true,
    };

    beforeEach(async () => {
      mockAdmin.passwordHash = await bcrypt.hash('admin1234', 4);
    });

    it('should login successfully with valid credentials', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await authService.adminLogin('sample-store', 'admin', 'admin1234', '127.0.0.1');

      expect(result).toHaveProperty('token');
      expect(result.role).toBe('OWNER');
      expect(result.username).toBe('admin');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.role).toBe('OWNER');
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.admin.findUnique.mockResolvedValue(mockAdmin);

      await expect(
        authService.adminLogin('sample-store', 'admin', 'wrong', '127.0.0.1')
      ).rejects.toThrow('로그인 정보가 올바르지 않습니다');
    });

    it('should not reveal whether username or password is wrong', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.admin.findUnique.mockResolvedValue(null);

      await expect(
        authService.adminLogin('sample-store', 'nonexistent', 'pass', '127.0.0.1')
      ).rejects.toThrow('로그인 정보가 올바르지 않습니다');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign({ storeId: 'store-1', role: 'customer' }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const result = authService.verifyToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload.storeId).toBe('store-1');
    });

    it('should return TOKEN_EXPIRED for expired token', () => {
      const token = jwt.sign({ storeId: 'store-1' }, process.env.JWT_SECRET, {
        expiresIn: '0s',
      });

      const result = authService.verifyToken(token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should return INVALID_TOKEN for tampered token', () => {
      const result = authService.verifyToken('invalid.token.here');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
    });
  });
});
