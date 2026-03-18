const express = require('express');
const request = require('supertest');
const tableRouter = require('../table');

jest.mock('../../services/tableService', () => ({
  getTables: jest.fn(),
  createTable: jest.fn(),
  completeTable: jest.fn(),
  deleteOrder: jest.fn(),
  getOrderHistory: jest.fn(),
}));

const tableService = require('../../services/tableService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/stores/:storeId/tables', tableRouter);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/stores/:storeId/tables', () => {
  it('200 - 테이블 목록을 반환한다', async () => {
    tableService.getTables.mockResolvedValue([{ id: 't1', tableNumber: 1 }]);
    const res = await request(createApp()).get('/api/stores/s1/tables');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/stores/:storeId/tables', () => {
  it('201 - 테이블을 생성한다', async () => {
    tableService.createTable.mockResolvedValue({ id: 't1', tableNumber: 1 });
    const res = await request(createApp())
      .post('/api/stores/s1/tables')
      .send({ tableNumber: 1, password: 'pw123' });
    expect(res.status).toBe(201);
  });

  it('400 - 필수 필드 누락 시 에러', async () => {
    const res = await request(createApp())
      .post('/api/stores/s1/tables')
      .send({});
    expect(res.status).toBe(400);
  });

  it('400 - 잘못된 테이블 번호', async () => {
    const res = await request(createApp())
      .post('/api/stores/s1/tables')
      .send({ tableNumber: -1, password: 'pw' });
    expect(res.status).toBe(400);
  });

  it('409 - 중복 테이블 번호', async () => {
    const err = new Error('중복'); err.status = 409;
    tableService.createTable.mockRejectedValue(err);
    const res = await request(createApp())
      .post('/api/stores/s1/tables')
      .send({ tableNumber: 1, password: 'pw' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/stores/:storeId/tables/:tableId/complete', () => {
  it('200 - 이용 완료 처리', async () => {
    tableService.completeTable.mockResolvedValue({ tableId: 't1', tableNumber: 1 });
    const res = await request(createApp()).post('/api/stores/s1/tables/t1/complete');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('이용 완료');
  });

  it('409 - 낙관적 잠금 충돌', async () => {
    const err = new Error('conflict'); err.code = 'P2025';
    tableService.completeTable.mockRejectedValue(err);
    const res = await request(createApp()).post('/api/stores/s1/tables/t1/complete');
    expect(res.status).toBe(409);
    expect(res.body.retryAfter).toBe(3000);
  });
});

describe('DELETE /api/stores/:storeId/tables/orders/:orderId', () => {
  it('200 - 주문 삭제', async () => {
    tableService.deleteOrder.mockResolvedValue({ orderId: 'o1', tableId: 't1' });
    const res = await request(createApp()).delete('/api/stores/s1/tables/orders/o1');
    expect(res.status).toBe(200);
  });

  it('404 - 주문 없음', async () => {
    const err = new Error('없음'); err.status = 404;
    tableService.deleteOrder.mockRejectedValue(err);
    const res = await request(createApp()).delete('/api/stores/s1/tables/orders/o1');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/stores/:storeId/tables/:tableId/order-history', () => {
  it('200 - 과거 내역 반환', async () => {
    tableService.getOrderHistory.mockResolvedValue([{ id: 'h1' }]);
    const res = await request(createApp()).get('/api/stores/s1/tables/t1/order-history');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('200 - 날짜 필터 적용', async () => {
    tableService.getOrderHistory.mockResolvedValue([]);
    const res = await request(createApp())
      .get('/api/stores/s1/tables/t1/order-history?startDate=2026-03-01&endDate=2026-03-18');
    expect(res.status).toBe(200);
    expect(tableService.getOrderHistory).toHaveBeenCalledWith('s1', 't1', {
      startDate: '2026-03-01', endDate: '2026-03-18',
    });
  });
});
