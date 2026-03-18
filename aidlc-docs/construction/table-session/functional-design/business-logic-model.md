# Business Logic Model - Unit 4: table-session

## TableService 상세 플로우

### 1. getTables(storeId)
```
입력: storeId
처리:
  1. 매장의 전체 테이블 조회 (currentSession 포함)
  2. 각 테이블의 현재 세션 주문 총액 계산
출력: Table[] (세션 정보 + 총 주문액 포함)
```

### 2. createTable(storeId, tableData)
```
입력: storeId, { tableNumber, password }
처리:
  1. 동일 매장 내 테이블 번호 중복 검증 (BR-T01)
  2. 비밀번호 bcrypt 해싱 (Unit 1 AuthService 활용)
  3. Table 레코드 생성 (currentSessionId: null)
출력: Table
에러: 409 Conflict (중복 테이블 번호)
```

### 3. completeTable(storeId, tableId) - 이용 완료
```
입력: storeId, tableId
처리 (단일 트랜잭션 - BR-T03):
  1. 테이블 조회 및 활성 세션 확인
  2. 활성 세션 없으면 에러 반환
  3. 현재 세션의 모든 주문 + 주문 항목 조회
  4. 각 주문을 OrderHistory로 변환:
     - items: [{menuName, quantity, price}] JSON 스냅샷
     - expiresAt: now() + 90일
  5. OrderHistory 일괄 생성
  6. 현재 세션 주문 항목 삭제
  7. 현재 세션 주문 삭제
  8. TableSession 업데이트 (isActive: false, completedAt: now())
  9. Table 업데이트 (currentSessionId: null)
  10. SSE 브로드캐스트: { event: 'table-completed', data: { tableId, tableNumber } }
출력: void
에러: 404 (테이블 없음), 400 (활성 세션 없음)
```

### 4. deleteOrder(storeId, orderId) - 주문 삭제
```
입력: storeId, orderId
처리 (BR-T05):
  1. 주문 조회 및 매장 소속 확인
  2. 주문 항목 삭제
  3. 주문 삭제
  4. SSE 브로드캐스트: { event: 'order-deleted', data: { orderId, tableId } }
출력: void
에러: 404 (주문 없음)
```

### 5. getOrderHistory(storeId, tableId, dateFilter?)
```
입력: storeId, tableId, { startDate?, endDate? }
처리 (BR-T06):
  1. 테이블 존재 확인
  2. OrderHistory 조회 (expiresAt > now() 필터)
  3. 날짜 필터 적용 (startDate, endDate)
  4. 시간 역순 정렬
출력: OrderHistory[]
에러: 404 (테이블 없음)
```

## 세션 라이프사이클

```
[세션 없음] ──첫 주문 생성──→ [활성 세션]
                                  │
                          추가 주문 가능
                          주문 삭제 가능
                          주문 상태 변경 가능
                                  │
                          ──이용 완료──→ [세션 종료]
                                          │
                                   주문 → OrderHistory
                                   테이블 리셋
                                   고객 태블릿 리셋
                                          │
                                   [세션 없음] (다음 고객 대기)
```

## Unit 3 의존성 인터페이스

TableService가 Unit 3에서 필요로 하는 인터페이스:
- `OrderService.getTableOrders(storeId, tableId, sessionId)` → 현재 세션 주문 조회
- `SSEService.broadcast(storeId, event, data)` → 이벤트 브로드캐스트

> 참고: 주문 삭제(deleteOrder)는 Unit 4에서 직접 Prisma로 처리하거나, Unit 3의 OrderService에 위임 가능. 설계상 Unit 3 OrderService에 위임 권장.
