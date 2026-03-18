/**
 * Order API 라우터
 * 
 * 기본 경로: /api/stores/:storeId
 * 인증: Unit 1의 authMiddleware 사용 (스텁 제공)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const orderService = require('../services/orderService');
const { validateCreateOrder, validateStatusUpdate } = require('../validators/orderValidators');

// Prisma 클라이언트 (Unit 1에서 제공, 여기서는 주입 패턴 사용)
let prisma;
function setPrisma(prismaClient) {
  prisma = prismaClient;
}

/**
 * 테넌트 격리 검증
 */
function verifyStoreAccess(req, res) {
  if (req.user && req.user.storeId !== req.params.storeId) {
    res.status(403).json({
      success: false,
      error: { code: 'STORE_MISMATCH', message: '매장 접근 권한이 없습니다' }
    });
    return false;
  }
  return true;
}

// ─── 고객 API ───

/**
 * POST /api/stores/:storeId/tables/:tableId/orders
 * 주문 생성 (고객)
 */
router.post('/tables/:tableId/orders', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const errors = validateCreateOrder(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '입력 검증 실패', details: errors }
      });
    }

    const { storeId, tableId } = req.params;
    const result = await orderService.createOrder(prisma, storeId, tableId, req.body.items, req.user);

    if (result.success) {
      res.status(201).json({ success: true, data: result.data });
    } else {
      res.status(result.error.status).json({ success: false, error: result.error });
    }
  } catch (error) {
    // 큐 관련 에러 (QUEUE_FULL, ORDER_TIMEOUT)
    if (error.code && error.status) {
      return res.status(error.status).json({ success: false, error });
    }
    next(error);
  }
});

/**
 * GET /api/stores/:storeId/tables/:tableId/orders
 * 현재 세션 주문 조회 (고객)
 */
router.get('/tables/:tableId/orders', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const { storeId, tableId } = req.params;
    const sessionId = req.user?.sessionId;
    const result = await orderService.getTableOrders(prisma, storeId, tableId, sessionId);

    res.json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
});

// ─── 관리자 API ───

/**
 * GET /api/stores/:storeId/orders
 * 매장 전체 주문 조회 (관리자)
 */
router.get('/orders', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const result = await orderService.getStoreOrders(prisma, req.params.storeId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/stores/:storeId/orders/:orderId/status
 * 주문 상태 변경 (관리자)
 */
router.put('/orders/:orderId/status', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const errors = validateStatusUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '입력 검증 실패', details: errors }
      });
    }

    const { storeId, orderId } = req.params;
    const result = await orderService.updateOrderStatus(prisma, storeId, orderId, req.body.status);

    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(result.error.status).json({ success: false, error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/stores/:storeId/orders/:orderId
 * 주문 삭제 (관리자)
 */
router.delete('/orders/:orderId', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const { storeId, orderId } = req.params;
    const result = await orderService.deleteOrder(prisma, storeId, orderId);

    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(result.error.status).json({ success: false, error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stores/:storeId/tables/:tableId/order-history
 * 과거 주문 내역 조회 (관리자)
 */
router.get('/tables/:tableId/order-history', async (req, res, next) => {
  try {
    if (!verifyStoreAccess(req, res)) return;

    const { storeId, tableId } = req.params;
    const dateFilter = {};
    if (req.query.startDate) dateFilter.startDate = req.query.startDate;
    if (req.query.endDate) dateFilter.endDate = req.query.endDate;

    const result = await orderService.getOrderHistory(
      prisma, storeId, tableId,
      Object.keys(dateFilter).length > 0 ? dateFilter : undefined
    );

    res.json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, setPrisma };
