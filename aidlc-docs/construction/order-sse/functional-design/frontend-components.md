# Frontend Components - Unit 3: order-sse

## 컴포넌트 계층 구조

```
customer/
  CartView.vue          - 장바구니 화면
  OrderView.vue         - 주문 확정 + 주문 내역 조회

admin/
  DashboardView.vue     - 실시간 주문 대시보드

stores/
  cartStore.js          - 장바구니 상태 (localStorage)
  orderStore.js         - 주문 상태 (API 연동)

composables/
  useSSE.js             - SSE 연결 관리 (재연결 로직 포함)
```

---

## 1. CartView.vue (고객 - 장바구니)

**경로**: `/customer/cart`
**역할**: 장바구니 항목 관리 및 주문 확정 진입

### Props / 의존성
- cartStore (Pinia)
- router (메뉴 화면 이동)

### 상태
- 없음 (cartStore에서 관리)

### UI 구성
- 장바구니 항목 목록
  - 각 항목: 메뉴명, 단가, 수량 조절 (+/-), 소계, 삭제 버튼
  - 수량 조절 버튼: 최소 44x44px
- 총 금액 표시
- 장바구니 비우기 버튼
- 주문하기 버튼 (빈 장바구니 시 비활성화)
- 빈 장바구니 안내 메시지 + 메뉴 보기 링크

### 사용자 인터랙션
| 액션 | 동작 |
|---|---|
| +/- 버튼 | cartStore.updateQuantity() |
| 삭제 버튼 | cartStore.removeItem() |
| 비우기 버튼 | 확인 후 cartStore.clearCart() |
| 주문하기 | OrderView로 이동 (주문 확인 화면) |

### API 연동
- 없음 (클라이언트 전용, localStorage)

---

## 2. OrderView.vue (고객 - 주문 확정 + 내역)

**경로**: `/customer/orders`
**역할**: 주문 최종 확인, 확정, 주문 내역 조회

### Props / 의존성
- cartStore, orderStore (Pinia)
- authStore (세션 정보)
- router

### 상태
- `mode`: 'confirm' | 'history' (주문 확인 / 내역 조회)
- `orderResult`: { orderNumber, success } | null
- `showSuccessModal`: boolean
- `redirectCountdown`: number (5초 카운트다운)

### UI 구성 - 주문 확인 모드
- 주문 내역 요약 (메뉴명, 수량, 단가, 소계)
- 총 금액
- 주문 확정 버튼
- 뒤로가기 (장바구니로)

### UI 구성 - 주문 성공
- 주문번호 표시
- "5초 후 메뉴 화면으로 이동합니다" 카운트다운
- 즉시 이동 버튼

### UI 구성 - 주문 내역 모드
- 주문 목록 (시간 역순)
- 각 주문: 주문번호, 시각, 메뉴/수량, 금액, 상태 뱃지
- 상태 뱃지 색상: PENDING(노랑), PREPARING(파랑), COMPLETED(초록)
- 주문 없을 시 안내 메시지

### 사용자 인터랙션
| 액션 | 동작 |
|---|---|
| 주문 확정 | orderStore.createOrder() → 성공 시 모달 표시 |
| 5초 타이머 | 메뉴 화면 자동 리다이렉트 |
| 탭 전환 | confirm ↔ history 모드 전환 |

### API 연동
- `POST /api/stores/:storeId/tables/:tableId/orders` (주문 생성)
- `GET /api/stores/:storeId/tables/:tableId/orders` (주문 내역)

---

## 3. DashboardView.vue (관리자 - 실시간 대시보드)

**경로**: `/admin/dashboard`
**역할**: 테이블별 실시간 주문 모니터링 및 상태 관리

### Props / 의존성
- orderStore (Pinia)
- authStore (관리자 인증)
- useSSE composable

### 상태
- `selectedOrder`: Order | null (상세 보기용)
- `showOrderDetail`: boolean
- `showDeleteConfirm`: boolean
- `sseStatus`: 'connected' | 'reconnecting' | 'disconnected'
- `highlightedOrders`: Set<orderId> (신규 주문 강조)

### UI 구성
- SSE 연결 상태 표시 (상단 바)
- 테이블 그리드 레이아웃
  - 각 테이블 카드:
    - 테이블 번호
    - 총 주문액
    - 최신 3개 주문 미리보기 (주문번호, 상태 뱃지)
    - 신규 주문 시 카드 하이라이트 (3초간)
- 주문 상세 모달:
  - 전체 메뉴 목록 (메뉴명, 수량, 단가, 소계)
  - 주문 상태 변경 버튼 (다음 상태로)
  - 주문 삭제 버튼
- 삭제 확인 팝업

### 사용자 인터랙션
| 액션 | 동작 |
|---|---|
| 테이블 카드 클릭 | 해당 테이블 주문 목록 표시 |
| 주문 클릭 | 주문 상세 모달 열기 |
| 상태 변경 버튼 | orderStore.updateOrderStatus() |
| 삭제 버튼 | 확인 팝업 → orderStore.deleteOrder() |

### SSE 이벤트 처리
| 이벤트 | 처리 |
|---|---|
| `new-order` | storeOrders에 추가, 해당 카드 하이라이트 |
| `order-status` | 해당 주문 상태 업데이트 |
| `order-deleted` | 해당 주문 제거, 총액 업데이트 |
| `table-completed` | 해당 테이블 카드 리셋 |

### API 연동
- `GET /api/stores/:storeId/orders` (초기 로드)
- `GET /api/stores/:storeId/events` (SSE 스트림)
- `PUT /api/stores/:storeId/orders/:orderId/status` (상태 변경)
- `DELETE /api/stores/:storeId/orders/:orderId` (주문 삭제)
- `GET /api/stores/:storeId/tables/:tableId/order-history` (과거 내역)

---

## 4. useSSE Composable

**역할**: SSE 연결 관리, 재연결 로직, 이벤트 디스패치

### 인터페이스

```
useSSE(storeId, handlers: {
  onNewOrder: (data) => void,
  onOrderStatus: (data) => void,
  onOrderDeleted: (data) => void,
  onTableCompleted: (data) => void
})

반환:
- status: Ref<'connected' | 'reconnecting' | 'disconnected'>
- connect(): void
- disconnect(): void
```

### 재연결 로직
1. EventSource 에러 발생 시 status = 'reconnecting'
2. 즉시 재연결 시도
3. 실패 시 지수 백오프: 1초 → 2초 → 4초 → 8초 → 16초 → 30초 (최대)
4. 최대 10회 재시도, 초과 시 status = 'disconnected' → 재연결 중단
5. "다시 연결" 수동 버튼 표시 → 클릭 시 retryCount 리셋 후 재연결 시작
6. 성공 시 status = 'connected', 백오프 및 retryCount 리셋
7. 컴포넌트 언마운트 시 자동 disconnect

---

## 5. 폼 검증 규칙

### 장바구니
| 필드 | 규칙 |
|---|---|
| quantity | 1 이상 정수 |
| items | 1개 이상 (주문 시) |

### 주문 상태 변경
| 필드 | 규칙 |
|---|---|
| status | PENDING→PREPARING 또는 PREPARING→COMPLETED만 허용 |

---

## 6. 상태 뱃지 스타일

| 상태 | 색상 | 텍스트 |
|---|---|---|
| PENDING | 노랑 (bg-yellow-100, text-yellow-800) | 대기중 |
| PREPARING | 파랑 (bg-blue-100, text-blue-800) | 준비중 |
| COMPLETED | 초록 (bg-green-100, text-green-800) | 완료 |
