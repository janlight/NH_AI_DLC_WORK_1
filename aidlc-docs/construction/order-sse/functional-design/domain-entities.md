# Domain Entities - Unit 3: order-sse

## 1. Order (주문)

**설명**: 고객이 장바구니에서 확정한 주문 단위

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| id | String (UUID) | ✅ | 내부 PK |
| orderNumber | String | ✅ | 표시용 주문번호 (날짜기반: YYYYMMDD-NNN) |
| storeId | String | ✅ | 매장 ID (FK) |
| tableId | String | ✅ | 테이블 ID (FK) |
| sessionId | String | ✅ | 테이블 세션 ID (FK) |
| status | OrderStatus | ✅ | 주문 상태 (PENDING/PREPARING/COMPLETED) |
| totalAmount | Integer | ✅ | 총 주문 금액 (원) |
| createdAt | DateTime | ✅ | 주문 생성 시각 |
| updatedAt | DateTime | ✅ | 최종 수정 시각 |

**관계**:
- Order 1 : N OrderItem
- Order N : 1 Table
- Order N : 1 TableSession
- Order N : 1 Store

---

## 2. OrderItem (주문 항목)

**설명**: 주문 내 개별 메뉴 항목

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| id | String (UUID) | ✅ | PK |
| orderId | String | ✅ | 주문 ID (FK) |
| menuId | String | ✅ | 메뉴 ID (FK) |
| menuName | String | ✅ | 주문 시점 메뉴명 (스냅샷) |
| price | Integer | ✅ | 주문 시점 단가 (스냅샷) |
| quantity | Integer | ✅ | 수량 |
| subtotal | Integer | ✅ | 소계 (price × quantity) |

**관계**:
- OrderItem N : 1 Order
- OrderItem N : 1 Menu (참조, 스냅샷 보존)

---

## 3. OrderHistory (주문 이력)

**설명**: 테이블 이용 완료 시 Order/OrderItem에서 이동된 과거 주문 기록

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| id | String (UUID) | ✅ | PK |
| orderNumber | String | ✅ | 원본 주문번호 |
| storeId | String | ✅ | 매장 ID |
| tableId | String | ✅ | 테이블 ID |
| sessionId | String | ✅ | 세션 ID |
| totalAmount | Integer | ✅ | 총 금액 |
| items | JSON | ✅ | 주문 항목 스냅샷 (메뉴명, 수량, 단가, 소계) |
| orderedAt | DateTime | ✅ | 원본 주문 시각 |
| completedAt | DateTime | ✅ | 이용 완료 처리 시각 |

**관계**:
- OrderHistory N : 1 Store
- OrderHistory N : 1 Table

---

## 4. OrderStatus (주문 상태 열거형)

| 값 | 설명 | 전이 가능 상태 |
|---|---|---|
| PENDING | 대기중 (신규 주문) | → PREPARING |
| PREPARING | 준비중 | → COMPLETED |
| COMPLETED | 완료 | 없음 (최종 상태) |

**규칙**: 순방향 전이만 허용 (역방향 불가)

---

## 5. CartItem (장바구니 항목 - 클라이언트 전용)

**설명**: localStorage에 저장되는 클라이언트 측 장바구니 항목

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| menuId | String | ✅ | 메뉴 ID |
| menuName | String | ✅ | 메뉴명 |
| price | Integer | ✅ | 단가 |
| quantity | Integer | ✅ | 수량 (1 이상) |
| imageUrl | String | ❌ | 메뉴 이미지 URL |

**저장 위치**: localStorage (키: `cart_{storeId}_{tableId}`)
**서버 전송**: 주문 확정 시에만

---

## 6. SSEClient (SSE 클라이언트 - 인메모리)

**설명**: SSE 연결된 관리자 클라이언트 정보 (서버 메모리)

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| clientId | String | ✅ | 고유 클라이언트 ID |
| storeId | String | ✅ | 매장 ID |
| response | Response | ✅ | Express Response 객체 (SSE 스트림) |
| connectedAt | DateTime | ✅ | 연결 시각 |

---

## 7. SSEEvent (SSE 이벤트 구조)

| 이벤트명 | 데이터 | 트리거 |
|---|---|---|
| `new-order` | `{ order, tableId, orderNumber }` | 고객 주문 생성 |
| `order-status` | `{ orderId, orderNumber, status, tableId }` | 관리자 상태 변경 |
| `order-deleted` | `{ orderId, orderNumber, tableId, newTotalAmount }` | 관리자 주문 삭제 |
| `table-completed` | `{ tableId, tableNumber }` | 관리자 이용 완료 |

---

## 엔티티 관계 다이어그램

```
+-------+     +------------+     +-----------+
| Store |1---N| Table      |1---N| Order     |
+-------+     +------------+     +-----------+
                    |1                |1
                    |                 |
                    N                 N
              +------------+   +-----------+
              |TableSession|   | OrderItem |
              +------------+   +-----------+
                                     |N
                                     |
                                     1
                                 +------+
                                 | Menu |
                                 +------+

+-------+     +--------------+
| Store |1---N| OrderHistory |
+-------+     +--------------+
```
