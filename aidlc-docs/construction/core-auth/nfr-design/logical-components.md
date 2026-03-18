# Logical Components - Unit 1: core-auth

---

## 시스템 논리적 컴포넌트 구성

```
+------------------------------------------------------------------+
|                        Docker Compose                             |
|                                                                   |
|  +------------------+  +---------------------+  +--------------+  |
|  |   Vue.js 3       |  |   Express.js        |  | PostgreSQL   |  |
|  |   Frontend       |  |   Backend           |  |              |  |
|  |                   |  |                     |  |              |  |
|  |  +-------------+ |  |  +---------------+  |  |  +--------+  |  |
|  |  | authStore   | |  |  | authMiddleware|  |  |  | Store  |  |  |
|  |  +-------------+ |  |  +---------------+  |  |  | Admin  |  |  |
|  |  +-------------+ |  |  +---------------+  |  |  | Table  |  |  |
|  |  | API Client  | |  |  | roleMiddleware|  |  |  | Session|  |  |
|  |  | (Axios)     | |  |  +---------------+  |  |  | Login  |  |  |
|  |  +-------------+ |  |  +---------------+  |  |  | Attempt|  |  |
|  |  +-------------+ |  |  | errorHandler  |  |  |  +--------+  |  |
|  |  | Router      | |  |  +---------------+  |  |              |  |
|  |  | Guards      | |  |  +---------------+  |  |              |  |
|  |  +-------------+ |  |  | AuthService   |  |  |              |  |
|  |                   |  |  +---------------+  |  |              |  |
|  |  Port: 5173       |  |  +---------------+  |  |  Port: 5432  |  |
|  |                   |  |  | winston       |  |  |              |  |
|  +------------------+  |  | Logger        |  |  +--------------+  |
|                         |  +---------------+  |                    |
|                         |  +---------------+  |  +--------------+  |
|                         |  | Joi Validator |  |  | logs/        |  |
|                         |  +---------------+  |  | app-DATE.log |  |
|                         |  +---------------+  |  | error-DATE   |  |
|                         |  | Prisma Client |  |  |   .log       |  |
|                         |  | (pool: 20)    |  |  +--------------+  |
|                         |  +---------------+  |                    |
|                         |                     |                    |
|                         |  Port: 3000         |                    |
|                         +---------------------+                    |
+------------------------------------------------------------------+
```

---

## 컴포넌트별 상세

### 1. Backend 논리적 컴포넌트

| 컴포넌트 | 역할 | 의존성 |
|---|---|---|
| AuthService | 인증 비즈니스 로직 오케스트레이션 | Prisma Client, bcryptjs, jsonwebtoken |
| authMiddleware | JWT 토큰 검증 + 테넌트 격리 | jsonwebtoken |
| roleMiddleware | 역할 기반 접근 제어 | 없음 (req.user 참조) |
| errorHandler | 글로벌 에러 처리 + 로깅 | winston Logger, AppError |
| winston Logger | 구조화 로깅 | winston, winston-daily-rotate-file |
| Joi Validator | 입력 검증 미들웨어 | joi |
| Prisma Client | DB 접근 (connection pool: 20) | @prisma/client |
| helmet | HTTP 보안 헤더 | helmet |
| cors | CORS 정책 | cors |

### 2. Frontend 논리적 컴포넌트

| 컴포넌트 | 역할 | 의존성 |
|---|---|---|
| authStore (Pinia) | 인증 상태 관리, 토큰 저장 | pinia, API Client |
| API Client (Axios) | HTTP 통신, 토큰 자동 첨부, 401 인터셉터 | axios |
| Router Guards | 라우트 접근 제어 (customerAuth, adminAuth) | vue-router, authStore |
| LoginView (고객) | 테이블 로그인 UI, 자동 로그인 | authStore |
| LoginView (관리자) | 관리자 로그인 UI | authStore |

### 3. Infrastructure 컴포넌트

| 컴포넌트 | 역할 | 설정 |
|---|---|---|
| PostgreSQL 16 | 데이터 저장 | Docker volume, port 5432 |
| logs/ 디렉토리 | 로그 파일 저장 | 일별 rotation, 90일 보존 |
| .env 파일 | 환경 변수 관리 | .gitignore 대상 |

---

## 요청 처리 흐름 (전체)

```
Client Request
  |
  v
Express App
  |
  +-- helmet (보안 헤더)
  +-- cors (CORS 정책)
  +-- JSON parser (body 파싱)
  +-- morgan (HTTP 요청 로깅 -> winston)
  +-- Request ID 미들웨어 (UUID 할당)
  |
  v
Route Matching
  |
  +-- Public Routes (로그인)
  |     +-- Joi validate
  |     +-- AuthService handler
  |
  +-- Protected Routes
        +-- authMiddleware (JWT 검증)
        +-- roleMiddleware (역할 확인)
        +-- Joi validate
        +-- Service handler
  |
  v
Response
  |
  +-- 성공: { success: true, data: ... }
  +-- 실패: errorHandler -> { success: false, error: ... }
  |
  v
Logging (winston)
  +-- Console (개발)
  +-- logs/app-YYYY-MM-DD.log (전체)
  +-- logs/error-YYYY-MM-DD.log (에러만)
```

---

## 파일 구조 (Unit 1 최종)

```
table-order/
  backend/
    src/
      app.js                    # Express 앱 초기화, 미들웨어 등록
      routes/
        auth.js                 # 인증 라우트
      services/
        authService.js          # 인증 비즈니스 로직
      middleware/
        auth.js                 # authMiddleware + roleMiddleware
        errorHandler.js         # 글로벌 에러 핸들러
        validate.js             # Joi 검증 미들웨어
        requestId.js            # Request ID 미들웨어
      validators/
        authSchemas.js          # Joi 스키마 정의
      errors/
        AppError.js             # 커스텀 에러 클래스
      utils/
        logger.js               # winston 로거 설정
    prisma/
      schema.prisma             # 전체 DB 스키마
      seed.js                   # 시드 데이터
    logs/                       # 로그 파일 (gitignore)
    .env                        # 환경 변수 (gitignore)
    package.json
  frontend/
    src/
      App.vue
      router/index.js           # 라우트 + 가드
      api/client.js             # Axios 인스턴스 + 인터셉터
      stores/authStore.js       # Pinia 인증 스토어
      views/
        customer/LoginView.vue
        admin/LoginView.vue
    .env                        # VITE_API_URL (gitignore)
    package.json
  docker-compose.yml
  .gitignore
  .env                          # 루트 환경 변수 (gitignore)
```
