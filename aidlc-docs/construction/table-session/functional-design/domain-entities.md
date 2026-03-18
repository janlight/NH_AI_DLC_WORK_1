# Domain Entities - Unit 4: table-session

## 엔티티 정의

### Table

| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | String (UUID) | PK | 테이블 고유 ID |
| storeId | String | FK → Store | 매장 ID |
| tableNumber | Int | Unique per store | 테이블 번호 |
| password | String | NOT NULL | bcrypt 해싱된 비밀번호 |
| currentSessionId | String? | Nullable | 현재 활성 세션 ID |
| createdAt | DateTime | auto | 생성 시각 |
| updatedAt | DateTime | auto | 수정 시각 |

**유니크 제약**: (storeId, tableNumber)

### TableSession

| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | String (UUID) | PK | 세션 고유 ID |
| storeId | String | FK → Store | 매장 ID |
| tableId | String | FK → Table | 테이블 ID |
| startedAt | DateTime | auto | 세션 시작 시각 (첫 주문 시) |
| completedAt | DateTime? | Nullable | 이용 완료 시각 |
| isActive | Boolean | default: true | 활성 여부 |

### OrderHistory

| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | String (UUID) | PK | 이력 고유 ID |
| storeId | String | FK → Store | 매장 ID |
| tableId | String | FK → Table | 테이블 ID |
| sessionId | String | FK → TableSession | 세션 ID |
| orderNumber | String | NOT NULL | 원본 주문 번호 |
| items | JSON | NOT NULL | 주문 항목 스냅샷 [{menuName, quantity, price}] |
| totalAmount | Int | NOT NULL | 총 금액 |
| orderStatus | String | NOT NULL | 주문 상태 (완료 시점 상태) |
| orderedAt | DateTime | NOT NULL | 원본 주문 시각 |
| completedAt | DateTime | auto | 이력 이동 시각 |
| expiresAt | DateTime | NOT NULL | 보존 만료일 (orderedAt + 90일) |

## 엔티티 관계

```
Store 1──N Table 1──N TableSession
                  1──N Order (현재 세션, Unit 3 관리)
                  1──N OrderHistory (과거 이력)
```

- Store : Table = 1:N
- Table : TableSession = 1:N (시간순, 활성 세션은 최대 1개)
- TableSession : Order = 1:N (현재 활성 주문, Unit 3에서 관리)
- TableSession : OrderHistory = 1:N (이용 완료 후 이동된 주문)
