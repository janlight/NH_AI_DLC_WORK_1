# Infrastructure Design Plan - Unit 4: table-session

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: 설계 산출물 분석
- [x] Step 2: 인프라 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (모호함/모순 없음)

### Part 2: 생성
- [x] Step 6: infrastructure-design.md 생성
- [x] Step 7: deployment-architecture.md 생성
- [x] Step 8: 검증 및 승인 요청 - 승인 완료 (2026-03-18T15:22:21+09:00)

---

## 설계 범위

Unit 4는 모놀리스 내 모듈이므로 독립 인프라가 아닌, 공유 인프라(Unit 1) 위에서 동작합니다.
Unit 4 고유 인프라 고려사항:
- node-cron 배치 작업 실행 환경
- DB 인덱스 및 마이그레이션
- 테이블 관리 API 라우트 등록

---

## 질문

### Q1: 배치 작업 실행 환경
node-cron 배치 작업(OrderHistory 삭제)은 어디서 실행할까요?

- A) Express 서버 프로세스 내에서 실행 (별도 프로세스 불필요, MVP 적합)
- B) 별도 워커 프로세스로 분리 (Docker Compose에 worker 서비스 추가)
- C) Other (please describe after [Answer]: tag below)

[Answer]: A

