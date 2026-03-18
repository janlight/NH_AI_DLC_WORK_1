# Logical Components - Unit 4: table-session

## 컴포넌트 아키텍처

```
[Express Routes: table.js]
        │
        ▼
[TableService]──────→[SSEService] (Unit 3, 직접 import)
        │
        ▼
[Prisma Client]──→[PostgreSQL]
        │
[OrderHistoryCleanupJob]──→[node-cron]
```

## 논리 컴포넌트 목록

### 1. TableRouter (`routes/table.js`)
- **역할**: HTTP 요청 라우팅, 입력 검증, 응답 포맷팅
- **의존성**: TableService, authMiddleware, validateTenant
- **엔드포인트**:
  - `GET /api/stores/:storeId/tables`
  - `POST /api/stores/:storeId/tables`
  - `POST /api/stores/:storeId/tables/:tableId/complete`
  - `DELETE /api/stores/:storeId/orders/:orderId`
  - `GET /api/stores/:storeId/tables/:tableId/order-history`

### 2. TableService (`services/tableService.js`)
- **역할**: 비즈니스 로직 오케스트레이션
- **의존성**: Prisma Client, SSEService (Unit 3)
- **패턴 적용**:
  - DP-T01 (트랜잭션) → completeTable()
  - DP-T02 (낙관적 잠금) → completeTable()
  - DP-T04 (쿼리 최적화) → getTables()
  - DP-T06 (트랜잭션 후 이벤트) → completeTable(), deleteOrder()

### 3. OrderHistoryCleanupJob (`jobs/orderHistoryCleanup.js`)
- **역할**: 만료된 OrderHistory 레코드 일일 배치 삭제
- **의존성**: Prisma Client, node-cron
- **패턴 적용**: DP-T03 (스케줄 배치)
- **스케줄**: `0 3 * * *` (매일 03:00)
- **실패 처리**: 에러 로그, 다음 배치 자동 재시도

### 4. TenantValidation (`middleware/validateTenant.js`)
- **역할**: 요청의 storeId와 JWT storeId 일치 검증
- **패턴 적용**: DP-T05 (테넌트 격리)
- **참고**: Unit 1에서 공통 미들웨어로 제공 가능, Unit 4에서 라우트에 적용

## 프론트엔드 논리 컴포넌트

### 5. ConflictRetryHandler (`utils/conflictRetry.js`)
- **역할**: 409 Conflict 응답 시 자동 재시도 로직
- **패턴 적용**: DP-T02 클라이언트 측
- **동작**: 3초 대기 → 재시도 (최대 2회) → 실패 시 수동 재시도 안내

## 파일 구조

```
backend/src/
├── routes/table.js              # TableRouter
├── services/tableService.js     # TableService
├── jobs/orderHistoryCleanup.js  # OrderHistoryCleanupJob
└── middleware/validateTenant.js  # TenantValidation (공통 가능)

frontend/src/
├── utils/conflictRetry.js       # ConflictRetryHandler
└── views/admin/TableManageView.vue
```
