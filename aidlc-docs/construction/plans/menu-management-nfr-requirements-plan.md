# NFR Requirements Plan - Unit 2: menu-management

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Functional Design 분석
- [x] Step 2: NFR 평가 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석

### Part 2: 생성
- [x] Step 6: nfr-requirements.md 생성
- [x] Step 7: tech-stack-decisions.md 생성
- [x] Step 8: 검증 및 승인 요청

---

## 평가 범위

- menu-management Unit의 성능, 보안, 확장성, 가용성 요구사항
- 이미지 업로드 관련 성능/보안 고려사항
- Security Baseline Extension 준수 사항
- 기술 스택 세부 결정 (이미 결정된 Express + Prisma + Vue.js 기반)

## 참조 문서
- Functional Design: domain-entities.md, business-rules.md, business-logic-model.md, frontend-components.md
- 요구사항: FR-02, FR-09, NFR-01~06
- Security Extension: Enabled (blocking)

---

## 질문

### Q1: 메뉴 조회 응답 시간 목표
[Answer]: A (200ms 이내)

### Q2: 이미지 업로드 동시 처리
[Answer]: D - 100건 동시 처리

### Q3: 메뉴 데이터 캐싱 전략
[Answer]: B (HTTP 캐시 헤더 활용)

### Q4: 에러 로깅 수준
[Answer]: A (구조화된 로깅 - winston/pino, JSON 포맷, request ID 포함)
- 초기 답변 B(console.log)에서 SECURITY-03 준수를 위해 A로 변경

---

## 답변 분석 결과

| 질문 | 최종 답변 | 설계 반영 사항 |
|---|---|---|
| Q1 | A (200ms) | DB 인덱싱 최적화, HTTP 캐시 헤더 적용 |
| Q2 | 100건 동시 | multer 동시 업로드 제한, 큐잉 또는 rate limiting 고려 |
| Q3 | B (HTTP 캐시) | Cache-Control, ETag 헤더 설정 |
| Q4 | A (구조화 로깅) | winston/pino 도입, JSON 포맷, request ID 추적 |

- 모호한 답변: 없음
- SECURITY-03 충돌 해소: Q4를 A로 변경하여 준수
