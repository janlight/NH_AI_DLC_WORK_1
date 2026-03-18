# NFR Design Patterns - Unit 3: order-sse

## 1. 복원력 패턴 (Resilience Patterns)

### RP-001: SSE Fire-and-Forget 브로드캐스트
- **적용 대상**: SSEService.broadcast()
- **패턴**: Fire-and-Forget
- **설명**: SSE 이벤트 전송 실패 시 해당 클라이언트만 풀에서 제거하고 로그 기록. 재시도 없음.
- **근거**: SSE 클라이언트는 자체 재연결 로직(지수 백오프)을 가지고 있어 서버 측 재시도 불필요. 브로드캐스트 실패가 주문 처리 흐름에 영향을 주지 않아야 함.

```
broadcast(storeId, eventName, data):
  clients = getClients(storeId)
  for each client in clients:
    try:
      client.res.write(formatSSE(eventName, data))
    catch (error):
      console.error(`SSE 전송 실패 [clientId: ${client.clientId}]`, error)
      removeClient(storeId, client.clientId)  // 실패 클라이언트 제거
  // 호출자에게 에러 전파하지 않음
```

### RP-002: 클라이언트 측 SSE 재연결
- **적용 대상**: useSSE composable
- **패턴**: Exponential Backoff with Circuit Breaker
- **설명**: 연결 실패 시 지수 백오프(1초~30초)로 최대 10회 재시도. 10회 초과 시 자동 재연결 중단(Circuit Open), 수동 버튼으로만 재시도 가능.
- **근거**: 서버 장애 시 무한 재연결 방지. 사용자에게 명확한 상태 피드백 제공.

```
재연결 흐름:
  연결 실패 → retryCount++
  retryCount <= 10:
    delay = min(1000 * 2^(retryCount-1), 30000)
    setTimeout(reconnect, delay)
    status = 'reconnecting'
  retryCount > 10:
    status = 'disconnected'
    수동 "다시 연결" 버튼 표시
  수동 버튼 클릭:
    retryCount = 0
    reconnect()
  연결 성공:
    retryCount = 0
    status = 'connected'
    전체 데이터 새로고침
```

### RP-003: 트랜잭션 롤백
- **적용 대상**: OrderService.createOrder(), OrderService.deleteOrder()
- **패턴**: Transaction Rollback
- **설명**: Order + OrderItem 생성/삭제를 Prisma 트랜잭션으로 묶어 원자성 보장. 실패 시 전체 롤백.

```
prisma.$transaction(async (tx) => {
  const order = await tx.order.create(...)
  const items = await tx.orderItem.createMany(...)
  return { order, items }
})
// 트랜잭션 내 어디서든 에러 발생 시 전체 롤백
```

---

## 2. 성능 패턴 (Performance Patterns)

### PP-001: 매장별 인메모리 큐 (Queue with Backpressure)
- **적용 대상**: 주문 생성 동시성 제어
- **패턴**: Promise Chain Queue + Backpressure
- **설명**: 매장별 독립 큐로 주문 생성을 순차 처리. 큐 길이 제한(50개)과 개별 타임아웃(5초)으로 성능 보호.

```
const storeQueues = new Map()  // Map<storeId, { promise, length }>

async function enqueueOrder(storeId, orderFn):
  queue = storeQueues.get(storeId) || { promise: Promise.resolve(), length: 0 }

  // Backpressure: 큐 길이 제한
  if queue.length >= 50:
    throw { code: 'QUEUE_FULL', message: '주문 처리 대기열이 가득 찼습니다', status: 429 }

  queue.length++

  next = queue.promise.then(async () => {
    try:
      // 타임아웃 보호
      return await withTimeout(orderFn(), 5000)
    finally:
      queue.length--
  })

  queue.promise = next.catch(() => {})  // 에러 전파 방지
  storeQueues.set(storeId, queue)
  return next
```

