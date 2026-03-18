# Domain Entities - Unit 1: core-auth

## 전체 Prisma 스키마 (전 Unit 공통 기반)

> Unit 1에서 전체 DB 스키마를 설계하며, 다른 Unit은 이 스키마를 기반으로 개발합니다.

---

## Entity: Store (매장)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 매장 고유 식별자 |
| name | String | NOT NULL, max 100 | 매장명 |
| slug | String | UNIQUE, NOT NULL, max 50 | URL 친화적 매장 식별자 |
| address | String | NULL, max 200 | 매장 주소 |
| phone | String | NULL, max 20 | 매장 전화번호 |
| isActive | Boolean | NOT NULL, default true | 매장 활성 상태 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- 1:N → Admin (매장별 관리자)
- 1:N → Table (매장별 테이블)
- 1:N → Category (매장별 카테고리)
- 1:N → Menu (매장별 메뉴)

**인덱스**: slug (UNIQUE)

---

## Entity: Admin (관리자)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 관리자 고유 식별자 |
| storeId | UUID | FK → Store.id, NOT NULL | 소속 매장 |
| username | String | NOT NULL, max 50 | 사용자명 |
| passwordHash | String | NOT NULL | bcrypt 해시된 비밀번호 |
| role | Enum(AdminRole) | NOT NULL, default MANAGER | 역할 (OWNER / MANAGER) |
| isActive | Boolean | NOT NULL, default true | 계정 활성 상태 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- N:1 → Store

**인덱스**: (storeId, username) UNIQUE

**비즈니스 규칙**:
- username은 매장 내에서 고유
- 비밀번호는 bcrypt로 해싱 저장 (saltRounds: 12)

---

## Entity: Table (테이블)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 테이블 고유 식별자 |
| storeId | UUID | FK → Store.id, NOT NULL | 소속 매장 |
| tableNumber | Int | NOT NULL | 테이블 번호 |
| passwordHash | String | NOT NULL | bcrypt 해시된 비밀번호 |
| isActive | Boolean | NOT NULL, default true | 테이블 활성 상태 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- N:1 → Store
- 1:N → TableSession

**인덱스**: (storeId, tableNumber) UNIQUE

---

## Entity: TableSession (테이블 세션)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 세션 고유 식별자 |
| tableId | UUID | FK → Table.id, NOT NULL | 테이블 |
| storeId | UUID | FK → Store.id, NOT NULL | 매장 (비정규화, 조회 편의) |
| startedAt | DateTime | NOT NULL, auto | 세션 시작 시각 |
| endedAt | DateTime | NULL | 세션 종료 시각 (NULL = 활성) |
| isActive | Boolean | NOT NULL, default true | 세션 활성 상태 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |

**관계**:
- N:1 → Table
- N:1 → Store
- 1:N → Order

**인덱스**: (tableId, isActive) - 활성 세션 빠른 조회

---

## Entity: Category (카테고리)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 카테고리 고유 식별자 |
| storeId | UUID | FK → Store.id, NOT NULL | 소속 매장 |
| name | String | NOT NULL, max 50 | 카테고리명 |
| sortOrder | Int | NOT NULL, default 0 | 노출 순서 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- N:1 → Store
- 1:N → Menu

**인덱스**: (storeId, name) UNIQUE

---

## Entity: Menu (메뉴)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 메뉴 고유 식별자 |
| storeId | UUID | FK → Store.id, NOT NULL | 소속 매장 |
| categoryId | UUID | FK → Category.id, NOT NULL | 카테고리 |
| name | String | NOT NULL, max 100 | 메뉴명 |
| description | String | NULL, max 500 | 메뉴 설명 |
| price | Int | NOT NULL, min 0 | 가격 (원 단위 정수) |
| imageUrl | String | NULL, max 500 | 이미지 경로 |
| isAvailable | Boolean | NOT NULL, default true | 판매 가능 여부 |
| sortOrder | Int | NOT NULL, default 0 | 노출 순서 |
| createdAt | DateTime | NOT NULL, auto | 생성 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- N:1 → Store
- N:1 → Category
- 1:N → OrderItem

