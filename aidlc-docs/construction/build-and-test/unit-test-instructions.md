# Unit Test Execution - All Units

## 테스트 프레임워크
- **백엔드**: Jest
- **프론트엔드**: Vitest + Vue Test Utils

---

## Unit 3: order-sse

### 백엔드 단위 테스트

```bash
cd backend
npm run test:unit

# 개별 실행
npx jest tests/unit/orderQueueService.test.js
npx jest tests/unit/sseService.test.js
npx jest tests/unit/orderService.test.js

# 커버리지
npm run test:coverage
```

| 테스트 파일 | 테스트 수 | 설명 |
|---|---|---|
| orderQueueService.test.js | 8 | 큐 순차 처리, 병렬 처리, backpressure, 타임아웃 |
| sseService.test.js | 10 | 연결, 브로드캐스트, 클라이언트 제거, 매장 격리 |
| orderService.test.js | 12 | 주문 CRUD, 상태 전이, 에러 케이스 |
| **합계** | **~30** | |

### 프론트엔드 단위 테스트

```bash
cd frontend
npx vitest run tests/unit/

# 개별 실행
npx vitest run tests/unit/cartStore.test.js
npx vitest run tests/unit/orderStore.test.js
npx vitest run tests/unit/useSSE.test.js
```

| 테스트 파일 | 테스트 수 | 설명 |
|---|---|---|
| cartStore.test.js | 10 | 추가, 수량 변경, 삭제, localStorage, getters |
| orderStore.test.js | 8 | 주문 생성, 조회, SSE 이벤트 핸들러 |
| useSSE.test.js | 7 | 연결, 이벤트 수신, 재연결, Circuit Breaker |
| **합계** | **~25** | |

---

## Unit 4: table-session

### 백엔드 단위 테스트

```bash
cd backend
npx jest --testPathPattern="(services|routes|jobs)/__tests__" --verbose

# 개별 실행
npx jest src/services/__tests__/tableService.test.js --verbose
npx jest src/routes/__tests__/table.test.js --verbose
npx jest src/jobs/__tests__/orderHistoryCleanup.test.js --verbose
```

| 테스트 파일 | 케이스 수 | 설명 |
|---|---|---|
| tableService.test.js | 10 | getTables, createTable, completeTable, deleteOrder, getOrderHistory |
| table.test.js | 9 | 5개 엔드포인트 정상/에러 응답 |
| orderHistoryCleanup.test.js | 3 | 만료 삭제, 빈 결과, 에러 처리 |
| **합계** | **22** | |

### 프론트엔드 단위 테스트

```bash
cd frontend
npx vitest run src/views/admin/__tests__/TableManageView.test.js
npx vitest run src/utils/__tests__/conflictRetry.test.js
```

| 테스트 파일 | 케이스 수 | 설명 |
|---|---|---|
| TableManageView.test.js | 2 | 렌더링, 모달 표시 |
| conflictRetry.test.js | 4 | 성공, 재시도, 최대 초과, 비-409 에러 |
| **합계** | **6** | |

---

## 전체 요약
- Backend Unit 3: ~30개
- Backend Unit 4: 22개
- Frontend Unit 3: ~25개
- Frontend Unit 4: 6개

## 테스트 실패 시 대응
1. 테스트 출력에서 실패한 테스트 케이스 확인
2. `expect` 값과 실제 값 비교
3. 관련 소스 코드 수정
4. 재실행하여 통과 확인
