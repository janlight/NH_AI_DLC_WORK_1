# Service Layer Summary - Unit 4: table-session

## tableService.js

| 메서드 | 스토리 | 설명 |
|---|---|---|
| getTables | US-07-01 | 매장 테이블 목록 + 현재 세션 총액 (Raw SQL 집계) |
| createTable | US-07-01 | 테이블 생성 (중복 검증, bcrypt 해싱) |
| completeTable | US-07-03 | 이용 완료 트랜잭션 (60초 타임아웃, 낙관적 잠금) |
| deleteOrder | US-07-02 | 주문 삭제 (트랜잭션) |
| getOrderHistory | US-07-04 | 과거 내역 조회 (만료 필터, 날짜 필터) |

## 적용 패턴
- DP-T01: Prisma $transaction (60초 타임아웃)
- DP-T02: 낙관적 잠금 (version 필드)
- DP-T04: Raw SQL 집계 쿼리 (N+1 방지)
