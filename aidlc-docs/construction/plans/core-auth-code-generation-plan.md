# Code Generation Plan - Unit 1: core-auth

## Unit 컨텍스트

**담당 스토리**: US-01-01, US-01-02, US-05-01, US-09-01
**의존성**: 없음 (기반 Unit)
**산출물 위치**: table-order/ (workspace root 하위)

---

## 코드 생성 계획

### Phase A: 프로젝트 구조 및 인프라 설정

- [x] Step 1: 프로젝트 루트 구조 생성
  - `table-order/backend/package.json`
  - `table-order/frontend/package.json`
  - `table-order/.gitignore`
  - `table-order/.nvmrc`
  - `table-order/.env.example`

- [x] Step 2: Docker Compose 설정
  - `table-order/docker-compose.dev.yml` (DB 전용)
  - `table-order/docker-compose.yml` (프로덕션)
  - `table-order/backend/Dockerfile`
  - `table-order/frontend/Dockerfile`
  - `table-order/frontend/nginx.conf`

- [x] Step 3: Prisma 스키마 및 시드 데이터
  - `table-order/backend/prisma/schema.prisma` (전체 스키마)
  - `table-order/backend/prisma/seed.js`
  - 스토리: US-09-01 (데이터 무결성), FR-10 (초기 데이터)

### Phase B: Backend 비즈니스 로직

- [x] Step 4: 공통 유틸리티 및 에러 처리
  - `table-order/backend/src/errors/AppError.js`
  - `table-order/backend/src/utils/logger.js` (winston 설정)
  - `table-order/backend/src/middleware/requestId.js`
  - 스토리: US-09-01 (보안 - 에러 처리)

- [x] Step 5: AuthService 비즈니스 로직
  - `table-order/backend/src/services/authService.js`
  - 스토리: US-01-01 (테이블 로그인), US-05-01 (관리자 로그인), US-01-02 (세션 만료), US-09-01 (보안)

- [x] Step 6: AuthService 단위 테스트
  - `table-order/backend/tests/services/authService.test.js`
  - 테스트 케이스: tableLogin 성공/실패, adminLogin 성공/실패, rate limiting, 토큰 검증

### Phase C: Backend API 레이어

- [x] Step 7: 미들웨어
  - `table-order/backend/src/middleware/auth.js` (authMiddleware + roleMiddleware)
  - `table-order/backend/src/middleware/validate.js` (Joi 검증)
  - `table-order/backend/src/middleware/errorHandler.js`
  - 스토리: US-09-01 (보안 - 인증/인가)

- [x] Step 8: Joi 검증 스키마 및 Auth 라우트
  - `table-order/backend/src/validators/authSchemas.js`
  - `table-order/backend/src/routes/auth.js`
  - 스토리: US-01-01, US-05-01

- [x] Step 9: Express 앱 진입점
  - `table-order/backend/src/app.js`
  - 스토리: 전체 (앱 초기화)

- [x] Step 10: API 레이어 단위 테스트
  - `table-order/backend/tests/middleware/auth.test.js`
  - `table-order/backend/tests/routes/auth.test.js`
  - 테스트 케이스: 미들웨어 체인, 라우트 통합 테스트

### Phase D: Frontend

- [x] Step 11: Frontend 프로젝트 설정
  - `table-order/frontend/src/main.js`
  - `table-order/frontend/src/App.vue`
  - `table-order/frontend/src/api/client.js` (Axios 인스턴스)
  - `table-order/frontend/src/router/index.js`
  - `table-order/frontend/vite.config.js`
  - `table-order/frontend/tailwind.config.js`
  - `table-order/frontend/postcss.config.js`
  - `table-order/frontend/index.html`

- [x] Step 12: authStore (Pinia)
  - `table-order/frontend/src/stores/authStore.js`
  - 스토리: US-01-01 (자동 로그인), US-01-02 (세션 만료), US-05-01 (관리자 인증)

- [x] Step 13: 고객 LoginView
  - `table-order/frontend/src/views/customer/LoginView.vue`
  - 스토리: US-01-01 (테이블 태블릿 초기 로그인)

- [x] Step 14: 관리자 LoginView
  - `table-order/frontend/src/views/admin/LoginView.vue`
  - 스토리: US-05-01 (관리자 로그인)

- [x] Step 15: Frontend 단위 테스트
  - `table-order/frontend/tests/stores/authStore.test.js`
  - `table-order/frontend/tests/views/LoginView.test.js`
  - 테스트 케이스: authStore actions, LoginView 렌더링/인터랙션

### Phase E: 문서 및 마무리

- [x] Step 16: Backend .env.example 및 설정 파일
  - `table-order/backend/.env.example`
  - `table-order/backend/jest.config.js`

- [x] Step 17: 코드 생성 요약 문서
  - `aidlc-docs/construction/core-auth/code/code-generation-summary.md`

---

## 스토리 트레이서빌리티

| 스토리 | 구현 Step | 상태 |
|---|---|---|
| US-01-01 (테이블 로그인) | Step 3, 5, 8, 12, 13 | [x] |
| US-01-02 (세션 만료) | Step 5, 12 | [x] |
| US-05-01 (관리자 로그인) | Step 5, 8, 12, 14 | [x] |
| US-09-01 (보안) | Step 3, 4, 5, 7 | [x] |
