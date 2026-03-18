const { cleanupExpiredHistory } = require('../orderHistoryCleanup');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    orderHistory: { deleteMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

beforeEach(() => jest.clearAllMocks());

describe('cleanupExpiredHistory', () => {
  it('만료된 레코드를 삭제한다', async () => {
    prisma.orderHistory.deleteMany.mockResolvedValue({ count: 5 });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cleanupExpiredHistory();

    expect(prisma.orderHistory.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
    consoleSpy.mockRestore();
  });

  it('삭제할 레코드가 없으면 로그를 출력하지 않는다', async () => {
    prisma.orderHistory.deleteMany.mockResolvedValue({ count: 0 });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cleanupExpiredHistory();

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('삭제 완료'));
    consoleSpy.mockRestore();
  });

  it('에러 발생 시 로그를 기록하고 중단한다', async () => {
    prisma.orderHistory.deleteMany.mockRejectedValue(new Error('DB error'));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    await cleanupExpiredHistory();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('배치 삭제 실패'), 'DB error');
    errorSpy.mockRestore();
  });
});
