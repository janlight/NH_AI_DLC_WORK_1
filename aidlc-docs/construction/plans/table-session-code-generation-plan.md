# Code Generation Plan - Unit 4: table-session

## Unit 컨텍스트

- **Unit**: table-session (테이블 + 세션 관리)
- **프로젝트 유형**: Greenfield 모놀리스
- **코드 위치**: `/Users/AI-DLC/aidlc-workshop/table-order/`
- **의존성**: Unit 1 (Prisma 스키마, 인증 미들웨어), Unit 3 (OrderService, SSEService)
- **스토리**: US-07-01, US-07-02, US-07-03, US-07-04

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 코드 생성 계획 수립
- [x] Step 3: 승인 요청 - 승인 완료 (2026-03-18T15:23:51+09:00)

### Part 2: 생성

#### Backend - Service Layer
- [x] Step 4: `backend/src/services/tableService.js` 생성
  - getTables(storeId) - 테이블 목록 + 현재 세션 총액 조회 (US-07-01)
  - createTable(storeId, tableData) - 테이블 설정 (US-07-01)
  - completeTable(storeId, tableId) - 이용 완료 트랜잭션 (US-07-03)
  - deleteOrder(storeId, orderId) - 주문 삭제 (US-07-02)
  - getOrderHistory(storeId, tableId, dateFilter) - 과거 내역 조회 (US-07-04)
  - 낙관적 잠금 (DP-T02), 트랜잭션 60초 타임아웃 (DP-T01)

#### Backend - Service Layer Unit Tests
- [x] Step 5: `backend/src/services/__tests__/tableService.test.js` 생성
  - getTables: 테이블 목록 + 총액 조회 테스트
  - createTable: 정상 생성, 중복 번호 에러 테스트
  - completeTable: 정상 완료, 활성 세션 없음 에러, 낙관적 잠금 충돌 테스트
  - deleteOrder: 정상 삭제, 주문 없음 에러 테스트
  - getOrderHistory: 정상 조회, 날짜 필터, 만료 레코드 제외 테스트

#### Backend - Service Layer Summary
- [x] Step 6: `aidlc-docs/construction/table-session/code/service-layer-summary.md` 생성

#### Backend - API Route Layer
- [x] Step 7: `backend/src/routes/table.js` 생성
  - GET /api/stores/:storeId/tables
  - POST /api/stores/:storeId/tables
  - POST /api/stores/:storeId/tables/:tableId/complete
  - DELETE /api/stores/:storeId/orders/:orderId
  - GET /api/stores/:storeId/tables/:tableId/order-history
  - 입력 검증, 에러 응답 포맷팅, 409 Conflict 처리

#### Backend - API Route Layer Unit Tests
- [x] Step 8: `backend/src/routes/__tests__/table.test.js` 생성
  - 각 엔드포인트 정상/에러 응답 테스트
  - 입력 검증 테스트
  - 인증/테넌트 검증 테스트

#### Backend - API Route Layer Summary
- [x] Step 9: `aidlc-docs/construction/table-session/code/api-layer-summary.md` 생성

#### Backend - Batch Job
- [x] Step 10: `backend/src/jobs/orderHistoryCleanup.js` 생성
  - node-cron 스케줄 (환경 변수 기반)
  - 배치 삭제 (1000건씩)
  - 에러 로그 처리

#### Backend - Batch Job Unit Tests
- [x] Step 11: `backend/src/jobs/__tests__/orderHistoryCleanup.test.js` 생성
  - 만료 레코드 삭제 테스트
  - 배치 크기 제한 테스트
  - 에러 처리 테스트

#### Frontend - Components
- [x] Step 12: 프론트엔드 컴포넌트 생성
  - `frontend/src/views/admin/TableManageView.vue`
  - `frontend/src/components/admin/TableSetupModal.vue`
  - `frontend/src/components/admin/OrderDeleteConfirm.vue`
  - `frontend/src/components/admin/TableCompleteConfirm.vue`
  - `frontend/src/components/admin/OrderHistoryModal.vue`
  - `frontend/src/utils/conflictRetry.js`

#### Frontend - Component Unit Tests
- [x] Step 13: 프론트엔드 테스트 생성
  - `frontend/src/views/admin/__tests__/TableManageView.test.js`
  - `frontend/src/utils/__tests__/conflictRetry.test.js`

#### Frontend - Components Summary
- [x] Step 14: `aidlc-docs/construction/table-session/code/frontend-summary.md` 생성

#### Documentation
- [x] Step 15: 최종 검증 및 승인 요청

## 스토리 추적

| 스토리 | 구현 파일 | 상태 |
|---|---|---|
| US-07-01 (테이블 초기 설정) | tableService.js, table.js, TableSetupModal.vue | [x] |
| US-07-02 (주문 삭제) | tableService.js, table.js, OrderDeleteConfirm.vue | [x] |
| US-07-03 (이용 완료) | tableService.js, table.js, TableCompleteConfirm.vue | [x] |
| US-07-04 (과거 내역 조회) | tableService.js, table.js, OrderHistoryModal.vue | [x] |
