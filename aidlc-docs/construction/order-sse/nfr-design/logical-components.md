# Logical Components - Unit 3: order-sse

## 개요
Unit 3의 NFR 요구사항을 충족하기 위한 논리적 컴포넌트 구조를 정의합니다.

## 컴포넌트 아키텍처

```
+------------------------------------------------------------------+
|                        Express Application                        |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------+    +--------------------+                  |
|  | Global Middleware   |    | Global Error       |                  |
|  | - authMiddleware    |    | Handler            |                  |
|  | - storeGuard       |    | - globalErrorHandler|                 |
|  +--------------------+    +--------------------+                  |
|                                                                    |
|  +------------------------------------------------------------+   |
|  |                     Router Layer                            |   |
|  |  orderRouter: /api/stores/:storeId/...                     |   |
|  |  - 입력 검증 (inline validation)                            |   |
|  |  - Result 분기 처리 (success/error → HTTP 응답)             |   |
|  +------------------------------------------------------------+   |
|                          |                                         |
|  +------------------------------------------------------------+   |
|  |                   Service Layer                             |   |
|  |  +---------------------+  +---------------------+          |   |
|  |  | OrderService        |  | SSEService          |          |   |
|  |  | - createOrder()     |  | - subscribe()       |          |   |
|  |  | - getTableOrders()  |  | - broadcast()       |          |   |
|  |  | - getStoreOrders()  |  | - removeClient()    |          |   |
|  |  | - updateStatus()    |  | - heartbeat timer   |          |   |
|  |  | - deleteOrder()     |  +---------------------+          |   |
|  |  | - getOrderHistory() |           |                        |   |
|  |  +---------------------+           |                        |   |
|  |           |                        |                        |   |
|  |  +---------------------+  +---------------------+          |   |
|  |  | OrderQueueService   |  | SSE Client Pool     |          |   |
|  |  | - enqueueOrder()    |  | Map<storeId,        |          |   |
|  |  | - withTimeout()     |  |   Set<SSEClient>>   |          |   |
|  |  | - queue length mgmt |  +---------------------+          |   |
|  |  +---------------------+                                   |   |
|  +------------------------------------------------------------+   |
|                          |                                         |
|  +------------------------------------------------------------+   |
|  |                   Data Layer (Prisma)                       |   |
|  |  Order | OrderItem | OrderHistory                           |   |
|  |  (+ Table, TableSession, Menu - 다른 Unit 엔티티 참조)      |   |
|  +------------------------------------------------------------+   |
+------------------------------------------------------------------+
```

---

## 1. Router Layer

### 1.1 orderRouter
- **역할**: HTTP 요청 수신, 입력 검증, 서비스 호출, 응답 반환
- **위치**: `backend/src/routes/orderRoutes.js`

| 엔드포인트 | 메서드 | 미들웨어 | 검증 | 서비스 호출 |
|---|---|---|---|---|
| `/tables/:tableId/orders` | POST | authMiddleware('customer') | validateCreateOrder | orderService.createOrder() |
| `/tables/:tableId/orders` | GET | authMiddleware('customer') | - | orderService.getTableOrders() |
| `/orders` | GET | authMiddleware('admin') | - | orderService.getStoreOrders() |
| `/orders/:orderId/status` | PUT | authMiddleware('admin') | validateStatusUpdate | orderService.updateStatus() |
| `/orders/:orderId` | DELETE | authMiddleware('admin') | - | orderService.deleteOrder() |
| `/tables/:tableId/order-history` | GET | authMiddleware('admin') | - | orderService.getOrderHistory() |
| `/events` | GET | authMiddleware('admin') | - | sseService.subscribe() |

라우터 처리 패턴:
```
async (req, res) => {
  // 1. 입력 검증 (해당 시)
  const errors = validateCreateOrder(req.body)
  if (errors.length > 0):
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '입력 검증 실패', details: errors } })

  // 2. 테넌트 격리 검증
  if (req.user.storeId !== req.params.storeId):
    return res.status(403).json({ success: false, error: { code: 'STORE_MISMATCH', message: '매장 접근 권한이 없습니다' } })

  // 3. 서비스 호출 + Result 분기
  const result = await orderService.createOrder(...)
  if (result.success):
    res.status(201).json({ success: true, data: result.data })
  else:
    res.status(result.error.status).json({ success: false, error: result.error })
}
```

### 1.2 입력 검증 함수
- **역할**: 라우트 핸들러 내에서 요청 body 검증
- **위치**: `backend/src/validators/orderValidators.js`

| 함수 | 검증 대상 | 검증 항목 |
|---|---|---|
| validateCreateOrder(body) | 주문 생성 | items 배열 존재/비어있지 않음, 각 item의 menuId(string), quantity(정수, 1이상) |
| validateStatusUpdate(body) | 상태 변경 | status가 유효한 OrderStatus 값인지 |

---

## 2. Service Layer

### 2.1 OrderService
- **역할**: 주문 비즈니스 로직 처리
- **위치**: `backend/src/services/orderService.js`
- **반환 형식**: `{ success: true, data } | { success: false, error: { code, message, status, details? } }`
- **의존성**: Prisma Client, OrderQueueService, SSEService

| 메서드 | 설명 | 큐 사용 | SSE 이벤트 |
|---|---|---|---|
| createOrder() | 주문 생성 (트랜잭션) | ✅ enqueueOrder | new-order |
| getTableOrders() | 테이블 주문 조회 | ❌ | - |
| getStoreOrders() | 매장 전체 주문 조회 | ❌ | - |
| updateOrderStatus() | 상태 변경 | ❌ | order-status |
| deleteOrder() | 주문 삭제 (트랜잭션) | ❌ | order-deleted |
| getOrderHistory() | 과거 주문 조회 | ❌ | - |

