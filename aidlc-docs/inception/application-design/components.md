# Components

## 1. AuthComponent (인증)

**목적**: 고객 테이블 인증 및 관리자 인증 처리

**책임**:
- 테이블 태블릿 로그인/자동 로그인
- 관리자 로그인
- JWT 토큰 발급/검증/갱신
- 비밀번호 해싱 (bcrypt)
- 로그인 시도 제한 (rate limiting)

**인터페이스**:
- `POST /api/auth/table-login` - 테이블 로그인
- `POST /api/auth/admin-login` - 관리자 로그인
- `POST /api/auth/verify` - 토큰 검증
- `authMiddleware` - 요청 인증 미들웨어

---

## 2. StoreComponent (매장)

**목적**: 멀티 테넌트 매장 데이터 관리

**책임**:
- 매장 정보 관리
- 테넌트 격리 보장

**인터페이스**:
- `GET /api/stores/:storeId` - 매장 정보 조회

---

## 3. MenuComponent (메뉴)

**목적**: 메뉴 및 카테고리 CRUD, 이미지 관리

**책임**:
- 메뉴 CRUD (등록/조회/수정/삭제)
- 카테고리 관리
- 메뉴 노출 순서 관리
- 이미지 업로드 (로컬 파일 시스템)
- 필드 검증 (필수 필드, 가격 범위)

**인터페이스**:
- `GET /api/stores/:storeId/menus` - 메뉴 목록 조회 (카테고리별)
- `GET /api/stores/:storeId/menus/:menuId` - 메뉴 상세 조회
- `POST /api/stores/:storeId/menus` - 메뉴 등록 (관리자)
- `PUT /api/stores/:storeId/menus/:menuId` - 메뉴 수정 (관리자)
- `DELETE /api/stores/:storeId/menus/:menuId` - 메뉴 삭제 (관리자)
- `PUT /api/stores/:storeId/menus/order` - 메뉴 순서 변경 (관리자)
- `POST /api/stores/:storeId/menus/:menuId/image` - 이미지 업로드 (관리자)

---

## 4. TableComponent (테이블)

**목적**: 테이블 설정 및 세션 라이프사이클 관리

**책임**:
- 테이블 초기 설정 (번호, 비밀번호)
- 테이블 세션 시작/종료
- 이용 완료 처리 (주문 이력 이동, 리셋)

**인터페이스**:
- `GET /api/stores/:storeId/tables` - 테이블 목록 조회 (관리자)
- `POST /api/stores/:storeId/tables` - 테이블 설정 (관리자)
- `POST /api/stores/:storeId/tables/:tableId/complete` - 이용 완료 처리 (관리자)

---

## 5. OrderComponent (주문)

**목적**: 주문 생성, 조회, 상태 관리, 삭제

**책임**:
- 주문 생성 (장바구니 → 주문 변환)
- 주문 조회 (현재 세션 / 과거 이력)
- 주문 상태 변경 (대기중/준비중/완료)
- 주문 삭제 (관리자 직권)
- 주문 이력 관리 (OrderHistory)

**인터페이스**:
- `POST /api/stores/:storeId/tables/:tableId/orders` - 주문 생성 (고객)
- `GET /api/stores/:storeId/tables/:tableId/orders` - 현재 세션 주문 조회 (고객)
- `GET /api/stores/:storeId/orders` - 전체 주문 조회 (관리자)
- `PUT /api/stores/:storeId/orders/:orderId/status` - 주문 상태 변경 (관리자)
- `DELETE /api/stores/:storeId/orders/:orderId` - 주문 삭제 (관리자)
- `GET /api/stores/:storeId/tables/:tableId/order-history` - 과거 주문 내역 (관리자)

---

## 6. SSEComponent (실시간 통신)

**목적**: Server-Sent Events 기반 실시간 주문 알림

**책임**:
- SSE 연결 관리 (관리자 클라이언트)
- 신규 주문 이벤트 브로드캐스트
- 주문 상태 변경 이벤트 브로드캐스트
- 연결 끊김 감지 및 정리

**인터페이스**:
- `GET /api/stores/:storeId/events` - SSE 스트림 연결 (관리자)
