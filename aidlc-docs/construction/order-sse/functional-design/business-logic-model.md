# Business Logic Model - Unit 3: order-sse

## 1. OrderService 비즈니스 로직

### 1.1 createOrder (주문 생성)

```
입력: storeId, tableId, items[{menuId, quantity}], customerToken

1. JWT 토큰에서 tableId, sessionId 추출 및 검증
2. 테이블 세션 유효성 확인 (활성 세션 존재 여부)
3. items가 비어있으면 → 에러 (빈 장바구니)
4. 각 menuId에 대해:
   a. 해당 매장의 메뉴인지 확인
   b. 메뉴 활성 상태 확인
   c. 메뉴명, 단가 스냅샷 저장
5. 주문번호 생성:
   a. 오늘 날짜 (YYYYMMDD) 조회
   b. 해당 매장의 오늘 마지막 시퀀스 조회
   c. 시퀀스 + 1 → YYYYMMDD-NNN 형식 생성
6. 트랜잭션 시작:
   a. Order 레코드 생성 (status: PENDING)
   b. OrderItem 레코드들 생성 (스냅샷 포함)
   c. totalAmount 계산 및 저장
7. 트랜잭션 커밋
8. SSEService.broadcast(storeId, 'new-order', orderData)
9. 주문 정보 반환 (orderNumber, totalAmount 포함)

에러 케이스:
- 세션 없음/만료 → 401
- 빈 장바구니 → 400
- 메뉴 없음/비활성 → 400 (해당 메뉴명 포함)
- DB 에러 → 500 (트랜잭션 롤백)
```

### 1.2 getTableOrders (현재 세션 주문 조회)

```
입력: storeId, tableId, sessionId

1. storeId + tableId + sessionId로 주문 조회
2. Order + OrderItem JOIN
3. 주문 시간 역순 정렬
4. 주문 목록 반환

반환: Order[] (각 Order에 items 포함)
```

### 1.3 getStoreOrders (매장 전체 주문 조회 - 관리자)

```
입력: storeId

1. 해당 매장의 활성 세션이 있는 테이블 조회
2. 각 테이블별:
   a. 현재 세션의 주문 조회
   b. 총 주문액 계산
   c. 최신 3개 주문 미리보기 추출
3. 테이블별 그룹으로 반환

반환: TableOrderSummary[] {
  tableId, tableNumber,
  totalAmount,
  recentOrders: Order[] (최신 3개),
  orderCount
}
```

### 1.4 updateOrderStatus (주문 상태 변경)

```
입력: storeId, orderId, newStatus, adminToken

1. 관리자 JWT 검증
2. 주문 조회 (storeId + orderId)
3. 주문 없으면 → 404
4. 상태 전이 검증:
   - PENDING → PREPARING (허용)
   - PREPARING → COMPLETED (허용)
   - 그 외 → 400 (유효하지 않은 상태 전이)
5. 상태 업데이트
6. SSEService.broadcast(storeId, 'order-status', {orderId, orderNumber, status, tableId})
7. 업데이트된 주문 반환

에러 케이스:
- 주문 없음 → 404
- 유효하지 않은 전이 → 400 (현재 상태, 요청 상태 포함)
```

### 1.5 deleteOrder (주문 삭제)

```
입력: storeId, orderId, adminToken

1. 관리자 JWT 검증
2. 주문 조회 (storeId + orderId)
3. 주문 없으면 → 404
4. tableId 기록 (총액 재계산용)
5. 트랜잭션 시작:
   a. OrderItem 삭제 (cascade)
   b. Order 삭제
6. 트랜잭션 커밋
7. 해당 테이블 총 주문액 재계산
8. SSEService.broadcast(storeId, 'order-deleted', {orderId, orderNumber, tableId, newTotalAmount})
9. 성공 응답 반환
```

### 1.6 getOrderHistory (과거 주문 내역 조회)

```
입력: storeId, tableId, dateFilter? {startDate, endDate}

1. 관리자 JWT 검증
2. OrderHistory에서 storeId + tableId로 조회
3. dateFilter 있으면 날짜 범위 필터 적용
4. 시간 역순 정렬
5. 결과 반환

반환: OrderHistory[] (items JSON 포함)
```

---

## 2. SSEService 비즈니스 로직

### 2.1 subscribe (SSE 연결)

```
입력: storeId, res (Express Response)

1. 고유 clientId 생성 (UUID)
2. Response 헤더 설정:
   - Content-Type: text/event-stream
   - Cache-Control: no-cache
   - Connection: keep-alive
   - X-Accel-Buffering: no (프록시 버퍼링 방지)
3. 매장별 클라이언트 풀에 등록 (Map<storeId, Set<{clientId, res}>>)
4. 30초 간격 heartbeat 타이머 시작 (`:heartbeat\n\n`)
5. 연결 종료 이벤트 리스너 등록 (req.on('close'))
6. 초기 연결 확인 이벤트 전송: `event: connected\ndata: {clientId}\n\n`
```

