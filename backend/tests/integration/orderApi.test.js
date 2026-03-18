/**
 * Order API 통합 테스트 (supertest)
 * 
 * Note: Unit 1의 Express 앱 구조와 Prisma 설정이 필요합니다.
 * 아래는 독립 실행 가능한 테스트 구조이며, Unit 1 통합 시 app import를 조정합니다.
 */

const express = require('express');
const request = require('supertest');
const { router: orderRouter, setPrisma } = require('../../src/routes/orderRoutes');
const { router: sseRouter } = require('../../src/routes/sseRoutes');

// 테스트용 Express 앱 생성
function createTestApp(mockPrisma, mockUser = { storeId: 'store-1', role: 'admin' }) {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req, res, next) => {
    req.user = mockUser;
    next();
  });

  setPrisma(mockPrisma);
  app.use('/api/stores/:storeId', orderRouter);
  app.use('/api/stores/:storeId', sseRouter);

  // Global error handler
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류' }
    });
  });

  return app;
}

// Mock Prisma
function createMockPrisma() {
  return {
    tableSession: { findFirst: jest.fn(), findMany: jest.fn() },
    menu: { findFirst: jest.fn() },
    order: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    orderItem: { createMany: jest.fn(), deleteMany: jest.fn() },
    orderHistory: { findMany: jest.fn() },
    $transaction: jest.fn(async (fn) => {
      const tx = {
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'o1', orderNumber: '20260318-001', storeId: 'store-1',
            tableId: 't1', sessionId: 's1', status: 'PENDING', totalAmount: 18000
          }),
          delete: jest.fn()
        },
        orderItem: { createMany: jest.fn(), deleteMany: jest.fn() }
      };
      return fn(tx);
    })
  };
}

// SSE 모킹
jest.mock('../../src/services/sseService', () => ({
  broadcast: jest.fn(),
  subscribe: jest.fn().mockReturnValue('client-1')
}));

describe('Order API 통합 테스트', () => {
  describe('POST /api/stores/:storeId/tables/:tableId/orders', () => {
    it('유효한 주문을 생성하면 201을 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.tableSession.findFirst.mockResolvedValue({ id: 's1' });
      prisma.menu.findFirst.mockResolvedValue({ id: 'm1', name: '비빔밥', price: 9000, isActive: true, storeId: 'store-1' });
      prisma.order.findFirst.mockResolvedValue(null); // 오늘 첫 주문

      const app = createTestApp(prisma, { storeId: 'store-1', role: 'customer', sessionId: 's1' });

      const res = await request(app)
        .post('/api/stores/store-1/tables/t1/orders')
        .send({ items: [{ menuId: 'm1', quantity: 2 }] });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('빈 장바구니면 400을 반환한다', async () => {
      const prisma = createMockPrisma();
      const app = createTestApp(prisma, { storeId: 'store-1', role: 'customer' });

      const res = await request(app)
        .post('/api/stores/store-1/tables/t1/orders')
        .send({ items: [] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('수량이 0이면 400을 반환한다', async () => {
      const prisma = createMockPrisma();
      const app = createTestApp(prisma, { storeId: 'store-1', role: 'customer' });

      const res = await request(app)
        .post('/api/stores/store-1/tables/t1/orders')
        .send({ items: [{ menuId: 'm1', quantity: 0 }] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('다른 매장 접근 시 403을 반환한다', async () => {
      const prisma = createMockPrisma();
      const app = createTestApp(prisma, { storeId: 'store-2', role: 'customer' });

      const res = await request(app)
        .post('/api/stores/store-1/tables/t1/orders')
        .send({ items: [{ menuId: 'm1', quantity: 1 }] });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('STORE_MISMATCH');
    });
  });

  describe('PUT /api/stores/:storeId/orders/:orderId/status', () => {
    it('유효한 상태 변경이면 200을 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.order.findFirst.mockResolvedValue({ id: 'o1', storeId: 'store-1', status: 'PENDING', tableId: 't1' });
      prisma.order.update.mockResolvedValue({ id: 'o1', orderNumber: '20260318-001', status: 'PREPARING', tableId: 't1' });

      const app = createTestApp(prisma);

      const res = await request(app)
        .put('/api/stores/store-1/orders/o1/status')
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PREPARING');
    });

    it('유효하지 않은 상태값이면 400을 반환한다', async () => {
      const prisma = createMockPrisma();
      const app = createTestApp(prisma);

      const res = await request(app)
        .put('/api/stores/store-1/orders/o1/status')
        .send({ status: 'INVALID' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/stores/:storeId/orders/:orderId', () => {
    it('주문 삭제 성공 시 200을 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1', storeId: 'store-1', orderNumber: '20260318-001',
        tableId: 't1', sessionId: 's1', items: []
      });
      prisma.order.findMany.mockResolvedValue([]);

      const app = createTestApp(prisma);

      const res = await request(app)
        .delete('/api/stores/store-1/orders/o1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('존재하지 않는 주문이면 404를 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.order.findFirst.mockResolvedValue(null);

      const app = createTestApp(prisma);

      const res = await request(app)
        .delete('/api/stores/store-1/orders/bad');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('GET /api/stores/:storeId/orders', () => {
    it('매장 전체 주문을 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.tableSession.findMany.mockResolvedValue([]);

      const app = createTestApp(prisma);

      const res = await request(app)
        .get('/api/stores/store-1/orders');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/stores/:storeId/tables/:tableId/orders', () => {
    it('테이블 주문 목록을 반환한다', async () => {
      const prisma = createMockPrisma();
      prisma.order.findMany.mockResolvedValue([]);

      const app = createTestApp(prisma, { storeId: 'store-1', role: 'customer', sessionId: 's1' });

      const res = await request(app)
        .get('/api/stores/store-1/tables/t1/orders');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
