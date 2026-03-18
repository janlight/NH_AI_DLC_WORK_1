# NFR Design Plan - Unit 2: menu-management

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: NFR Requirements 분석
- [x] Step 2: NFR Design 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석

### Part 2: 생성
- [x] Step 6: nfr-design-patterns.md 생성
- [x] Step 7: logical-components.md 생성
- [x] Step 8: 검증 및 승인 요청

---

## 질문 답변

### Q1: Rate Limiting 전략
[Answer]: B (매장당 분당 20건 제한, storeId 기반)

### Q2: ETag 생성 방식
[Answer]: A (updatedAt 타임스탬프 기반 해시)

---

## 답변 분석 결과

| 질문 | 답변 | 설계 반영 |
|---|---|---|
| Q1 | B (매장당) | express-rate-limit keyGenerator에 storeId 사용, 분당 20건 |
| Q2 | A (updatedAt) | Prisma updatedAt 활용, 목록은 MAX(updatedAt) 사용 |
