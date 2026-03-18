# Unit Test Execution - Unit 3: order-sse

## 테스트 프레임워크
- **백엔드**: Jest
- **프론트엔드**: Jest + Pinia Testing

## 백엔드 단위 테스트

### Jest 설정

`backend/package.json`에 추가 (없는 경우):
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": ["src/**/*.js"]
  }
}
```

### 실행

```bash
cd backend

# 전체 단위 테스트
npm run test:unit

# 개별 테스트 파일
npx jest tests/unit/orderQueueService.test.js
npx jest tests/unit/sseService.test.js
npx jest tests/unit/orderService.test.js

# 커버리지 포함
npm run test:coverage
```

### 예상 결과

| 테스트 파일 | 테스트 수 | 설명 |
|---|---|---|
| orderQueueService.test.js | 8 | 큐 순차 처리, 병렬 처리, backpressure, 타임아웃 |
| sseService.test.js | 10 | 연결, 브로드캐스트, 클라이언트 제거, 매장 격리 |
| orderService.test.js | 12 | 주문 CRUD, 상태 전이, 에러 케이스 |
| **합계** | **~30** | |

### 커버리지 목표
- Service 레이어: 80% 이상
- 전체: 70% 이상

## 프론트엔드 단위 테스트

### Jest 설정

`frontend/package.json`에 추가 (없는 경우):
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "transform": {
      "^.+\\.js$": "babel-jest",
      "^.+\\.vue$": "@vue/vue3-jest"
    },
    "moduleFileExtensions": ["js", "vue"]
  }
}
```

### 실행

```bash
cd frontend

# 전체 단위 테스트
npm run test:unit

# 개별 테스트 파일
npx jest tests/unit/cartStore.test.js
npx jest tests/unit/orderStore.test.js
npx jest tests/unit/useSSE.test.js
```

### 예상 결과

| 테스트 파일 | 테스트 수 | 설명 |
|---|---|---|
| cartStore.test.js | 10 | 추가, 수량 변경, 삭제, localStorage, getters |
| orderStore.test.js | 8 | 주문 생성, 조회, SSE 이벤트 핸들러 |
| useSSE.test.js | 7 | 연결, 이벤트 수신, 재연결, Circuit Breaker |
| components.test.js | 31 (todo) | Vue 컴포넌트 테스트 시나리오 (Unit 1 통합 후 구현) |
| **합계** | **~25 (실행)** | todo 제외 |

## 테스트 실패 시 대응

1. 테스트 출력에서 실패한 테스트 케이스 확인
2. `expect` 값과 실제 값 비교
3. 관련 소스 코드 수정
4. 재실행하여 통과 확인
