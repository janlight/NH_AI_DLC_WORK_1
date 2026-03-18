# Integration Test Instructions - All Units

## 목적
Unit 간 상호작용 및 API 엔드포인트 통합을 검증합니다.

## 사전 조건
- Docker Compose로 전체 서비스 기동
- Prisma 마이그레이션 및 시드 데이터 완료

## 환경 설정

```bash
docker-compose up -d
cd backend && npx prisma migrate deploy && npx prisma db seed
```

---

## Unit 3: order-sse 통합 테스트

```bash
cd backend
npm run test:integration
# 또는
npx jest tests/integration/orderApi.test.js
```

### 시나리오

| 시나리오 | 테스트 수 | 설명 |
|---|---|---|
| 주문 생성 | 4 | 성공, 빈 장바구니, 수량 오류, 매장 불일치 |
| 상태 변경 | 2 | 유효한 전이, 유효하지 않은 상태값 |
| 주문 삭제 | 2 | 성공, 존재하지 않는 주문 |
| 조회 | 2 | 매장 전체, 테이블별 |
| **합계** | **~10** | |

---

## Unit 4: table-session 통합 테스트

### Scenario 1: 테이블 생성 → 인증 연동 (Unit 4 ↔ Unit 1)
1. 관리자 로그인으로 JWT 토큰 획득
2. `POST /api/stores/:storeId/tables` 호출 (JWT 헤더 포함)
3. 테이블 생성 확인
4. JWT 없이 호출 시 401 응답 확인

### Scenario 2: 이용 완료 → 주문 이력 이동 (Unit 4 ↔ Unit 3)
1. 테이블 로그인 → 주문 생성 (Unit 3)
2. 이용 완료 호출 (Unit 4)
3. 현재 주문 목록 비어있음 확인
4. 과거 내역에 주문 존재 확인

### Scenario 3: 이용 완료 → SSE 이벤트 (Unit 4 ↔ Unit 3)
1. 관리자 SSE 연결 (Unit 3)
2. 이용 완료 호출 (Unit 4)
3. `table-completed` SSE 이벤트 수신 확인

### Scenario 4: 테넌트 격리 (Unit 4 ↔ Unit 1)
1. 매장 A 관리자 토큰으로 매장 B 테이블 접근 시도
2. 403 Forbidden 응답 확인

---

## 정리
```bash
docker-compose down
```
