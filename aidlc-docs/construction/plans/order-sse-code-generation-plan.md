# Code Generation Plan - Unit 3: order-sse

## Unit Context

### 담당 스토리
| 에픽 | 스토리 | 설명 |
|---|---|---|
| EP-03 | US-03-01 | 장바구니에 메뉴 추가 |
| EP-03 | US-03-02 | 장바구니 수정 및 관리 |
| EP-04 | US-04-01 | 주문 확정 |
| EP-04 | US-04-02 | 주문 내역 조회 |
| EP-06 | US-06-01 | 실시간 주문 대시보드 조회 |
| EP-06 | US-06-02 | 주문 상세 확인 및 상태 변경 |
| EP-09 | US-09-02 | 성능 (SSE 2초 이내) |

### 의존성
- Unit 1 (core-auth): Prisma 스키마, authMiddleware, Express 앱 구조, axios 인스턴스
- Unit 1 미완료 시: 스텁/모킹으로 독립 개발 가능하도록 구현

### 설계 산출물 참조
- `aidlc-docs/construction/order-sse/functional-design/` (domain-entities, business-rules, business-logic-model, frontend-components)
- `aidlc-docs/construction/order-sse/nfr-design/` (nfr-design-patterns, logical-components)
- `aidlc-docs/construction/order-sse/nfr-requirements/` (nfr-requirements, tech-stack-decisions)

---

## 코드 생성 위치
- **백엔드**: `backend/src/` (모놀리스 구조)
- **프론트엔드**: `frontend/src/` (Vue.js 3)
- **테스트**: `backend/tests/`, `frontend/tests/`
- **문서**: `aidlc-docs/construction/order-sse/code/`

---

## 실행 계획

### Backend

- [x] Step 1: 백엔드 프로젝트 구조 셋업 (Unit 3 파일/폴더 생성)
- [x] Step 2: OrderQueueService 구현 (인메모리 큐, backpressure, 타임아웃)
- [x] Step 3: OrderQueueService 단위 테스트
- [x] Step 4: SSEService 구현 (연결 관리, 브로드캐스트, heartbeat)
- [x] Step 5: SSEService 단위 테스트
- [x] Step 6: OrderService 구현 (주문 CRUD, 상태 변경, 이력 조회 - Result 패턴)
- [x] Step 7: OrderService 단위 테스트
- [x] Step 8: 입력 검증 함수 구현 (orderValidators.js)
- [x] Step 9: 주문 라우터 구현 (orderRoutes.js - 검증, 테넌트 격리, Result 분기)
- [x] Step 10: SSE 라우터 구현 (sseRoutes.js)
- [x] Step 11: API 통합 테스트 (supertest - 주문 CRUD + 상태 변경)
- [x] Step 12: 백엔드 코드 요약 문서 생성

### Frontend

- [x] Step 13: 프론트엔드 프로젝트 구조 셋업 (Unit 3 파일/폴더 생성)
- [x] Step 14: orderApi.js 구현 (axios 인스턴스, API 호출 함수)
- [x] Step 15: cartStore.js 구현 (Pinia, localStorage 연동)
- [x] Step 16: cartStore 단위 테스트
- [x] Step 17: orderStore.js 구현 (Pinia, API 연동)
- [x] Step 18: orderStore 단위 테스트
- [x] Step 19: useSSE.js composable 구현 (재연결 로직, Circuit Breaker)
- [x] Step 20: useSSE 단위 테스트
- [x] Step 21: CartView.vue 구현 (장바구니 화면)
- [x] Step 22: OrderView.vue 구현 (주문 확정 + 내역)
- [x] Step 23: DashboardView.vue 구현 (관리자 실시간 대시보드)
- [x] Step 24: 프론트엔드 컴포넌트 단위 테스트 (CartView, OrderView, DashboardView)
- [x] Step 25: 프론트엔드 코드 요약 문서 생성

### 스토리 완료 추적
- [x] US-03-01: 장바구니에 메뉴 추가 (Step 15, 21)
- [x] US-03-02: 장바구니 수정 및 관리 (Step 15, 21)
- [x] US-04-01: 주문 확정 (Step 6, 9, 17, 22)
- [x] US-04-02: 주문 내역 조회 (Step 6, 9, 17, 22)
- [x] US-06-01: 실시간 주문 대시보드 조회 (Step 4, 10, 19, 23)
- [x] US-06-02: 주문 상세 확인 및 상태 변경 (Step 6, 9, 17, 23)
- [x] US-09-02: 성능 - SSE 2초 이내 (Step 2, 4)
