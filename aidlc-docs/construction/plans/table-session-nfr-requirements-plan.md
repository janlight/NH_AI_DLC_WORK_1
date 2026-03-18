# NFR Requirements Plan - Unit 4: table-session

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Functional Design 분석
- [x] Step 2: NFR 평가 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (모호함/모순 없음)

### Part 2: 생성
- [x] Step 6: nfr-requirements.md 생성
- [x] Step 7: tech-stack-decisions.md 생성
- [x] Step 8: 검증 및 승인 요청 - 승인 완료 (2026-03-18T15:13:04+09:00)

---

## NFR 평가 범위

Unit 4의 핵심 NFR 고려사항:
- 이용 완료 트랜잭션 안정성 (데이터 무결성)
- 과거 주문 내역 90일 보존 및 삭제 전략
- 테이블 세션 동시성 제어
- SSE 이벤트 발행 신뢰성

---

## 질문

### Q1: 이용 완료 트랜잭션 타임아웃
이용 완료 처리 시 주문이 많을 경우 트랜잭션 타임아웃을 어떻게 설정할까요?

- A) 30초 타임아웃 (일반적)
- B) 60초 타임아웃 (대량 주문 고려)
- C) 타임아웃 없음 (Prisma 기본값)
- D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Q2: 동시성 제어
같은 테이블에 대해 이용 완료와 주문 생성이 동시에 발생할 경우 처리 방식은?

- A) 낙관적 잠금 (버전 필드 기반, 충돌 시 재시도)
- B) 비관적 잠금 (DB 레벨 row lock)
- C) 이용 완료 처리 중 해당 테이블 주문 API 차단
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Q3: 과거 내역 삭제 전략
90일 지난 OrderHistory 레코드 삭제 방식은?

- A) 조회 시 필터링만 (실제 삭제 안 함, MVP 적합)
- B) 일일 배치 작업으로 삭제 (cron job)
- C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Q4: 테이블 관리 페이지 성능
테이블 관리 페이지에서 매장당 최대 테이블 수 기준 성능 목표는?

- A) 100개 테이블까지 1초 이내 로딩
- B) 50개 테이블까지 1초 이내 로딩
- C) 특별한 성능 목표 없음 (합리적 수준)
- D) Other (please describe after [Answer]: tag below)

[Answer]: A

