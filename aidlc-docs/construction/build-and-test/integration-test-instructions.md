# Integration Test Instructions - Unit 3: order-sse

## 목적
Unit 3의 API 엔드포인트가 서비스 레이어와 올바르게 연동되는지 검증합니다.

## 테스트 환경

### 사전 조건
- PostgreSQL 실행 중 (Docker Compose)
- Prisma 마이그레이션 완료
- 시드 데이터 적용

### 환경 설정

```bash
# 테스트용 DB (Unit 1에서 구성)
export DATABASE_URL=postgresql://user:password@localhost:5432/tableorder_test
export JWT_SECRET=test-secret
export NODE_ENV=test
```

## 실행

```bash
cd backend
npm run test:integration

# 또는 개별 실행
npx jest tests/integration/orderApi.test.js
```

## 테스트 시나리오

### Scenario 1: 주문 생성 플로우
1. 고객 JWT로 `POST /api/stores/:storeId/tables/:tableId/orders` 호출
2. 유효한 메뉴 항목으로 주문 생성
3. 201 응답 + 주문번호 반환 확인
4. SSE 브로드캐스트 호출 확인

### Scenario 2: 주문 상태 변경 플로우
1. 관리자 JWT로 `PUT /api/stores/:storeId/orders/:orderId/status` 호출
2. PENDING → PREPARING 전이 확인 (200)
3. PENDING → COMPLETED 전이 거부 확인 (400)
4. SSE 브로드캐스트 호출 확인

### Scenario 3: 주문 삭제 플로우
1. 관리자 JWT로 `DELETE /api/stores/:storeId/orders/:orderId` 호출
2. 주문 + OrderItem 삭제 확인
3. 테이블 총액 재계산 확인
4. SSE 브로드캐스트 호출 확인

### Scenario 4: 테넌트 격리
1. store-1 토큰으로 store-2 API 호출
2. 403 STORE_MISMATCH 에러 확인

### Scenario 5: 입력 검증
1. 빈 장바구니로 주문 생성 시도 → 400
2. 유효하지 않은 수량으로 주문 생성 시도 → 400
3. 유효하지 않은 상태값으로 상태 변경 시도 → 400

## 예상 결과

| 시나리오 | 테스트 수 | 설명 |
|---|---|---|
| 주문 생성 | 4 | 성공, 빈 장바구니, 수량 오류, 매장 불일치 |
| 상태 변경 | 2 | 유효한 전이, 유효하지 않은 상태값 |
| 주문 삭제 | 2 | 성공, 존재하지 않는 주문 |
| 조회 | 2 | 매장 전체, 테이블별 |
| **합계** | **~10** | |

## Unit 간 통합 테스트 (Unit 1 완료 후)

Unit 1 통합 후 추가 테스트:

1. **인증 통합**: 실제 JWT 토큰으로 API 호출
2. **Prisma 통합**: 실제 DB에 주문 생성/조회/삭제
3. **SSE 통합**: 실제 EventSource 연결 + 이벤트 수신
4. **Unit 4 통합**: 이용 완료 시 주문 → OrderHistory 이동
