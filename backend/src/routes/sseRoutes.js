/**
 * SSE 스트림 라우터
 * 
 * 기본 경로: /api/stores/:storeId
 * 인증: 관리자 JWT 필수
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const sseService = require('../services/sseService');

/**
 * GET /api/stores/:storeId/events
 * SSE 스트림 연결 (관리자)
 */
router.get('/events', (req, res) => {
  // 테넌트 격리 검증
  if (req.user && req.user.storeId !== req.params.storeId) {
    return res.status(403).json({
      success: false,
      error: { code: 'STORE_MISMATCH', message: '매장 접근 권한이 없습니다' }
    });
  }

  const { storeId } = req.params;

  // SSE 연결 등록
  const clientId = sseService.subscribe(storeId, req, res);

  console.log(`SSE 라우터: 클라이언트 연결 [store: ${storeId}, client: ${clientId}]`);
});

module.exports = { router };
