const { getTables, createTable, completeTable, deleteOrder, getOrderHistory } = require('../tableService');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $queryRaw: jest.fn(),
    table: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    tableSession: { findFirst: jest.fn(), update: jest.fn() },
    order: { findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    orderItem: { deleteMany: jest.fn() },
    orderHistory: { createMany: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed_pw') }));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

beforeEach(() => jest.clearAllMocks());

describe('getTables', () => {
  it('매장의 테이블 목록과 총액을 반환한다', async () => {
    const mockTables = [{ id: 't1', tableNumber: 1, currentTotal: 15000, orderCount: 2 }];
    prisma.$queryRaw.mockResolvedValue(mockTables);

    const result = await getTables('store1');
    expect(result).toEqual(mockTables);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});

describe('createTable', () => {
  it('새 테이블을 생성한다', async () => {
    prisma.table.findFirst.mockResolvedValue(null);
    prisma.table.create.mockResolvedValue({ id: 't1', tableNumber: 1 });

    const result = await createTable('store1', { tableNumber: 1, password: 'pw123' });
    expect(result.tableNumber).toBe(1);
  });

  it('중복 테이블 번호 시 409 에러를 던진다', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 't1' });

    await expect(createTable('store1', { tableNumber: 1, password: 'pw' }))
      .rejects.toMatchObject({ status: 409 });
  });
});

describe('completeTable', () => {
  it('테이블 없으면 404 에러를 던진다', async () => {
    prisma.table.findFirst.mockResolvedValue(null);

    await expect(completeTable('store1', 'bad-id'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('활성 세션 없으면 400 에러를 던진다', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 't1', currentSessionId: null });

    await expect(completeTable('store1', 't1'))
      .rejects.toMatchObject({ status: 400 });
  });

  it('정상 이용 완료 시 트랜잭션을 실행한다', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 't1', storeId: 'store1', currentSessionId: 's1', tableNumber: 1 });
    prisma.tableSession.findFirst.mockResolvedValue({ id: 's1', isActive: true, version: 0 });
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        order: { findMany: jest.fn().mockResolvedValue([]) },
        orderItem: { deleteMany: jest.fn() },
        orderHistory: { createMany: jest.fn() },
        tableSession: { update: jest.fn() },
        table: { update: jest.fn() },
      };
      return fn(tx);
    });

    const result = await completeTable('store1', 't1');
    expect(result.tableId).toBe('t1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

describe('deleteOrder', () => {
  it('주문 없으면 404 에러를 던진다', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(deleteOrder('store1', 'bad-id'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('정상 삭제 시 트랜잭션을 실행한다', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', storeId: 'store1', tableId: 't1' });
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        orderItem: { deleteMany: jest.fn() },
        order: { delete: jest.fn() },
      };
      return fn(tx);
    });

    const result = await deleteOrder('store1', 'o1');
    expect(result.orderId).toBe('o1');
  });
});

describe('getOrderHistory', () => {
  it('테이블 없으면 404 에러를 던진다', async () => {
    prisma.table.findFirst.mockResolvedValue(null);

    await expect(getOrderHistory('store1', 'bad-id'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('과거 주문 내역을 반환한다', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 't1' });
    const mockHistory = [{ id: 'h1', orderNumber: '001', totalAmount: 10000 }];
    prisma.orderHistory.findMany.mockResolvedValue(mockHistory);

    const result = await getOrderHistory('store1', 't1');
    expect(result).toEqual(mockHistory);
  });

  it('날짜 필터를 적용한다', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 't1' });
    prisma.orderHistory.findMany.mockResolvedValue([]);

    await getOrderHistory('store1', 't1', { startDate: '2026-03-01', endDate: '2026-03-18' });
    const whereArg = prisma.orderHistory.findMany.mock.calls[0][0].where;
    expect(whereArg.orderedAt).toBeDefined();
  });
});
