# Component Dependency

## 의존성 매트릭스

| Component | AuthService | MenuService | TableService | OrderService | SSEService | Prisma |
|---|---|---|---|---|---|---|
| **AuthService** | - | | | | | ✅ |
| **MenuService** | | - | | | | ✅ |
| **TableService** | | | - | ✅ | ✅ | ✅ |
| **OrderService** | | | | - | ✅ | ✅ |
| **SSEService** | | | | | - | |

## 통신 패턴

### 동기 통신 (Request-Response)
- Frontend → Express Routes → Services → Prisma → PostgreSQL
- 모든 API 호출은 동기 HTTP 요청/응답

### 비동기 통신 (Event-Driven)
- OrderService → SSEService: 주문 생성/상태변경/삭제 시 이벤트 발행
- TableService → SSEService: 테이블 이용 완료 시 이벤트 발행
- SSEService → Admin Frontend: SSE 스트림으로 실시간 전달

## 데이터 흐름

```
[고객 태블릿]                          [관리자 브라우저]
     |                                       |
     | HTTP (주문 생성)                      | SSE (실시간 수신)
     ↓                                       ↑
[Express Routes]                      [SSE Endpoint]
     |                                       ↑
     ↓                                       |
[OrderService] ──── broadcast ────→ [SSEService]
     |
     ↓
[Prisma ORM]
     |
     ↓
[PostgreSQL]
```

## 프론트엔드 컴포넌트 구조

```
[Vue.js App]
├── /customer (고객용)
│   ├── MenuView - 메뉴 조회/탐색
│   ├── CartView - 장바구니 관리
│   ├── OrderView - 주문 확정/내역
│   └── LoginView - 테이블 로그인
├── /admin (관리자용)
│   ├── DashboardView - 실시간 주문 모니터링
│   ├── TableManageView - 테이블 관리
│   ├── MenuManageView - 메뉴 관리
│   └── LoginView - 관리자 로그인
└── /stores (Pinia)
    ├── authStore - 인증 상태
    ├── menuStore - 메뉴 데이터
    ├── cartStore - 장바구니 (localStorage 연동)
    └── orderStore - 주문 데이터
```
