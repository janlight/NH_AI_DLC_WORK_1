# Code Generation Summary - Unit 1: core-auth

## 생성된 파일 목록

### 프로젝트 루트
| 파일 | 용도 |
|---|---|
| table-order/.nvmrc | Node.js 버전 고정 (20) |
| table-order/.gitignore | Git 제외 파일 |
| table-order/.env.example | 환경 변수 템플릿 |
| table-order/docker-compose.dev.yml | 개발용 DB Docker |
| table-order/docker-compose.yml | 프로덕션 Docker Compose |

### Backend (table-order/backend/)
| 파일 | 용도 | 관련 스토리 |
|---|---|---|
| package.json | 의존성 및 스크립트 | - |
| Dockerfile | 프로덕션 빌드 | - |
| .env.example | 환경 변수 템플릿 | - |
| jest.config.js | 테스트 설정 | - |
| prisma/schema.prisma | 전체 DB 스키마 | US-09-01, US-09-04 |
| prisma/seed.js | 시드 데이터 | FR-10 |
| src/app.js | Express 앱 진입점 | 전체 |
| src/errors/AppError.js | 커스텀 에러 클래스 | US-09-01 |
| src/utils/logger.js | winston 로거 | US-09-01 |
| src/middleware/requestId.js | Request ID 미들웨어 | US-09-01 |
| src/middleware/auth.js | 인증/인가 미들웨어 | US-09-01 |
| src/middleware/validate.js | Joi 검증 미들웨어 | US-09-01 |
| src/middleware/errorHandler.js | 글로벌 에러 핸들러 | US-09-01 |
| src/validators/authSchemas.js | 인증 Joi 스키마 | US-01-01, US-05-01 |
| src/services/authService.js | 인증 비즈니스 로직 | US-01-01, US-01-02, US-05-01 |
| src/routes/auth.js | 인증 API 라우트 | US-01-01, US-05-01 |
| tests/services/authService.test.js | AuthService 단위 테스트 | - |
| tests/middleware/auth.test.js | 미들웨어 단위 테스트 | - |
| tests/routes/auth.test.js | 라우트 통합 테스트 | - |

### Frontend (table-order/frontend/)
| 파일 | 용도 | 관련 스토리 |
|---|---|---|
| package.json | 의존성 및 스크립트 | - |
| Dockerfile | 프로덕션 빌드 | - |
| nginx.conf | nginx 설정 | - |
| index.html | HTML 진입점 | - |
| vite.config.js | Vite 설정 | - |
| vitest.config.js | Vitest 설정 | - |
| tailwind.config.js | Tailwind CSS 설정 | - |
| postcss.config.js | PostCSS 설정 | - |
| src/main.js | Vue 앱 진입점 | - |
| src/App.vue | 루트 컴포넌트 | - |
| src/style.css | Tailwind 기본 스타일 | - |
| src/api/client.js | Axios 인스턴스 | US-01-02 |
| src/router/index.js | Vue Router + 가드 | US-01-01, US-05-01 |
| src/stores/authStore.js | Pinia 인증 스토어 | US-01-01, US-01-02, US-05-01 |
| src/views/customer/LoginView.vue | 고객 로그인 | US-01-01 |
| src/views/admin/LoginView.vue | 관리자 로그인 | US-05-01 |
| tests/stores/authStore.test.js | authStore 단위 테스트 | - |
| tests/views/LoginView.test.js | LoginView 단위 테스트 | - |

## 스토리 커버리지

| 스토리 | 상태 | 구현 파일 |
|---|---|---|
| US-01-01 (테이블 로그인) | 완료 | authService, auth route, authStore, CustomerLoginView |
| US-01-02 (세션 만료) | 완료 | authService, authStore, api/client interceptor |
| US-05-01 (관리자 로그인) | 완료 | authService, auth route, authStore, AdminLoginView |
| US-09-01 (보안) | 완료 | bcrypt, JWT, rate limiting, helmet, Joi, errorHandler |

## 테스트 요약

| 영역 | 파일 | 테스트 수 |
|---|---|---|
| Backend Service | authService.test.js | 6+ |
| Backend Middleware | auth.test.js | 5+ |
| Backend Routes | auth.test.js | 4+ |
| Frontend Store | authStore.test.js | 10+ |
| Frontend Views | LoginView.test.js | 7+ |
