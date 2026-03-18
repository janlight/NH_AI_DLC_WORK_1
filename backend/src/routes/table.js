const express = require('express');
const router = express.Router({ mergeParams: true });
const tableService = require('../services/tableService');

// GET /api/stores/:storeId/tables
router.get('/', async (req, res, next) => {
  try {
    const tables = await tableService.getTables(req.params.storeId);
    res.json(tables);
  } catch (err) {
    next(err);
  }
});

// POST /api/stores/:storeId/tables
router.post('/', async (req, res, next) => {
  try {
    const { tableNumber, password } = req.body;
    if (!tableNumber || !password) {
      return res.status(400).json({ error: '테이블 번호와 비밀번호는 필수입니다.' });
    }
    if (typeof tableNumber !== 'number' || tableNumber < 1) {
      return res.status(400).json({ error: '테이블 번호는 1 이상의 숫자여야 합니다.' });
    }
    const table = await tableService.createTable(req.params.storeId, { tableNumber, password });
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
});

// POST /api/stores/:storeId/tables/:tableId/complete
router.post('/:tableId/complete', async (req, res, next) => {
  try {
    const result = await tableService.completeTable(req.params.storeId, req.params.tableId);
    res.json({ message: '이용 완료 처리되었습니다.', ...result });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(409).json({
        error: 'CONFLICT',
        message: '현재 테이블 정리 중입니다. 잠시 후 다시 시도해주세요.',
        retryAfter: 3000,
      });
    }
    next(err);
  }
});

// DELETE /api/stores/:storeId/orders/:orderId
router.delete('/orders/:orderId', async (req, res, next) => {
  try {
    const result = await tableService.deleteOrder(req.params.storeId, req.params.orderId);
    res.json({ message: '주문이 삭제되었습니다.', ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/stores/:storeId/tables/:tableId/order-history
router.get('/:tableId/order-history', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const history = await tableService.getOrderHistory(
      req.params.storeId,
      req.params.tableId,
      { startDate, endDate }
    );
    res.json(history);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
