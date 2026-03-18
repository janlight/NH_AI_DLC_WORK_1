# Tech Stack Decisions - Unit 3: order-sse

## 확정 기술 스택 (프로젝트 전체 결정사항)

| 영역 | 기술 | 비고 |
|---|---|---|
| 백엔드 런타임 | Node.js | Express.js 프레임워크 |
| ORM | Prisma | 타입 안전, 마이그레이션 |
| DB | PostgreSQL | Docker Compose로 실행 |
| 프론트엔드 | Vue.js 3 + Pinia | Composition API |
| UI | Tailwind CSS | 유틸리티 기반 |
| 실시간 통신 | SSE (Server-Sent Events) | 네이티브 EventSource API |
| 인증 | JWT | Unit 1에서 제공 |

## Unit 3 추가 기술 결정

### 1. 동시 주문 처리: 인메모리 큐

| 항목 | 결정 |
|---|---|
| 방식 | 인메모리 Promise 기반 큐 |
| 범위 | 매장별 독립 큐 (Map<storeId, Queue>) |
| 외부 의존성 | 없음 (순수 JavaScript) |
| 선택 근거 | MVP 단계에서 Redis 등 외부 의존성 불필요, 단일 서버 환경에서 충분 |
| 한계 | 서버 재시작 시 큐 초기화 (DB 데이터는 보존), 멀티 인스턴스 미지원 |

구현 패턴:
```javascript
// 매장별 큐: 순차 실행 보장
const storeQueues = new Map(); // Map<storeId, Promise>

async function enqueueOrder(storeId, orderFn) {
  const prev = storeQueues.get(storeId) || Promise.resolve();
  const next = prev.then(() => orderFn()).catch((err) => { throw err; });
  storeQueues.set(storeId, next.catch(() => {})); // 에러 전파 방지
  return next;
}
```

### 2. SSE 구현

| 항목 | 결정 |
|---|---|
| 라이브러리 | 네이티브 Express Response (별도 라이브러리 없음) |
| 클라이언트 | 브라우저 네이티브 EventSource API |
| Heartbeat | 30초 간격 |
| 재연결 | 클라이언트 측 지수 백오프 (최대 10회, 최대 30초 간격) |
| 선택 근거 | SSE는 단방향 통신으로 충분, WebSocket 불필요 |

### 3. 테스트 프레임워크

| 항목 | 결정 |
|---|---|
| 프레임워크 | Jest |
| 단위 테스트 | OrderService, SSEService 메서드별 |
| 통합 테스트 | supertest로 API 엔드포인트 테스트 |
| 모킹 | Prisma Client 모킹 (jest.mock) |
| 커버리지 목표 | Service 레이어 80% |

### 4. 로깅

| 항목 | 결정 |
|---|---|
| 방식 | console.log / console.error |
| 라이브러리 | 없음 (MVP) |
| 로그 대상 | 주문 CRUD, SSE 연결/해제, 에러 |
| 선택 근거 | MVP 단계에서 충분, 향후 winston 등 도입 가능 |

## 향후 확장 고려사항

| 현재 (MVP) | 향후 확장 시 |
|---|---|
| 인메모리 큐 | Redis + BullMQ (멀티 인스턴스) |
| console.log | winston + 구조화 로깅 |
| SSE 제한 없음 | 연결 수 제한 + 모니터링 |
| Jest | Vitest (Vue 생태계 통합 시) |
