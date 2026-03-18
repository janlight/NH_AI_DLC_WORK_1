# Unit Test Execution - Unit 4: table-session

## Backend Unit Tests

### 실행
```bash
cd table-order/backend
npx jest --testPathPattern="(services|routes|jobs)/__tests__" --verbose
```

### 개별 실행
```bash
# Service Layer 테스트
npx jest src/services/__tests__/tableService.test.js --verbose

# API Route 테스트
npx jest src/routes/__tests__/table.test.js --verbose

# Batch Job 테스트
npx jest src/jobs/__tests__/orderHistoryCleanup.test.js --verbose
```

### 예상 결과

| 테스트 파일 | 케이스 수 | 설명 |
|---|---|---|
| tableService.test.js | 10 | getTables, createTable, completeTable, deleteOrder, getOrderHistory |
| table.test.js | 9 | 5개 엔드포인트 정상/에러 응답 |
| orderHistoryCleanup.test.js | 3 | 만료 삭제, 빈 결과, 에러 처리 |
| **합계** | **22** | |

## Frontend Unit Tests

### 실행
```bash
cd table-order/frontend
npx vitest run --reporter=verbose
```

### 개별 실행
```bash
# TableManageView 테스트
npx vitest run src/views/admin/__tests__/TableManageView.test.js

# conflictRetry 테스트
npx vitest run src/utils/__tests__/conflictRetry.test.js
```

### 예상 결과

| 테스트 파일 | 케이스 수 | 설명 |
|---|---|---|
| TableManageView.test.js | 2 | 렌더링, 모달 표시 |
| conflictRetry.test.js | 4 | 성공, 재시도, 최대 초과, 비-409 에러 |
| **합계** | **6** | |

## 전체 테스트 요약
- Backend: 22개 케이스
- Frontend: 6개 케이스
- **총 28개 유닛 테스트**

## 실패 시 대응
1. 실패한 테스트 출력 확인
2. 관련 소스 코드 수정
3. 테스트 재실행으로 수정 확인
