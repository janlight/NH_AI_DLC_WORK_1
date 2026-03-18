# Functional Design Plan - Unit 4: table-session

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (모호함/모순 없음)

### Part 2: 생성
- [x] Step 6: domain-entities.md 생성
- [x] Step 7: business-rules.md 생성
- [x] Step 8: business-logic-model.md 생성
- [x] Step 9: frontend-components.md 생성
- [x] Step 10: 검증 및 승인 요청 - 승인 완료 (2026-03-18T15:08:24+09:00)

---

## 설계 범위

- TableComponent / TableService 상세 비즈니스 로직
- 테이블 세션 라이프사이클 (시작 → 종료)
- 이용 완료 처리 (주문 → OrderHistory 이동, 리셋)
- 프론트엔드: TableManageView (관리자)

## 관련 스토리
- US-07-01 (테이블 초기 설정)
- US-07-02 (주문 삭제)
- US-07-03 (테이블 이용 완료 처리)
- US-07-04 (과거 주문 내역 조회)

---

## 질문

### Q1: 테이블 세션 시작 시점
테이블 세션은 언제 시작될까요?

- A) 해당 테이블의 첫 주문 생성 시 자동 시작 (요구사항 명시)
- B) 관리자가 수동으로 세션 시작
- C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q2: 과거 주문 내역 보존 기간
이용 완료 후 과거 주문 내역을 얼마나 보존할까요?

- A) 영구 보존
- B) 90일 보존 후 자동 삭제
- C) 365일 보존 후 자동 삭제
- D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Q3: 이용 완료 시 고객 태블릿 동작
테이블 이용 완료 처리 시 고객 태블릿 화면은 어떻게 될까요?

- A) 자동으로 메뉴 화면으로 리셋 (장바구니 비우기 포함)
- B) 현재 화면 유지, 다음 주문 시도 시 세션 만료 안내
- C) Other (please describe after [Answer]: tag below)

[Answer]: A

