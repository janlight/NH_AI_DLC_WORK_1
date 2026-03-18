# Unit of Work 정의 (4인 팀 구성)

## 아키텍처 결정
- **배포 모델**: 모놀리스 (단일 앱 라우팅)
- **Unit 수**: 4개 (팀원별 1개)
- **개발 순서**: 백엔드 우선 (DB 스키마 → API → 프론트엔드)

## Unit 분할 원칙
- 모놀리스 내에서 논리적 모듈 단위로 분할
- 각 Unit이 독립적으로 개발 가능하도록 의존성 최소화
- 공통 기반(DB 스키마, 인증 미들웨어)은 Unit 1에서 먼저 구축

---

## Unit 1: core-auth (기반 + 인증)

**담당**: 팀원 1
**우선순위**: 🔴 최우선 (다른 Unit의 기반)

**책임**:
- Prisma 스키마 전체 설계 및 마이그레이션
- 시드 데이터 (매장, 관리자 계정)
- AuthComponent / AuthService (테이블 로그인, 관리자 로그인)
- JWT 미들웨어, 에러 처리 미들웨어
- Express 앱 기본 구조 (app.js, 라우터 등록)
- Docker Compose 설정
- 프론트엔드: 고객 LoginView, 관리자 LoginView, authStore

**포함 컴포넌트**: AuthComponent, StoreComponent
**포함 서비스**: AuthService

**산출물**:
```
backend/
├── src/
│   ├── app.js
│   ├── routes/auth.js
│   ├── services/authService.js
│   ├── middleware/auth.js
│   └── middleware/errorHandler.js
├── prisma/
│   ├── schema.prisma        # 전체 스키마
│   └── seed.js
├── .env
docker-compose.yml

frontend/
└── src/
    ├── App.vue
    ├── router/index.js
    ├── api/client.js         # Axios 인스턴스
    ├── stores/authStore.js
    └── views/
        ├── customer/LoginView.vue
        └── admin/LoginView.vue
```

---

## Unit 2: menu-management (메뉴)

**담당**: 팀원 2
**우선순위**: 🟡 Unit 1 스키마 완료 후 시작 가능

**책임**:
- MenuComponent / MenuService (메뉴 CRUD)
- 카테고리 관리
- 메뉴 노출 순서 관리
- 이미지 업로드 (multer + 로컬 파일 시스템)
- 프론트엔드: 고객 MenuView, 관리자 MenuManageView, menuStore

**포함 컴포넌트**: MenuComponent
**포함 서비스**: MenuService

**산출물**:
```
backend/src/
├── routes/menu.js
└── services/menuService.js

frontend/src/
├── stores/menuStore.js
└── views/
    ├── customer/MenuView.vue
    ├── customer/MenuDetailModal.vue
    └── admin/MenuManageView.vue
```

---

## Unit 3: order-sse (주문 + 실시간)

**담당**: 팀원 3
**우선순위**: 🟡 Unit 1 스키마 완료 후 시작 가능

**책임**:
- OrderComponent / OrderService (주문 생성, 조회, 상태 변경, 삭제)
- SSEComponent / SSEService (실시간 이벤트 브로드캐스트)
- 주문 이력 관리 (OrderHistory)
- 프론트엔드: 고객 CartView, OrderView, 관리자 DashboardView, cartStore, orderStore

**포함 컴포넌트**: OrderComponent, SSEComponent
**포함 서비스**: OrderService, SSEService

**산출물**:
```
backend/src/
├── routes/order.js
├── routes/sse.js
├── services/orderService.js
└── services/sseService.js

frontend/src/
├── stores/cartStore.js
├── stores/orderStore.js
└── views/
    ├── customer/CartView.vue
    ├── customer/OrderView.vue
    └── admin/DashboardView.vue
```

---

## Unit 4: table-session (테이블 + 세션)

**담당**: 팀원 4
**우선순위**: 🟡 Unit 1 스키마 완료 후, Unit 3 OrderService 인터페이스 확정 후 시작 권장

**책임**:
- TableComponent / TableService (테이블 설정, 세션 관리)
- 이용 완료 처리 (주문 → OrderHistory 이동, 테이블 리셋)
- 프론트엔드: 관리자 TableManageView

**포함 컴포넌트**: TableComponent
**포함 서비스**: TableService

**산출물**:
```
backend/src/
├── routes/table.js
└── services/tableService.js

frontend/src/
└── views/
    └── admin/TableManageView.vue
```

---

## 코드 구조 (전체)

```
table-order/
├── backend/
│   ├── src/
│   │   ├── app.js                    # [Unit 1]
│   │   ├── routes/
│   │   │   ├── auth.js               # [Unit 1]
│   │   │   ├── menu.js               # [Unit 2]
│   │   │   ├── order.js              # [Unit 3]
│   │   │   ├── sse.js                # [Unit 3]
│   │   │   └── table.js              # [Unit 4]
│   │   ├── services/
│   │   │   ├── authService.js        # [Unit 1]
│   │   │   ├── menuService.js        # [Unit 2]
│   │   │   ├── orderService.js       # [Unit 3]
│   │   │   ├── sseService.js         # [Unit 3]
│   │   │   └── tableService.js       # [Unit 4]
│   │   └── middleware/
│   │       ├── auth.js               # [Unit 1]
│   │       └── errorHandler.js       # [Unit 1]
│   ├── prisma/                        # [Unit 1]
│   └── uploads/                       # [Unit 2]
├── frontend/
│   └── src/
│       ├── App.vue                    # [Unit 1]
│       ├── router/index.js            # [Unit 1] 기본, 각 Unit에서 라우트 추가
│       ├── api/client.js              # [Unit 1]
│       ├── stores/
│       │   ├── authStore.js           # [Unit 1]
│       │   ├── menuStore.js           # [Unit 2]
│       │   ├── cartStore.js           # [Unit 3]
│       │   └── orderStore.js          # [Unit 3]
│       └── views/
│           ├── customer/
│           │   ├── LoginView.vue      # [Unit 1]
│           │   ├── MenuView.vue       # [Unit 2]
│           │   ├── CartView.vue       # [Unit 3]
│           │   └── OrderView.vue      # [Unit 3]
│           └── admin/
│               ├── LoginView.vue      # [Unit 1]
│               ├── MenuManageView.vue # [Unit 2]
│               ├── DashboardView.vue  # [Unit 3]
│               └── TableManageView.vue# [Unit 4]
├── docker-compose.yml                 # [Unit 1]
└── .env                               # [Unit 1]
```

## 개발 타임라인

```
Week 1:  [Unit 1] DB 스키마 + 인증 API + 기본 구조
         [Unit 2~4] 설계 문서 리뷰, 인터페이스 합의

Week 2:  [Unit 1] 프론트엔드 로그인 + Docker
         [Unit 2] 메뉴 API + 프론트엔드
         [Unit 3] 주문 API + SSE + 프론트엔드
         [Unit 4] 테이블 API + 프론트엔드

Week 3:  통합 테스트 + 버그 수정
```
