const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { tableLoginSchema, adminLoginSchema } = require('../validators/authSchemas');

/**
 * POST /api/auth/table-login
 * 테이블 로그인 (공개)
 */
router.post(
  '/table-login',
  validate(tableLoginSchema),
  async (req, res, next) => {
    try {
      const { storeSlug, tableNumber, password } = req.body;
      const ipAddress = req.ip;
      const result = await authService.tableLogin(storeSlug, tableNumber, password, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/admin-login
 * 관리자 로그인 (공개)
 */
router.post(
  '/admin-login',
  validate(adminLoginSchema),
  async (req, res, next) => {
    try {
      const { storeSlug, username, password } = req.body;
      const ipAddress = req.ip;
      const result = await authService.adminLogin(storeSlug, username, password, ipAddress);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/verify
 * 토큰 검증 (인증 필요)
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = router;