### 2.2 broadcast (이벤트 브로드캐스트)

```
입력: storeId, eventName, data

1. 매장별 클라이언트 풀에서 storeId로 조회
2. 클라이언트 없으면 → 조기 반환 (no-op)
3. 이벤트 문자열 구성: `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
4. 각 클라이언트에 대해:
   a. res.write(eventString) 시도
   b. 실패 시 해당 클라이언트 제거 (removeClient)
5. 비동기 처리 (호출자 블로킹 없음)
```

### 2.3 removeClient (연결 해제)

```
입력: storeId, clientId

1. 매장별 클라이언트 풀에서 해당 클라이언트 제거
2. heartbeat 타이머 정리
3. 풀이 비어있으면 매장 엔트리 삭제
```

---

## 3. 주문번호 생성 로직 상세

```
generateOrderNumber(storeId):

1. today = 현재 날짜 (YYYYMMDD 형식)
2. DB 쿼리: 해당 매장의 오늘 마지막 주문번호 조회
   SELECT orderNumber FROM Order
   WHERE storeId = ? AND orderNumber LIKE '{today}-%'
   ORDER BY orderNumber DESC LIMIT 1
3. 마지막 번호가 있으면:
   sequence = 마지막 번호의 NNN 부분 + 1
4. 없으면:
   sequence = 1
5. 반환: `${today}-${sequence.toString().padStart(3, '0')}`

예시: 20260318-001, 20260318-002, ...
```

---

## 4. 프론트엔드 비즈니스 로직

### 4.1 cartStore (장바구니)

```
상태:
- items: CartItem[] (localStorage 연동)
- storeId, tableId (키 생성용)

액션:
- addItem(menu):
  1. 기존 항목 검색 (menuId 기준)
  2. 있으면 → quantity + 1
  3. 없으면 → 새 CartItem 추가 (quantity: 1)
  4. localStorage 저장

- updateQuantity(menuId, quantity):
  1. quantity <= 0 → 항목 삭제
  2. quantity > 0 → 수량 업데이트
  3. localStorage 저장

- removeItem(menuId):
  1. 해당 항목 삭제
  2. localStorage 저장

- clearCart():
  1. items = []
  2. localStorage 삭제

- loadFromStorage():
  1. localStorage에서 `cart_{storeId}_{tableId}` 읽기
  2. JSON 파싱 → items에 설정

게터:
- totalAmount: SUM(item.price * item.quantity)
- itemCount: SUM(item.quantity)
- isEmpty: items.length === 0
```

### 4.2 orderStore (주문)

```
상태:
- orders: Order[] (현재 세션 주문)
- storeOrders: TableOrderSummary[] (관리자용)
- loading: boolean
- error: string | null

액션:
- createOrder(items):
  1. API POST /orders 호출
  2. 성공 → cartStore.clearCart()
  3. 주문번호 반환 (5초 후 메뉴 리다이렉트용)

- fetchTableOrders():
  1. API GET /tables/:tableId/orders 호출
  2. orders 상태 업데이트

- fetchStoreOrders():
  1. API GET /orders 호출 (관리자)
  2. storeOrders 상태 업데이트

- updateOrderStatus(orderId, status):
  1. API PUT /orders/:orderId/status 호출
  2. 로컬 상태 업데이트

- deleteOrder(orderId):
  1. API DELETE /orders/:orderId 호출
  2. 로컬 상태에서 제거
```

### 4.3 SSE 연결 관리 (관리자 DashboardView)

```
연결 로직:
1. 컴포넌트 마운트 시 EventSource 생성
2. 이벤트 리스너 등록:
   - 'new-order' → storeOrders에 주문 추가 + 시각적 강조
   - 'order-status' → 해당 주문 상태 업데이트
   - 'order-deleted' → 해당 주문 제거 + 총액 업데이트
   - 'table-completed' → 해당 테이블 리셋
3. 에러 시 재연결:
   - 즉시 재연결 시도
   - 실패 시 지수 백오프 (1초, 2초, 4초... 최대 30초)
   - 최대 10회 재시도, 초과 시 재연결 중단
   - 중단 후 "다시 연결" 수동 버튼 표시 (클릭 시 카운터 리셋 후 재시도)
   - 연결 상태 UI 표시
4. 컴포넌트 언마운트 시 EventSource.close()
```
