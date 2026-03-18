# API Layer Summary - Unit 4: table-session

## table.js 엔드포인트

| Method | Path | 스토리 | 설명 |
|---|---|---|---|
| GET | /api/stores/:storeId/tables | US-07-01 | 테이블 목록 조회 |
| POST | /api/stores/:storeId/tables | US-07-01 | 테이블 생성 |
| POST | /api/stores/:storeId/tables/:tableId/complete | US-07-03 | 이용 완료 |
| DELETE | /api/stores/:storeId/orders/:orderId | US-07-02 | 주문 삭제 |
| GET | /api/stores/:storeId/tables/:tableId/order-history | US-07-04 | 과거 내역 |

## 에러 응답
- 400: 입력 검증 실패
- 404: 리소스 없음
- 409: 중복 테이블 번호 또는 낙관적 잠금 충돌 (retryAfter: 3000)