**인덱스**: (storeId, categoryId, sortOrder)

---

## Entity: Order (주문)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 주문 고유 식별자 |
| storeId | UUID | FK → Store.id, NOT NULL | 매장 |
| tableId | UUID | FK → Table.id, NOT NULL | 테이블 |
| sessionId | UUID | FK → TableSession.id, NOT NULL | 세션 |
| orderNumber | Int | NOT NULL | 주문 번호 (매장 내 순번) |
| status | Enum(OrderStatus) | NOT NULL, default PENDING | 주문 상태 |
| totalAmount | Int | NOT NULL, min 0 | 총 금액 |
| createdAt | DateTime | NOT NULL, auto | 주문 시각 |
| updatedAt | DateTime | NOT NULL, auto | 수정 시각 |

**관계**:
- N:1 → Store
- N:1 → Table
- N:1 → TableSession
- 1:N → OrderItem

**인덱스**: (storeId, orderNumber) UNIQUE, (sessionId)

---

## Entity: OrderItem (주문 항목)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 항목 고유 식별자 |
| orderId | UUID | FK → Order.id, NOT NULL | 주문 |
| menuId | UUID | FK → Menu.id, NOT NULL | 메뉴 |
| menuName | String | NOT NULL, max 100 | 주문 시점 메뉴명 (스냅샷) |
| quantity | Int | NOT NULL, min 1 | 수량 |
| unitPrice | Int | NOT NULL, min 0 | 주문 시점 단가 (스냅샷) |
| subtotal | Int | NOT NULL, min 0 | 소계 (quantity * unitPrice) |

**관계**:
- N:1 → Order
- N:1 → Menu

---

## Entity: OrderHistory (주문 이력)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 이력 고유 식별자 |
| storeId | UUID | NOT NULL | 매장 ID |
| tableId | UUID | NOT NULL | 테이블 ID |
| sessionId | UUID | NOT NULL | 세션 ID |
| tableNumber | Int | NOT NULL | 테이블 번호 (스냅샷) |
| orderNumber | Int | NOT NULL | 주문 번호 |
| status | String | NOT NULL | 최종 상태 |
| totalAmount | Int | NOT NULL | 총 금액 |
| items | Json | NOT NULL | 주문 항목 JSON 스냅샷 |
| orderedAt | DateTime | NOT NULL | 원래 주문 시각 |
| completedAt | DateTime | NOT NULL, auto | 이용 완료 처리 시각 |

**인덱스**: (storeId, tableId, completedAt)

---

## Entity: LoginAttempt (로그인 시도 기록)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, auto-generated | 기록 고유 식별자 |
| identifier | String | NOT NULL, max 200 | 식별자 (storeId:username 또는 storeId:tableNumber) |
| attemptedAt | DateTime | NOT NULL, auto | 시도 시각 |
| success | Boolean | NOT NULL | 성공 여부 |
| ipAddress | String | NULL, max 45 | 요청 IP |

**인덱스**: (identifier, attemptedAt)

**비즈니스 규칙**:
- 5회 연속 실패 시 15분 차단
- 차단 판정: 최근 15분 내 실패 횟수 기준

---

## Enum 정의

### AdminRole
```
OWNER    - 매장 오너 (전체 권한)
MANAGER  - 홀 매니저 (운영 권한)
```

### OrderStatus
```
PENDING     - 대기중
PREPARING   - 준비중
COMPLETED   - 완료
```

---

## ER 다이어그램 (텍스트)

```
Store 1──N Admin
Store 1──N Table
Store 1──N Category
Store 1──N Menu
Store 1──N Order
Store 1──N TableSession

Table 1──N TableSession
TableSession 1──N Order

Category 1──N Menu
Menu 1──N OrderItem
Order 1──N OrderItem

LoginAttempt (독립)
OrderHistory (독립 - 아카이브)
```
