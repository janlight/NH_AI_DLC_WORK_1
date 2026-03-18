# Performance Test Instructions - All Units

---

## Unit 3: order-sse 성능 테스트

### 성능 요구사항

| 항목 | 목표 | 측정 방법 |
|---|---|---|
| 주문 생성 API 응답 | p95 < 1초 | 주문 생성 요청 → 응답 반환 |
| SSE 이벤트 전달 | < 2초 | 주문 DB 저장 → SSE 클라이언트 수신 |
| 주문 조회 API 응답 | < 500ms | 조회 요청 → 응답 반환 |
| 동시 주문 처리 | 매장당 30~100 테이블 | 큐 대기 시간 포함 1초 이내 |

### 테스트 도구

```bash
npm install -g autocannon
```

### 1. 주문 생성 API 부하 테스트

```bash
autocannon -c 10 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -b '{"items":[{"menuId":"menu-1","quantity":2}]}' \
  http://localhost:3000/api/stores/store-1/tables/table-1/orders
```

### 2. 주문 조회 API 부하 테스트

```bash
autocannon -c 20 -d 30 \
  -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/stores/store-1/orders
```

---

## Unit 4: table-session 성능 테스트

### 성능 요구사항
- `GET /api/stores/:storeId/tables`: 100개 테이블 기준 1초 이내 (NFR-T04)
- `POST /api/stores/:storeId/tables/:tableId/complete`: 60초 타임아웃 내 완료 (NFR-T01)

### 1. 테이블 목록 조회 성능

```bash
for i in {1..10}; do
  curl -o /dev/null -s -w "Response: %{time_total}s\n" \
    http://localhost:3000/api/stores/store1/tables \
    -H "Authorization: Bearer $TOKEN"
done
```

### 2. 이용 완료 트랜잭션 성능

```bash
curl -o /dev/null -s -w "Response: %{time_total}s\n" \
  -X POST http://localhost:3000/api/stores/store1/tables/TABLE_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

---

## 결과 분석

성능 목표 미달 시 확인 사항:
1. DB 쿼리 최적화 (인덱스 확인)
2. 인메모리 큐 타임아웃 조정
3. SSE 브로드캐스트 비동기 처리 확인
4. Prisma 쿼리 N+1 문제 확인
5. 배치 크기 조정
