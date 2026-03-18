# Frontend Code Summary - Unit 3: order-sse

## 생성된 파일

| 파일 | 역할 |
|---|---|
| `frontend/src/api/orderApi.js` | axios 기반 API 클라이언트 (주문 CRUD) |
| `frontend/src/stores/cartStore.js` | 장바구니 Pinia 스토어 (localStorage 연동) |
| `frontend/src/stores/orderStore.js` | 주문 Pinia 스토어 (API + SSE 이벤트 연동) |
| `frontend/src/composables/useSSE.js` | SSE 연결 관리 composable (지수 백오프, Circuit Breaker) |
| `frontend/src/views/customer/CartView.vue` | 고객 장바구니 화면 |
| `frontend/src/views/customer/OrderView.vue` | 고객 주문 확정 + 내역 화면 |
| `frontend/src/views/admin/DashboardView.vue` | 관리자 실시간 주문 대시보드 |

## 테스트 파일

| 파일 | 유형 |
|---|---|
| `frontend/tests/unit/cartStore.test.js` | cartStore 단위 테스트 |
| `frontend/tests/unit/orderStore.test.js` | orderStore 단위 테스트 |
| `frontend/tests/unit/useSSE.test.js` | useSSE composable 단위 테스트 |
| `frontend/tests/unit/components.test.js` | Vue 컴포넌트 테스트 시나리오 (todo) |

## Unit 1 통합 시 필요 작업
1. `orderApi.js`: api/client.js import로 교체 (공통 axios 인스턴스)
2. `router/index.js`에 Unit 3 라우트 등록
3. `DashboardView.vue`: storeId를 authStore에서 가져오도록 수정
4. `useSSE.js`: EventSource 인증 방식을 Unit 1 구현에 맞게 조정
5. Vue Test Utils 환경 구성 후 컴포넌트 테스트 구현
