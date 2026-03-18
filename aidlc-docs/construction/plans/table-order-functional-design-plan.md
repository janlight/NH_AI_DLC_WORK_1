# Functional Design Plan - table-order

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [ ] Step 4: 사용자 답변 수집
- [ ] Step 5: 답변 분석

### Part 2: 생성
- [ ] Step 6: domain-entities.md 생성
- [ ] Step 7: business-rules.md 생성
- [ ] Step 8: business-logic-model.md 생성
- [ ] Step 9: frontend-components.md 생성
- [ ] Step 10: 검증 및 승인 요청

---

## 설계 범위

Unit: table-order (모놀리스)
- 도메인 엔티티 및 관계 정의 (Prisma 스키마 기반)
- 비즈니스 규칙 및 검증 로직
- 비즈니스 로직 모델 (서비스별 상세 플로우)
- 프론트엔드 컴포넌트 구조

---

## 질문

### Q1: 주문 번호 형식
주문 번호를 어떤 형식으로 생성할까요?

- A) 자동 증가 숫자 (1, 2, 3...) - 매장별 독립 시퀀스
- B) 날짜 기반 (예: 20260318-001)
- C) UUID
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q2: 카테고리 관리 방식
메뉴 카테고리는 어떻게 관리할까요?

- A) 관리자가 자유롭게 카테고리 CRUD 가능 (별도 Category 테이블)
- B) 시드 데이터로 고정 카테고리 제공, 관리자가 추가/수정 가능
- C) 시스템 고정 카테고리만 사용 (변경 불가)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q3: 주문 상태 변경 규칙
주문 상태 변경 시 역방향 전환을 허용할까요? (예: 준비중 → 대기중)

- A) 순방향만 허용 (대기중 → 준비중 → 완료)
- B) 역방향도 허용 (실수 정정 가능)
- C) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q4: 테이블 세션 시작 시점
테이블 세션은 언제 시작될까요?

- A) 해당 테이블의 첫 주문 생성 시 자동 시작 (요구사항 명시)
- B) 관리자가 수동으로 세션 시작
- C) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q5: 이미지 업로드 제약
메뉴 이미지 업로드 시 파일 크기 및 형식 제한은?

- A) 최대 5MB, JPG/PNG만 허용
- B) 최대 10MB, JPG/PNG/WebP 허용
- C) 제한 없음 (서버 기본 설정)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q6: 로그인 시도 제한 정책
로그인 실패 시 차단 정책은?

- A) 5회 실패 시 15분 차단
- B) 10회 실패 시 30분 차단
- C) 3회 실패 시 5분 차단
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q7: 과거 주문 내역 보존 기간
이용 완료 후 과거 주문 내역을 얼마나 보존할까요?

- A) 영구 보존
- B) 90일 보존 후 자동 삭제
- C) 365일 보존 후 자동 삭제
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q8: 가격 범위 검증
메뉴 가격의 허용 범위는?

- A) 0원 초과 ~ 1,000,000원 이하
- B) 100원 이상 ~ 500,000원 이하
- C) 제한 없음 (양수만 검증)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

