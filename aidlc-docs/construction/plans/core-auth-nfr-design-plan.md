# NFR Design Plan - Unit 1: core-auth

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: NFR Requirements 분석
- [x] Step 2: NFR 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (Q1=A, Q2=B - 모호함 없음)

### Part 2: 생성
- [x] Step 6: nfr-design-patterns.md 생성
- [x] Step 7: logical-components.md 생성
- [x] Step 8: 검증 및 승인 요청 - 승인 완료

---

## 설계 범위

NFR Requirements에서 결정된 사항을 구체적인 설계 패턴과 논리적 컴포넌트로 변환합니다:
- 보안 패턴: 인증 미들웨어 체인, Rate Limiting 구현 방식
- 로깅 패턴: winston 설정, 로그 포맷, transport 구성
- 에러 처리 패턴: 글로벌 에러 핸들러, 커스텀 에러 클래스
- 성능 패턴: bcrypt 비동기 처리, DB 연결 관리

---

## 질문

### Q1: Rate Limiting 구현 방식
로그인 시도 제한을 어떻게 구현할까요?

- A) DB 기반 (LoginAttempt 테이블 조회 - Functional Design에서 설계한 방식)
- B) 인메모리 기반 (express-rate-limit + rate-limit-store) - 서버 재시작 시 초기화
- C) A+B 혼합 (express-rate-limit로 1차 방어 + DB로 영구 기록)
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q2: 로그 출력 대상
개발 환경에서 로그를 어디에 출력할까요?

- A) 콘솔만 (개발 편의)
- B) 콘솔 + 파일 (logs/ 디렉토리)
- C) 파일만
- D) Other (please describe after [Answer]: tag below)

[Answer]: B

