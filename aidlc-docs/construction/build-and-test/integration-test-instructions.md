# Integration Test Instructions - Unit 4: table-session

## 목적
Unit 4 (table-session)와 다른 Unit 간 상호작용을 검증합니다.

## 사전 조건
- Docker Compose로 전체 서비스 기동
- Unit 1 (core-auth): 스키마, 시드 데이터, 인증 API 동작
- Unit 3 (order-sse): OrderService, SSEService 동작

## 환경 설정
```bash
cd table-order
docker-compose up -d
cd backend && npx prisma migrate dev && npx prisma db seed
npm start
```

## 테스트 시나리오

### Scenario 1: 테이블 생성 → 인증 연동 (Unit 4 ↔ Unit 1)
1. 관리자 로그인으로 JWT 토큰 획득
2. `POST /api/stores/:storeId/tables` 호출 (JWT 헤더 포함)
3. 테이블 생성 확인
4. JWT 없이 호출 시 401 응답 확인

```bash
# 관리자 로그인
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"storeId":"store1","username":"admin","password":"admin123"}' | jq -r '.token')

# 테이블 생성
curl -X POST http://localhost:3000/api/stores/store1/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tableNumber":99,"password":"table99"}'

# 인증 없이 호출 (401 예상)
curl -X POST http://localhost:3000/api/stores/store1/tables \
  -H "Content-Type: application/json" \
  -d '{"tableNumber":100,"password":"table100"}'
```

### Scenario 2: 이용 완료 → 주문 이력 이동 (Unit 4 ↔ Unit 3)
1. 테이블 로그인 → 주문 생성 (Unit 3)
2. 이용 완료 호출 (Unit 4)
3. 현재 주문 목록 비어있음 확인
4. 과거 내역에 주문 존재 확인

```bash
# 테이블 로그인
TABLE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/table-login \
  -H "Content-Type: application/json" \
  -d '{"storeId":"store1","tableNumber":1,"password":"table1"}' | jq -r '.token')

# 주문 생성 (Unit 3)
curl -X POST http://localhost:3000/api/stores/store1/tables/TABLE_ID/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TABLE_TOKEN" \
  -d '{"items":[{"menuId":"menu1","quantity":2}]}'

# 이용 완료 (Unit 4)
curl -X POST http://localhost:3000/api/stores/store1/tables/TABLE_ID/complete \
  -H "Authorization: Bearer $TOKEN"

# 과거 내역 확인 (Unit 4)
curl http://localhost:3000/api/stores/store1/tables/TABLE_ID/order-history \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 3: 이용 완료 → SSE 이벤트 (Unit 4 ↔ Unit 3)
1. 관리자 SSE 연결 (Unit 3)
2. 이용 완료 호출 (Unit 4)
3. `table-completed` SSE 이벤트 수신 확인

```bash
# SSE 연결 (별도 터미널)
curl -N http://localhost:3000/api/stores/store1/events \
  -H "Authorization: Bearer $TOKEN"

# 이용 완료 (다른 터미널)
curl -X POST http://localhost:3000/api/stores/store1/tables/TABLE_ID/complete \
  -H "Authorization: Bearer $TOKEN"
# SSE 터미널에서 table-completed 이벤트 확인
```

### Scenario 4: 테넌트 격리 (Unit 4 ↔ Unit 1)
1. 매장 A 관리자 토큰으로 매장 B 테이블 접근 시도
2. 403 Forbidden 응답 확인

```bash
# 매장 A 토큰으로 매장 B 테이블 조회 (403 예상)
curl http://localhost:3000/api/stores/store2/tables \
  -H "Authorization: Bearer $TOKEN"
```

## 정리
```bash
docker-compose down
```
