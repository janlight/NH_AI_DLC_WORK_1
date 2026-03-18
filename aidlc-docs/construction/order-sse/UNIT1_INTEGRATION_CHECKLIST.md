# Unit 1 (core-auth) 통합 체크리스트 - Unit 3: order-sse

> ⚠️ Unit 1 개발 완료 후 아래 항목을 반드시 확인하고 조정해야 합니다.

## 1. JWT / 인증 관련 (PENDING-001~003)

- [ ] JWT Payload 구조 확인: `storeId`, `tableId`, `sessionId`, `role` 필드 존재 여부
- [ ] `authMiddleware` 인터페이스 확인: `req.user`에 디코딩된 payload 설정 방식
- [ ] 고객/관리자 역할 구분 방식 확인: `role` 필드 vs 별도 시크릿 키
- [ ] 토큰 만료 시 동작 확인: 401 반환 → 클라이언트 재로그인 흐름

## 2. Express 앱 구조 통합

- [ ] `app.js`에 Unit 3 라우터 등록 방식 확인
  ```javascript
  const { router: orderRouter, setPrisma } = require('./routes/orderRoutes');
  const { router: sseRouter } = require('./routes/sseRoutes');
  setPrisma(prisma);
  app.use('/api/stores/:storeId', orderRouter);
  app.use('/api/stores/:storeId', sseRouter);
  ```
- [ ] `authMiddleware` 적용 위치 확인 (라우터 레벨 vs 개별 라우트)
- [ ] 글로벌 에러 핸들러와 Unit 3 에러 응답 형식 호환성 확인
  - Unit 3 형식: `{ success: false, error: { code, message, details } }`

## 3. Prisma / DB 관련

- [ ] `schema.prisma`에 Order, OrderItem, OrderHistory 모델 포함 확인
- [ ] 모델 필드명/타입이 `domain-entities.md`와 일치하는지 확인
- [ ] `TableSession` 모델에 `isActive` 필드 존재 확인
- [ ] `Menu` 모델에 `isActive`, `name`, `price` 필드 존재 확인
- [ ] Prisma Client 생성 후 `orderService.js`에서 사용하는 쿼리 호환성 확인

## 4. 프론트엔드 통합

- [ ] `frontend/src/api/orderApi.js`: `apiClient`를 Unit 1의 공통 axios 인스턴스로 교체
- [ ] `frontend/src/router/index.js`에 Unit 3 라우트 추가:
  ```javascript
  { path: '/customer/cart', component: () => import('./views/customer/CartView.vue') }
  { path: '/customer/orders', component: () => import('./views/customer/OrderView.vue') }
  { path: '/admin/dashboard', component: () => import('./views/admin/DashboardView.vue') }
  ```
- [ ] `DashboardView.vue`의 `storeId`를 `authStore`에서 가져오도록 수정
- [ ] `useSSE.js`의 EventSource 인증 방식을 Unit 1 구현에 맞게 조정
  - 현재: 쿼리 파라미터 `?token=...`
  - Unit 1 방식에 따라 변경 필요할 수 있음

## 5. Docker / 인프라 관련

- [ ] `docker-compose.yml` 구조 확인
- [ ] SSE 엔드포인트에 프록시 버퍼링 비활성화 설정 확인
  - Nginx 사용 시: `proxy_buffering off;` + `proxy_read_timeout 120s;`
  - Express 헤더: `X-Accel-Buffering: no` (이미 sseService에 포함)
- [ ] 환경 변수 `.env` 파일에 필요한 항목 포함 확인

## 6. 테스트 통합

- [ ] 실제 Prisma Client로 통합 테스트 실행
- [ ] 실제 JWT 토큰으로 API 인증 테스트
- [ ] SSE 연결 + 이벤트 수신 E2E 테스트
- [ ] 프론트엔드 컴포넌트 테스트 (Vue Test Utils 환경 구성 후)

## 참고 문서
- `aidlc-docs/construction/order-sse/functional-design/business-rules.md` → 섹션 9 (PENDING-001~004)
- `aidlc-docs/construction/order-sse/infrastructure-design/infrastructure-design.md` → Unit 1 의존 항목
- `aidlc-docs/construction/build-and-test/build-instructions.md` → Unit 1 통합 시 추가 작업
