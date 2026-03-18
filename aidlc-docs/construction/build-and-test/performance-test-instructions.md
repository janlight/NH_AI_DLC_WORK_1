# Performance Test Instructions - Unit 4: table-session

## 성능 요구사항
- `GET /api/stores/:storeId/tables`: 100개 테이블 기준 1초 이내 (NFR-T04)
- `POST /api/stores/:storeId/tables/:tableId/complete`: 60초 타임아웃 내 완료 (NFR-T01)

## 환경 설정
```bash
cd table-order
docker-compose up -d
cd backend && npx prisma migrate dev
```

## 테스트 데이터 준비
```bash
# 100개 테이블 + 각 10건 주문 시드 스크립트 실행
node scripts/seed-performance-data.js
```

## 테스트 실행

### 1. 테이블 목록 조회 성능
```bash
# 100개 테이블 조회 응답 시간 측정
for i in {1..10}; do
  curl -o /dev/null -s -w "Response: %{time_total}s\n" \
    http://localhost:3000/api/stores/store1/tables \
    -H "Authorization: Bearer $TOKEN"
done
```

**기준**: 평균 응답 시간 < 1초

### 2. 이용 완료 트랜잭션 성능
```bash
# 대량 주문(50건) 테이블 이용 완료 시간 측정
curl -o /dev/null -s -w "Response: %{time_total}s\n" \
  -X POST http://localhost:3000/api/stores/store1/tables/TABLE_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

**기준**: 60초 타임아웃 내 완료

### 3. 동시 요청 테스트
```bash
# 10개 동시 테이블 조회 요청
for i in {1..10}; do
  curl -o /dev/null -s -w "Response: %{time_total}s\n" \
    http://localhost:3000/api/stores/store1/tables \
    -H "Authorization: Bearer $TOKEN" &
done
wait
```

## 결과 분석
- 평균 응답 시간이 1초 초과 시: DB 인덱스 확인, 쿼리 실행 계획 분석
- 트랜잭션 타임아웃 시: 배치 크기 조정, 쿼리 최적화

## 정리
```bash
docker-compose down
```
