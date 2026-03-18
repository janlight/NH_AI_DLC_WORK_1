const request = require('supertest');

// Mock authService
const mockAuthService = {
  tableLogin: jest.fn(),
  adminLogin: jest.fn(),
  verifyToken: jest.fn(),
};

jest.mock('../../src/services/authService', () => mockAuthService);

process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars!!';

const app = require('../../src/app');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/table-login', () => {
    it('should return 200 with token on successful login', async () => {
      mockAuthService.tableLogin.mockResolvedValue({
        token: 'jwt-token',
        tableId: 'table-1',
        sessionId: 'session-1',
        tableNumber: 1,
      });

      const res = await request(app)
        .post('/api/auth/table-login')
        .send({ storeSlug: 'sample-store', tableNumber: 1, password: '1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('jwt-token');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/table-login')
        .send({ storeSlug: 'sample-store' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid storeSlug format', async () => {
      const res = await request(app)
        .post('/api/auth/table-login')
        .send({ storeSlug: 'INVALID SLUG!', tableNumber: 1, password: '1234' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/admin-login', () => {
    it('should return 200 with token on successful login', async () => {
      mockAuthService.adminLogin.mockResolvedValue({
        token: 'admin-jwt-token',
        role: 'OWNER',
        username: 'admin',
      });

      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({ storeSlug: 'sample-store', username: 'admin', password: 'admin1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('OWNER');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({ storeSlug: 'sample-store' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/auth/verify');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
    });
  });
});
