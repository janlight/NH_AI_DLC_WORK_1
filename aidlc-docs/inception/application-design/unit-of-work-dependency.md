# Unit of Work 의존성 (4인 팀 구성)

## Unit 간 의존성 매트릭스

| Unit | core-auth | menu-management | order-sse | table-session |
|---|---|---|---|---|
| **Unit 1: core-auth** | - | | | |
| **Unit 2: menu-management** | ✅ (스키마, 인증 미들웨어) | - | | |
| **Unit 3: order-sse** | ✅ (스키마, 인증 미들웨어) | | - | |
| **Unit 4: table-session** | ✅ (스키마, 인증 미들웨어) | | ✅ (OrderService, SSEService) | - |

## 의존성 상세

### Unit 1 → 없음 (기반 Unit)
- 다른 Unit에 의존하지 않음
- 전체 Prisma 스키마, 인증 미들웨어, Express 기본 구조 제공

### Unit 2 → Unit 1
- Prisma 스키마의 Menu, Category 모델 사용
- 인증 미들웨어 (관리자 API 보호)

### Unit 3 → Unit 1
- Prisma 스키마의 Order, OrderItem, OrderHistory 모델 사용
- 인증 미들웨어 (고객/관리자 API 보호)

### Unit 4 → Unit 1, Unit 3
- Prisma 스키마의 Table, TableSession 모델 사용
- 인증 미들웨어 (관리자 API 보호)
- OrderService: 이용 완료 시 주문 → OrderHistory 이동
- SSEService: 이용 완료 이벤트 브로드캐스트

## 개발 순서 제약

```
Unit 1 (core-auth)
  ├──→ Unit 2 (menu-management)     # 병렬 가능
  ├──→ Unit 3 (order-sse)           # 병렬 가능
  └──→ Unit 4 (table-session)       # Unit 3 인터페이스 확정 후 권장
```

## 통신 패턴

모든 Unit은 동일 모놀리스 내에서 직접 함수 호출:
- TableService → OrderService.getTableOrders() (이용 완료 시)
- TableService → SSEService.broadcast() (이용 완료 이벤트)
- OrderService → SSEService.broadcast() (주문 이벤트)
