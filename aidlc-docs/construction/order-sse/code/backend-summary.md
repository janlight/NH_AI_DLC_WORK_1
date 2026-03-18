# Backend Code Summary - Unit 3: order-sse

## 생성된 파일

| 파일 | 역할 |
|---|---|
| `backend/src/services/orderQueueService.js` | 매장별 인메모리 큐 (backpressure, 타임아웃) |
| `backend/src/services/sseService.js` | SSE 연결 관리, 브로드캐스트, heartbeat |
| `backend/src/services/orderService.js` | 주문 비즈니스 로직 (Result 패턴) |
| `backend/src/validators/orderValidators.js` | 입력 검증 함수 |
| `backend/src/routes/orderRoutes.js` | 주문 API 라우터 |
| `backend/src/routes/sseRoutes.js` | SSE 스트림 라우터 |

## 테스트 파일

| 파일 | 유형 |
|---|---|
| `backend/tests/unit/orderQueueService.test.js` | 단위 테스트 |
| `backend/tests/unit/sseService.test.js` | 단위 테스트 |
| `backend/tests/unit/orderService.test.js` | 단위 테스트 |
| `backend/tests/integration/orderApi.test.js` | API 통합 테스트 |

## Unit 1 통합 시 필요 작업
1. `app.js`에서 orderRouter, sseRouter 등록
2. `setPrisma(prismaClient)` 호출로 Prisma 주입
3. authMiddleware 적용 (현재 라우터에 직접 적용 필요)