- **큐 길이 제한**: 매장당 최대 50개 대기
- **초과 시**: HTTP 429 Too Many Requests 반환
- **타임아웃**: 개별 주문 처리 5초 초과 시 타임아웃 에러

### PP-002: 비동기 SSE 브로드캐스트
- **적용 대상**: 주문 생성/상태변경/삭제 후 SSE 이벤트 전송
- **패턴**: Async Fire-and-Forget
- **설명**: SSE 브로드캐스트를 비동기로 실행하여 API 응답 시간에 영향을 주지 않음.

```
// 주문 생성 후
const order = await createOrderInDB(data)
// SSE 브로드캐스트는 await 하지 않음
sseService.broadcast(storeId, 'new-order', orderData)
return { success: true, data: order }  // 즉시 응답
```

### PP-003: SSE Heartbeat
- **적용 대상**: SSE 연결 유지
- **패턴**: Keep-Alive Heartbeat
- **간격**: 30초
- **설명**: 프록시/로드밸런서의 유휴 연결 타임아웃 방지. 클라이언트 측 연결 상태 감지 보조.

```
// 클라이언트 등록 시 heartbeat 시작
const heartbeatInterval = setInterval(() => {
  try:
    res.write(':heartbeat\n\n')
  catch:
    clearInterval(heartbeatInterval)
    removeClient(storeId, clientId)
}, 30000)
```

---

## 3. 보안 패턴 (Security Patterns)

### SP-001: JWT 인증 미들웨어 체인
- **적용 대상**: 모든 주문 API, SSE 엔드포인트
- **패턴**: Middleware Chain Authentication
- **설명**: Unit 1의 authMiddleware를 라우트에 적용. 역할별 접근 제어.

```
라우트 구성:
  고객 API:
    POST /orders → [authMiddleware('customer'), orderController.create]
    GET /tables/:tableId/orders → [authMiddleware('customer'), orderController.getTableOrders]

  관리자 API:
    GET /orders → [authMiddleware('admin'), orderController.getStoreOrders]
    PUT /orders/:orderId/status → [authMiddleware('admin'), orderController.updateStatus]
    DELETE /orders/:orderId → [authMiddleware('admin'), orderController.delete]
    GET /events → [authMiddleware('admin'), sseController.subscribe]
```

### SP-002: 테넌트 격리 검증
- **적용 대상**: 모든 데이터 접근
- **패턴**: Tenant Isolation Guard
- **설명**: JWT의 storeId와 URL 파라미터의 storeId 일치 여부를 검증. 모든 DB 쿼리에 storeId 조건 포함.

```
// 라우트 핸들러에서 검증
const tokenStoreId = req.user.storeId
const paramStoreId = req.params.storeId
if (tokenStoreId !== paramStoreId):
  return { success: false, error: { code: 'STORE_MISMATCH', message: '매장 접근 권한이 없습니다' } }

// 모든 Prisma 쿼리에 storeId 포함
prisma.order.findMany({ where: { storeId: tokenStoreId, ... } })
```

### SP-003: 입력 검증 (라우트 핸들러 직접 검증)
- **적용 대상**: 주문 생성, 상태 변경 API
- **패턴**: Inline Validation
- **설명**: 라우트 핸들러에서 if문으로 입력값 타입/범위를 직접 검증. MVP 단계에서 외부 라이브러리 의존성 없이 구현.

```
// 주문 생성 검증
function validateCreateOrder(body):
  errors = []
  if (!Array.isArray(body.items) || body.items.length === 0):
    errors.push({ code: 'EMPTY_CART', message: '주문 항목이 비어있습니다' })
  for (item of body.items):
    if (!item.menuId || typeof item.menuId !== 'string'):
      errors.push({ code: 'INVALID_MENU_ID', message: '유효하지 않은 메뉴 ID' })
    if (!Number.isInteger(item.quantity) || item.quantity < 1):
      errors.push({ code: 'INVALID_QUANTITY', message: '수량은 1 이상 정수여야 합니다' })
  return errors

// 상태 변경 검증
function validateStatusUpdate(body):
  const validStatuses = ['PENDING', 'PREPARING', 'COMPLETED']
  if (!validStatuses.includes(body.status)):
    return [{ code: 'INVALID_STATUS', message: '유효하지 않은 주문 상태' }]
  return []
```

