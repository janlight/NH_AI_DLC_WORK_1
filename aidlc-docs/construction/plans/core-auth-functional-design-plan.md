# Functional Design Plan - Unit 1: core-auth

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (Q1=A, Q2=A, Q3=A - 모호함 없음)

### Part 2: 생성
- [x] Step 6: domain-entities.md 생성
- [x] Step 7: business-rules.md 생성
- [x] Step 8: business-logic-model.md 생성
- [x] Step 9: frontend-components.md 생성
- [x] Step 10: 검증 및 승인 요청 - 승인 완료

---

## 설계 범위

- Prisma 스키마 전체 설계 (전 Unit 공통 기반)
- AuthComponent / AuthService 상세 비즈니스 로직
- JWT 발급/검증, bcrypt 해싱, rate limiting
- 고객 테이블 로그인 / 관리자 로그인
- 프론트엔드: LoginView (고객/관리자), authStore

## 관련 스토리
- US-01-01 (테이블 태블릿 초기 로그인)
- US-01-02 (세션 만료 처리)
- US-05-01 (관리자 로그인)
- US-09-01 (보안)

---

## 질문

### Q1: 로그인 시도 제한 정책
로그인 실패 시 차단 정책은?

- A) 5회 실패 시 15분 차단
- B) 10회 실패 시 30분 차단
- C) 3회 실패 시 5분 차단
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q2: JWT 토큰 구조
고객용과 관리자용 JWT 토큰을 어떻게 구분할까요?

- A) 토큰 payload의 role 필드로 구분 (customer / admin)
- B) 별도 시크릿 키로 서명 (고객용 키, 관리자용 키)
- C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q3: 관리자 계정 초기 생성
최초 매장 등록 시 관리자 계정은 어떻게 생성할까요?

- A) 시드 데이터로 기본 관리자 1개 생성 (이전 요구사항 결정대로)
- B) 회원가입 API 제공
- C) Other (please describe after [Answer]: tag below)

[Answer]: A

