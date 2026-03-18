# NFR Requirements Plan - Unit 1: core-auth

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Functional Design 분석
- [x] Step 2: NFR 평가 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (Q1=A, Q2=A, Q3=C, Q4=C - 모호함 없음)

### Part 2: 생성
- [x] Step 6: nfr-requirements.md 생성
- [x] Step 7: tech-stack-decisions.md 생성
- [x] Step 8: 검증 및 승인 요청 - 승인 완료

---

## 평가 범위

Unit 1(core-auth)은 전체 시스템의 기반이므로 다음 NFR 영역을 평가합니다:
- 성능: 로그인 API 응답 시간, DB 연결 풀
- 보안: JWT 시크릿 관리, bcrypt 설정, HTTPS, 보안 헤더
- 신뢰성: 에러 처리, DB 연결 복구
- 로깅/모니터링: 구조화 로깅, 보안 이벤트 알림
- 기술 스택 세부 결정: 라이브러리 버전, 검증 라이브러리

---

## 질문

### Q1: 로깅 프레임워크
백엔드 로깅 프레임워크를 어떤 것으로 사용할까요?

- A) winston (가장 널리 사용, 다양한 transport 지원)
- B) pino (고성능, JSON 기반, 낮은 오버헤드)
- C) morgan (HTTP 요청 로깅 전용, 단순)
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q2: 입력 검증 라이브러리
API 입력 검증에 어떤 라이브러리를 사용할까요?

- A) Joi (스키마 기반, Express와 잘 통합, 풍부한 에러 메시지)
- B) Zod (TypeScript 친화적, 타입 추론 지원)
- C) express-validator (Express 미들웨어 기반, 체이닝 방식)
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q3: DB 연결 풀 크기
PostgreSQL 연결 풀 크기를 어떻게 설정할까요? (매장당 30~100 테이블, 100+ 매장 SaaS 목표)

- A) 기본값 사용 (Prisma 기본: connection_limit=5)
- B) 중간 규모 (connection_limit=10)
- C) 대규모 (connection_limit=20)
- D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Q4: API 응답 시간 목표
인증 API(로그인, 토큰 검증)의 목표 응답 시간은?

- A) 500ms 이내 (일반적인 웹 서비스 수준)
- B) 200ms 이내 (빠른 응답 요구)
- C) 1초 이내 (bcrypt 해싱 고려한 여유 있는 목표)
- D) Other (please describe after [Answer]: tag below)

[Answer]: C

