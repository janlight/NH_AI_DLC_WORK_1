# Functional Design Plan - Unit 3: order-sse

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석

### Part 2: 생성
- [x] Step 6: domain-entities.md 생성
- [x] Step 7: business-rules.md 생성
- [x] Step 8: business-logic-model.md 생성
- [x] Step 9: frontend-components.md 생성
- [x] Step 10: 검증 및 승인 요청

---

## 설계 범위

- OrderComponent / OrderService 상세 비즈니스 로직
- SSEComponent / SSEService 실시간 이벤트 관리
- 장바구니 (클라이언트 측 localStorage)
- 주문 생성, 조회, 상태 변경, 삭제
- 프론트엔드: CartView, OrderView (고객), DashboardView (관리자), cartStore, orderStore

## 관련 스토리
- US-03-01 (장바구니에 메뉴 추가)
- US-03-02 (장바구니 수정 및 관리)
- US-04-01 (주문 확정)
- US-04-02 (주문 내역 조회)
- US-06-01 (실시간 주문 대시보드 조회)
- US-06-02 (주문 상세 확인 및 상태 변경)
- US-09-02 (성능 - SSE 2초 이내)

---

## 질문

### Q1: 주문 번호 형식
주문 번호를 어떤 형식으로 생성할까요?

- A) 자동 증가 숫자 (1, 2, 3...) - 매장별 독립 시퀀스
- B) 날짜 기반 (예: 20260318-001)
- C) UUID
- D) Other (please describe after [Answer]: tag below)

[Answer]: B - 날짜 기반 (예: 20260318-001)

### Q2: 주문 상태 변경 규칙
주문 상태 변경 시 역방향 전환을 허용할까요? (예: 준비중 → 대기중)

- A) 순방향만 허용 (대기중 → 준비중 → 완료)
- B) 역방향도 허용 (실수 정정 가능)
- C) Other (please describe after [Answer]: tag below)

[Answer]: A - 순방향만 허용 (대기중 → 준비중 → 완료)

### Q3: SSE 재연결 전략
SSE 연결이 끊겼을 때 클라이언트 재연결 방식은?

- A) 즉시 재연결 시도 + 지수 백오프 (1초, 2초, 4초...)
- B) 5초 간격 고정 재연결
- C) EventSource 기본 재연결 동작 사용
- D) Other (please describe after [Answer]: tag below)

[Answer]: A - 즉시 재연결 시도 + 지수 백오프 (1초, 2초, 4초...)

### Q4: 관리자 대시보드 주문 미리보기 개수
테이블 카드에 표시할 최신 주문 미리보기 개수는?

- A) 최신 3개
- B) 최신 5개
- C) 전체 표시
- D) Other (please describe after [Answer]: tag below)

[Answer]: A - 최신 3개
