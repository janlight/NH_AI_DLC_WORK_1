# Performance Test Instructions - Unit 3: order-sse

## 성능 요구사항 (NFR)

| 항목 | 목표 | 측정 방법 |
|---|---|---|
| 주문 생성 API 응답 | p95 < 1초 | 주문 생성 요청 → 응답 반환 |
| SSE 이벤트 전달 | < 2초 | 주문 DB 저장 → SSE 클라이언트 수신 |
| 주문 조회 API 응답 | < 500ms | 조회 요청 → 응답 반환 |
| 동시 주문 처리 | 매장당 30~100 테이블 | 큐 대기 시간 포함 1초 이내 |

## 테스트 도구

MVP 단계에서는 간단한 스크립트 기반 테스트를 권장합니다:

```bash
# autocannon (Node.js HTTP 벤치마크 도구)
npm install -g autocannon

# 또는 k6 (더 정교한 부하 테스트)
# https://k6.io/docs/getting-started/installation/
```

## 테스트 시나리오

### 1. 주문 생성 API 부하 테스트

```bash
# 10 동시 연결, 30초간 주문 생성 API 호출
autocannon -c 10 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -b '{"items":[{"menuId":"menu-1","quantity":2}]}' \
  http://localhost:3000/api/stores/store-1/tables/table-1/orders
```

목표:
- p95 응답 시간 < 1000ms
- 에러율 < 1%

### 2. 주문 조회 API 부하 테스트

```bash
# 20 동시 연결, 30초간 조회 API 호출
autocannon -c 20 -d 30 \
  -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/stores/store-1/orders
```

목표:
- p95 응답 시간 < 500ms

### 3. SSE 이벤트 전달 시간 측정

```javascript
// 수동 테스트 스크립트
const EventSource = require('eventsource');
const axios = require('axios');

const es = new EventSource('http://localhost:3000/api/stores/store-1/events?token=<admin-token>');

es.addEventListener('new-order', (e) => {
  const receiveTime = Date.now();
  const data = JSON.parse(e.data);
  console.log(`SSE 수신 지연: ${receiveTime - sendTime}ms`);
});

const sendTime = Date.now();
axios.post('http://localhost:3000/api/stores/store-1/tables/table-1/orders', {
  items: [{ menuId: 'menu-1', quantity: 1 }]
}, { headers: { Authorization: 'Bearer <customer-token>' } });
```

목표:
- SSE 이벤트 전달 < 2000ms

### 4. 인메모리 큐 동시성 테스트

```javascript
// 같은 매장에 50개 동시 주문 생성
const promises = Array.from({ length: 50 }, (_, i) =>
  axios.post(`http://localhost:3000/api/stores/store-1/tables/table-${i % 10}/orders`, {
    items: [{ menuId: 'menu-1', quantity: 1 }]
  }, { headers: { Authorization: `Bearer <token-${i}>` } })
);

const start = Date.now();
const results = await Promise.allSettled(promises);
const elapsed = Date.now() - start;

const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;
console.log(`50개 동시 주문: ${succeeded} 성공, ${failed} 실패, ${elapsed}ms`);
```

목표:
- 50개 동시 주문 모두 성공 (큐 제한 50개 이내)
- 전체 처리 시간 합리적 범위 내

## 결과 분석

성능 목표 미달 시 확인 사항:
1. DB 쿼리 최적화 (인덱스 확인)
2. 인메모리 큐 타임아웃 조정
3. SSE 브로드캐스트 비동기 처리 확인
4. Prisma 쿼리 N+1 문제 확인
