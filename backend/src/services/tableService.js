const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTables(storeId) {
  const tables = await prisma.$queryRaw`
    SELECT t.id, t."tableNumber", t."currentSessionId", t."createdAt",
      COALESCE(SUM(o."totalAmount"), 0)::int as "currentTotal",
      COUNT(o.id)::int as "orderCount"
    FROM "Table" t
    LEFT JOIN "Order" o ON o."tableId" = t.id 
      AND o."sessionId" = t."currentSessionId"
    WHERE t."storeId" = ${storeId}
    GROUP BY t.id
    ORDER BY t."tableNumber"
  `;
  return tables;
}

async function createTable(storeId, { tableNumber, password }) {
  const existing = await prisma.table.findFirst({
    where: { storeId, tableNumber },
  });
  if (existing) {
    const error = new Error('테이블 번호가 이미 존재합니다.');
    error.status = 409;
    throw error;
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.table.create({
    data: { storeId, tableNumber, password: hashedPassword },
  });
}

async function completeTable(storeId, tableId) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, storeId },
  });
  if (!table) {
    const error = new Error('테이블을 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }
  if (!table.currentSessionId) {
    const error = new Error('활성 세션이 없습니다.');
    error.status = 400;
    throw error;
  }

  const session = await prisma.tableSession.findFirst({
    where: { id: table.currentSessionId, isActive: true },
  });
  if (!session) {
    const error = new Error('활성 세션이 없습니다.');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(process.env.ORDER_HISTORY_RETENTION_DAYS || 90) * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { tableId, sessionId: session.id },
      include: { items: true },
    });

    if (orders.length > 0) {
      await tx.orderHistory.createMany({
        data: orders.map((order) => ({
          storeId,
          tableId,
          sessionId: session.id,
          orderNumber: order.orderNumber,
          items: order.items.map((i) => ({
            menuName: i.menuName,
            quantity: i.quantity,
            price: i.price,
          })),
          totalAmount: order.totalAmount,
          orderStatus: order.status,
          orderedAt: order.createdAt,
          completedAt: now,
          expiresAt,
        })),
      });

      const orderIds = orders.map((o) => o.id);
      await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.tableSession.update({
      where: { id: session.id, version: session.version },
      data: { isActive: false, completedAt: now, version: { increment: 1 } },
    });

    await tx.table.update({
      where: { id: tableId },
      data: { currentSessionId: null },
    });
  }, { timeout: 60000 });

  return { tableId, tableNumber: table.tableNumber };
}

async function deleteOrder(storeId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });
  if (!order) {
    const error = new Error('주문을 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });

  return { orderId, tableId: order.tableId };
}

async function getOrderHistory(storeId, tableId, dateFilter = {}) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, storeId },
  });
  if (!table) {
    const error = new Error('테이블을 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }

  const where = {
    storeId,
    tableId,
    expiresAt: { gt: new Date() },
  };

  if (dateFilter.startDate) {
    where.orderedAt = { ...where.orderedAt, gte: new Date(dateFilter.startDate) };
  }
  if (dateFilter.endDate) {
    where.orderedAt = { ...where.orderedAt, lte: new Date(dateFilter.endDate) };
  }

  return prisma.orderHistory.findMany({
    where,
    orderBy: { orderedAt: 'desc' },
  });
}

module.exports = { getTables, createTable, completeTable, deleteOrder, getOrderHistory };
