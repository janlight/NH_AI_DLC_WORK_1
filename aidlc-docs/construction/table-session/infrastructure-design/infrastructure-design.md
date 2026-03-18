# Infrastructure Design - Unit 4: table-session

## 인프라 개요

Unit 4는 모놀리스 내 모듈로, Unit 1에서 구축한 공유 인프라 위에서 동작합니다.

## 공유 인프라 (Unit 1 제공)

| 컴포넌트 | 서비스 | 포트 |
|---|---|---|
| Express.js 서버 | Docker: backend | 3000 |
| PostgreSQL | Docker: postgres | 5432 |
| Vue.js 개발 서버 | Docker: frontend | 5173 |

## Unit 4 고유 인프라 매핑

### 1. 배치 작업 (OrderHistoryCleanupJob)
- **실행 환경**: Express 서버 프로세스 내 (node-cron)
- **별도 인프라 불필요**: 앱 시작 시 cron 스케줄 등록
- **스케줄**: `0 3 * * *` (매일 03:00)
- **리소스 영향**: 삭제 배치 1000건씩 처리, DB 부하 최소화

### 2. DB 마이그레이션 (Prisma)
- **인덱스 추가** (Unit 4 관련):
  - `Table(storeId)`
  - `TableSession(tableId, isActive)`
  - `OrderHistory(storeId, tableId, expiresAt)`
  - `OrderHistory(expiresAt)`
- **참고**: 스키마 전체는 Unit 1에서 관리, Unit 4는 인덱스 요구사항만 전달

### 3. API 라우트 등록
- Unit 1의 `app.js`에 테이블 라우트 등록:
  - `app.use('/api/stores/:storeId/tables', tableRouter)`
- 인증 미들웨어 + 테넌트 검증 미들웨어 적용

### 4. 파일 시스템
- Unit 4는 파일 시스템 사용 없음 (이미지 업로드는 Unit 2)

## 환경 변수 (Unit 4 관련)

| 변수 | 설명 | 기본값 |
|---|---|---|
| `CLEANUP_CRON_SCHEDULE` | 배치 삭제 스케줄 | `0 3 * * *` |
| `CLEANUP_BATCH_SIZE` | 배치당 삭제 건수 | `1000` |
| `ORDER_HISTORY_RETENTION_DAYS` | 주문 이력 보존 일수 | `90` |
