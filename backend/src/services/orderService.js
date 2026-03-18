/**
 * OrderService - 주문 비즈니스 로직
 * 
 * 패턴: Result Object Pattern
 * - 모든 메서드가 { success, data } 또는 { success, error } 반환
 * - 서비스에서 throw하지 않음 (예상치 못한 시스템 에러만 예외)
 */

const { enqueueOrder } = require('./orderQueueService');
const sseService = require('./sseService');

// 유효한 상태 전이 맵
const VALID_TRANSITIONS = {
  PENDING: 'PREPARING',
  PREPARING: 'COMPLETED'
};

/**
 * 주문번호 생성 (YYYYMMDD-NNN)
 */
async function generateOrderNumber(prisma, storeId) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: {
      storeId,
      orderNumber: { startsWith: prefix }
    },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true }
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-')[1], 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`;
}

/**
 * 주문 생성
 */
async function createOrder(prisma, storeId, tableId, items, user) {
  // 세션 검증
  const session = await prisma.tableSession.findFirst({
    where: { storeId, tableId, isActive: true }
  });
  if (!session) {
    return {
      success: false,
      error: { code: 'SESSION_NOT_FOUND', message: '유효한 테이블 세션이 없습니다', status: 404 }
    };
  }

  // 메뉴 검증 및 스냅샷 수집
  const menuSnapshots = [];
  for (const item of items) {
    const menu = await prisma.menu.findFirst({
      where: { id: item.menuId, storeId }
    });
    if (!menu) {
      return {
        success: false,
        error: { code: 'MENU_NOT_FOUND', message: `메뉴를 찾을 수 없습니다: ${item.menuId}`, status: 400 }
      };
    }
    if (!menu.isActive) {
      return {
        success: false,
        error: { code: 'MENU_INACTIVE', message: `비활성 메뉴입니다: ${menu.name}`, status: 400 }
      };
    }
    menuSnapshots.push({
      menuId: menu.id,
      menuName: menu.name,
      price: menu.price,
      quantity: item.quantity,
      subtotal: menu.price * item.quantity
    });
  }

  // 큐를 통한 순차 처리
  const result = await enqueueOrder(storeId, async () => {
    const orderNumber = await generateOrderNumber(prisma, storeId);
    const totalAmount = menuSnapshots.reduce((sum, s) => sum + s.subtotal, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          storeId,
          tableId,
          sessionId: session.id,
          status: 'PENDING',
          totalAmount
        }
      });

      await tx.orderItem.createMany({
        data: menuSnapshots.map((s) => ({
          orderId: newOrder.id,
          menuId: s.menuId,
          menuName: s.menuName,
          price: s.price,
          quantity: s.quantity,
          subtotal: s.subtotal
        }))
      });

      return newOrder;
    });

    return { ...order, items: menuSnapshots };
  });

  // SSE 브로드캐스트 (비동기, await 하지 않음)
  sseService.broadcast(storeId, 'new-order', {
    order: result,
    tableId,
    orderNumber: result.orderNumber
  });

  return { success: true, data: result };
}

/**
 * 현재 세션 주문 조회 (고객)
 */
async function getTableOrders(prisma, storeId, tableId, sessionId) {
  const orders = await prisma.order.findMany({
    where: { storeId, tableId, sessionId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  return { success: true, data: orders };
}

/**
 * 매장 전체 주문 조회 (관리자)
 */
async function getStoreOrders(prisma, storeId) {
  // 활성 세션이 있는 테이블별 주문 조회
  const activeSessions = await prisma.tableSession.findMany({
    where: { storeId, isActive: true },
    include: {
      table: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const tableOrderSummaries = activeSessions.map((session) => {
    const totalAmount = session.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      tableId: session.tableId,
      tableNumber: session.table.tableNumber,
      sessionId: session.id,
      totalAmount,
      recentOrders: session.orders.slice(0, 3),
      orderCount: session.orders.length
    };
  });

  return { success: true, data: tableOrderSummaries };
}

/**
 * 주문 상태 변경 (관리자)
 */
async function updateOrderStatus(prisma, storeId, orderId, newStatus) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId }
  });

  if (!order) {
    return {
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다', status: 404 }
    };
  }

  // 상태 전이 검증
  const allowedNext = VALID_TRANSITIONS[order.status];
  if (allowedNext !== newStatus) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `${order.status} → ${newStatus} 상태 전이는 허용되지 않습니다`,
        status: 400,
        details: { currentStatus: order.status, requestedStatus: newStatus }
      }
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });

  // SSE 브로드캐스트
  sseService.broadcast(storeId, 'order-status', {
    orderId,
    orderNumber: updated.orderNumber,
    status: newStatus,
    tableId: updated.tableId
  });

  return { success: true, data: updated };
}

/**
 * 주문 삭제 (관리자)
 */
async function deleteOrder(prisma, storeId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: true }
  });

  if (!order) {
    return {
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다', status: 404 }
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });

  // 테이블 총 주문액 재계산
  const remainingOrders = await prisma.order.findMany({
    where: { storeId, tableId: order.tableId, sessionId: order.sessionId }
  });
  const newTotalAmount = remainingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // SSE 브로드캐스트
  sseService.broadcast(storeId, 'order-deleted', {
    orderId,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    newTotalAmount
  });

  return { success: true, data: { orderId, orderNumber: order.orderNumber } };
}

/**
 * 과거 주문 내역 조회 (관리자)
 */
async function getOrderHistory(prisma, storeId, tableId, dateFilter) {
  const where = { storeId, tableId };

  if (dateFilter) {
    where.orderedAt = {};
    if (dateFilter.startDate) where.orderedAt.gte = new Date(dateFilter.startDate);
    if (dateFilter.endDate) where.orderedAt.lte = new Date(dateFilter.endDate);
  }

  const history = await prisma.orderHistory.findMany({
    where,
    orderBy: { orderedAt: 'desc' }
  });

  return { success: true, data: history };
}

module.exports = {
  createOrder,
  getTableOrders,
  getStoreOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderHistory,
  generateOrderNumber,
  VALID_TRANSITIONS
};