---

## 4. 에러 처리 패턴 (Error Handling Patterns)

### EP-001: 구조화된 에러 응답 형식
- **적용 대상**: 모든 API 응답
- **패턴**: Structured Error Response
- **설명**: 에러 코드, 메시지, 상세 정보를 포함한 일관된 에러 응답 형식.

```
// 성공 응답
{
  "success": true,
  "data": { ... }
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "주문을 찾을 수 없습니다",
    "details": { "orderId": "..." }
  }
}
```

에러 코드 목록:

| 코드 | HTTP 상태 | 설명 |
|---|---|---|
| VALIDATION_ERROR | 400 | 입력 검증 실패 |
| EMPTY_CART | 400 | 빈 장바구니 주문 시도 |
| INVALID_MENU_ID | 400 | 유효하지 않은 메뉴 ID |
| INVALID_QUANTITY | 400 | 유효하지 않은 수량 |
| INVALID_STATUS | 400 | 유효하지 않은 주문 상태 |
| INVALID_TRANSITION | 400 | 허용되지 않은 상태 전이 |
| MENU_NOT_FOUND | 400 | 메뉴를 찾을 수 없음 |
| MENU_INACTIVE | 400 | 비활성 메뉴 |
| UNAUTHORIZED | 401 | 인증 실패 |
| STORE_MISMATCH | 403 | 매장 접근 권한 없음 |
| ORDER_NOT_FOUND | 404 | 주문을 찾을 수 없음 |
| SESSION_NOT_FOUND | 404 | 세션을 찾을 수 없음 |
| QUEUE_FULL | 429 | 주문 대기열 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 에러 |
| ORDER_TIMEOUT | 500 | 주문 처리 타임아웃 |

### EP-002: Result 패턴 (서비스 레이어)
- **적용 대상**: OrderService의 모든 메서드
- **패턴**: Result Object Pattern
- **설명**: 서비스 메서드가 `{ success, data, error }` 형태의 결과 객체를 반환. 라우터에서 success 여부에 따라 응답 분기.

```
// 서비스 메서드 반환 형식
type ServiceResult<T> = 
  | { success: true, data: T }
  | { success: false, error: { code: string, message: string, status: number, details?: any } }

// OrderService 예시
async createOrder(storeId, tableId, items, user):
  // 세션 검증
  const session = await prisma.tableSession.findFirst(...)
  if (!session):
    return { success: false, error: { code: 'SESSION_NOT_FOUND', message: '유효한 세션이 없습니다', status: 404 } }

  // 비즈니스 로직 처리...
  const order = await prisma.$transaction(...)
  return { success: true, data: order }

// 라우터에서 처리
async (req, res) => {
  const result = await orderService.createOrder(...)
  if (result.success):
    res.status(201).json({ success: true, data: result.data })
  else:
    res.status(result.error.status).json({ success: false, error: result.error })
}
```

- **장점**: 서비스 레이어가 HTTP에 독립적, 테스트 용이, 에러 흐름이 명시적
- **규칙**: 서비스에서 절대 throw하지 않음 (예외: 예상치 못한 시스템 에러만 throw)

### EP-003: 글로벌 에러 핸들러
- **적용 대상**: Express 앱 레벨
- **패턴**: Global Error Handler Middleware
- **설명**: 예상치 못한 에러(서비스에서 throw된 에러)를 잡아 일관된 형식으로 응답.

```
// 글로벌 에러 핸들러 (app.use의 마지막)
function globalErrorHandler(err, req, res, next):
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '서버 내부 오류가 발생했습니다',
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    }
  })
```