### 2.2 SSEService
- **역할**: SSE 연결 관리 및 이벤트 브로드캐스트
- **위치**: `backend/src/services/sseService.js`
- **상태**: 인메모리 클라이언트 풀 (Map<storeId, Set<SSEClient>>)

| 메서드 | 설명 |
|---|---|
| subscribe(storeId, res) | 클라이언트 등록, 헤더 설정, heartbeat 시작 |
| broadcast(storeId, eventName, data) | 매장 클라이언트에 이벤트 전송 (Fire-and-Forget) |
| removeClient(storeId, clientId) | 클라이언트 제거, heartbeat 정리 |

### 2.3 OrderQueueService
- **역할**: 매장별 주문 생성 동시성 제어
- **위치**: `backend/src/services/orderQueueService.js`
- **상태**: 인메모리 큐 (Map<storeId, { promise, length }>)

| 메서드 | 설명 |
|---|---|
| enqueueOrder(storeId, orderFn) | 큐에 주문 추가, 순차 실행 |
| withTimeout(promise, ms) | Promise 타임아웃 래퍼 |

성능 보호 설정:

| 설정 | 값 | 설명 |
|---|---|---|
| MAX_QUEUE_LENGTH | 50 | 매장당 최대 대기 주문 수 |
| ORDER_TIMEOUT_MS | 5000 | 개별 주문 처리 타임아웃 |

---

## 3. Middleware Components

### 3.1 authMiddleware (Unit 1 제공)
- **역할**: JWT 토큰 검증, req.user에 디코딩된 payload 설정
- **사용**: `authMiddleware('customer')`, `authMiddleware('admin')`
- **참고**: Unit 1 개발 완료 후 실제 인터페이스 확인 필요 (PENDING-001~003)

### 3.2 storeGuard (테넌트 격리)
- **역할**: req.user.storeId와 req.params.storeId 일치 검증
- **위치**: 라우트 핸들러 내 인라인 검증 (별도 미들웨어 분리 가능)
- **실패 시**: 403 STORE_MISMATCH 에러 반환

### 3.3 globalErrorHandler
- **역할**: 예상치 못한 에러를 잡아 일관된 형식으로 응답
- **위치**: `backend/src/middleware/errorHandler.js`
- **처리**: 500 INTERNAL_ERROR 응답, 개발 환경에서 스택 트레이스 포함

---

## 4. Frontend Logical Components

### 4.1 API Client (axios 인스턴스)
- **역할**: 백엔드 API 호출, 인증 헤더 자동 첨부, 에러 응답 파싱
- **위치**: `frontend/src/api/orderApi.js`

```
// axios 인스턴스 설정
const api = axios.create({
  baseURL: '/api/stores/{storeId}'
})

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${authStore.token}`
  return config
})

// 응답 인터셉터: 에러 응답 파싱
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401):
      // 토큰 만료 처리 (Unit 1 authStore 연동)
    return Promise.reject(error.response?.data?.error || { code: 'NETWORK_ERROR', message: '네트워크 오류' })
  }
)
```

### 4.2 SSE Connection Manager (useSSE composable)
- **역할**: SSE 연결 생명주기 관리, 재연결 로직, 이벤트 디스패치
- **위치**: `frontend/src/composables/useSSE.js`
- **패턴**: Exponential Backoff + Circuit Breaker (최대 10회)

### 4.3 Pinia Stores
- **cartStore**: 장바구니 상태 (localStorage 연동)
- **orderStore**: 주문 상태 (API + SSE 이벤트 연동)

---

## 5. 컴포넌트 간 데이터 흐름

### 5.1 주문 생성 흐름
```
CartView → orderStore.createOrder()
  → orderApi.POST /orders
    → orderRouter (검증 + 테넌트 확인)
      → orderQueueService.enqueueOrder()
        → orderService.createOrder() (트랜잭션)
          → sseService.broadcast('new-order')
            → 관리자 DashboardView (SSE 수신)
  ← Result { success, data }
← cartStore.clearCart() + 성공 모달
```

### 5.2 상태 변경 흐름
```
DashboardView → orderStore.updateOrderStatus()
  → orderApi.PUT /orders/:orderId/status
    → orderRouter (검증)
      → orderService.updateOrderStatus()
        → sseService.broadcast('order-status')
          → DashboardView (SSE 수신, UI 업데이트)
  ← Result { success, data }
```

### 5.3 SSE 연결 흐름
```
DashboardView mount
  → useSSE.connect()
    → EventSource(/api/stores/:storeId/events)
      → sseService.subscribe() (서버)
        → 클라이언트 풀 등록 + heartbeat 시작
    ← event: connected

DashboardView unmount
  → useSSE.disconnect()
    → EventSource.close()
      → sseService.removeClient() (서버, req.on('close'))
```

---

## 6. 파일 구조 요약

```
backend/
  src/
    routes/
      orderRoutes.js          # 라우터 + 인라인 검증
    services/
      orderService.js         # 주문 비즈니스 로직 (Result 패턴)
      sseService.js           # SSE 연결/브로드캐스트
      orderQueueService.js    # 인메모리 큐 (backpressure)
    validators/
      orderValidators.js      # 입력 검증 함수
    middleware/
      errorHandler.js         # 글로벌 에러 핸들러

frontend/
  src/
    api/
      orderApi.js             # axios 인스턴스 + 인터셉터
    stores/
      cartStore.js            # 장바구니 (localStorage)
      orderStore.js           # 주문 상태 (API 연동)
    composables/
      useSSE.js               # SSE 연결 관리
    views/
      customer/
        CartView.vue          # 장바구니 화면
        OrderView.vue         # 주문 확정 + 내역
      admin/
        DashboardView.vue     # 실시간 대시보드
```
