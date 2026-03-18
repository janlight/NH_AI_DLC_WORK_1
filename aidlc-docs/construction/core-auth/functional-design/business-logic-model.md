# Business Logic Model - Unit 1: core-auth

---

## 1. AuthService 오케스트레이션

### 1.1 tableLogin(storeSlug, tableNumber, password)

```
입력 검증
  ├─ storeSlug: 필수, string, max 50
  ├─ tableNumber: 필수, integer, min 1
  └─ password: 필수, string, min 1

매장 조회
  ├─ Store.findUnique({ slug: storeSlug })
  └─ 실패 → AppError(404, "매장을 찾을 수 없습니다")

테이블 조회
  ├─ Table.findUnique({ storeId, tableNumber })
  └─ 실패 → AppError(404, "테이블 정보가 올바르지 않습니다")

Rate Limit 확인
  ├─ identifier = "{storeId}:table:{tableNumber}"
  ├─ checkRateLimit(identifier)
  └─ 차단 중 → AppError(429, "로그인 시도 제한 초과", { retryAfter })

비밀번호 검증
  ├─ bcrypt.compare(password, table.passwordHash)
  ├─ 실패 → recordFailedAttempt(identifier) + AppError(401, "비밀번호가 올바르지 않습니다")
  └─ 성공 → recordSuccessAttempt(identifier)

세션 처리
  ├─ 활성 세션 조회: TableSession.findFirst({ tableId, isActive: true })
  ├─ 존재 → 기존 세션 재사용
  └─ 미존재 → 새 세션 생성: TableSession.create({ tableId, storeId, isActive: true })

JWT 발급
  ├─ payload: { storeId, tableId, sessionId, tableNumber, role: "customer" }
  ├─ options: { expiresIn: "16h" }
  └─ jwt.sign(payload, JWT_SECRET, options)

응답 반환
  └─ { token, tableId, sessionId, tableNumber }
```

### 1.2 adminLogin(storeSlug, username, password)

```
입력 검증
  ├─ storeSlug: 필수, string, max 50
  ├─ username: 필수, string, max 50
  └─ password: 필수, string, min 1

매장 조회
  ├─ Store.findUnique({ slug: storeSlug })
  └─ 실패 → AppError(404, "매장을 찾을 수 없습니다")

관리자 조회
  ├─ Admin.findUnique({ storeId, username })
  └─ 실패 → AppError(401, "로그인 정보가 올바르지 않습니다")

Rate Limit 확인
  ├─ identifier = "{storeId}:admin:{username}"
  ├─ checkRateLimit(identifier)
  └─ 차단 중 → AppError(429, "로그인 시도 제한 초과", { retryAfter })

비밀번호 검증
  ├─ bcrypt.compare(password, admin.passwordHash)
  ├─ 실패 → recordFailedAttempt(identifier) + AppError(401, "로그인 정보가 올바르지 않습니다")
  └─ 성공 → recordSuccessAttempt(identifier)

JWT 발급
  ├─ payload: { storeId, adminId, username, role: admin.role }
  ├─ options: { expiresIn: "16h" }
  └─ jwt.sign(payload, JWT_SECRET, options)

응답 반환
  └─ { token, role, username }
```

### 1.3 verifyToken(token)

```
토큰 검증
  ├─ jwt.verify(token, JWT_SECRET)
  ├─ 만료 → { valid: false, error: "TOKEN_EXPIRED" }
  ├─ 유효하지 않음 → { valid: false, error: "INVALID_TOKEN" }
  └─ 성공 → { valid: true, payload }
```

### 1.4 checkRateLimit(identifier)

```
최근 실패 조회
  ├─ cutoff = now - 15분
  ├─ failCount = LoginAttempt.count({
  │     identifier,
  │     attemptedAt >= cutoff,
  │     success: false
  │   })
  └─ 마지막 실패 시각 조회

차단 판정
  ├─ failCount >= 5
  │   ├─ retryAfter = (마지막 실패 시각 + 15분) - now
  │   └─ retryAfter > 0 → { allowed: false, retryAfter }
  └─ failCount < 5 → { allowed: true }
```

---

## 2. Middleware 로직

### 2.1 authMiddleware

```
Authorization 헤더 추출
  ├─ 미존재 → 401 "인증이 필요합니다"
  └─ Bearer 형식 아님 → 401 "유효하지 않은 인증 형식입니다"

토큰 검증
  ├─ verifyToken(token)
  ├─ TOKEN_EXPIRED → 401 "토큰이 만료되었습니다"
  ├─ INVALID_TOKEN → 401 "유효하지 않은 토큰입니다"
  └─ 성공 → req.user = payload

테넌트 격리 검증
  ├─ req.params.storeId 존재 시
  │   ├─ req.user.storeId !== req.params.storeId → 403 "접근 권한이 없습니다"
  │   └─ 일치 → next()
  └─ storeId 파라미터 없음 → next()
```

### 2.2 roleMiddleware(allowedRoles)

```
역할 확인
  ├─ req.user.role이 allowedRoles에 포함
  │   └─ 포함 → next()
  └─ 미포함 → 403 "접근 권한이 없습니다"
```

### 2.3 errorHandler (글로벌 에러 핸들러)

```
에러 분류
  ├─ AppError (커스텀) → { status: error.statusCode, message: error.message, details: error.details }
  ├─ Prisma 에러
  │   ├─ P2002 (Unique 위반) → 409 "이미 존재하는 데이터입니다"
  │   ├─ P2025 (Not Found) → 404 "데이터를 찾을 수 없습니다"
  │   └─ 기타 → 500 "서버 오류가 발생했습니다"
  ├─ ValidationError → 400 + 상세 필드 에러
  └─ 기타 → 500 "서버 오류가 발생했습니다" (스택 트레이스 로깅, 클라이언트에 미노출)

응답 형식
  └─ { success: false, error: { code, message, details? } }
```

---

## 3. Express 앱 구조

### 3.1 app.js 초기화 흐름

```
Express 앱 생성
  ├─ JSON body parser (limit: 10mb)
  ├─ CORS 설정 (허용 origin 명시)
  ├─ 보안 헤더 미들웨어 (helmet)
  │   ├─ Content-Security-Policy: default-src 'self'
  │   ├─ Strict-Transport-Security: max-age=31536000; includeSubDomains
  │   ├─ X-Content-Type-Options: nosniff
  │   ├─ X-Frame-Options: DENY
  │   └─ Referrer-Policy: strict-origin-when-cross-origin
  ├─ 요청 로깅 미들웨어 (structured logging)
  ├─ 라우트 등록
  │   ├─ /api/auth → authRoutes
  │   ├─ /api/stores/:storeId/menus → menuRoutes (Unit 2)
  │   ├─ /api/stores/:storeId/tables → tableRoutes (Unit 4)
  │   ├─ /api/stores/:storeId/orders → orderRoutes (Unit 3)
  │   └─ /api/stores/:storeId/events → sseRoutes (Unit 3)
  ├─ 404 핸들러
  └─ 글로벌 에러 핸들러
```

### 3.2 API 라우트 (Unit 1 범위)

| Method | Path | 미들웨어 | 핸들러 |
|---|---|---|---|
| POST | /api/auth/table-login | 없음 (공개) | tableLogin |
| POST | /api/auth/admin-login | 없음 (공개) | adminLogin |
| POST | /api/auth/verify | authMiddleware | verifyToken |
| GET | /api/stores/:storeId | authMiddleware | getStore |

---

## 4. 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| DATABASE_URL | PostgreSQL 연결 문자열 | postgresql://user:pass@localhost:5432/tableorder |
| JWT_SECRET | JWT 서명 키 | (필수, 시크릿 매니저 권장) |
| JWT_EXPIRES_IN | JWT 만료 시간 | 16h |
| BCRYPT_SALT_ROUNDS | bcrypt salt rounds | 12 |
| PORT | 서버 포트 | 3000 |
| NODE_ENV | 실행 환경 | development |
| CORS_ORIGIN | 허용 CORS origin | http://localhost:5173 |
| RATE_LIMIT_MAX_ATTEMPTS | 최대 로그인 시도 | 5 |
| RATE_LIMIT_WINDOW_MINUTES | 차단 윈도우 (분) | 15 |

---

## 5. 에러 코드 체계

| HTTP Status | 코드 | 설명 |
|---|---|---|
| 400 | VALIDATION_ERROR | 입력 검증 실패 |
| 401 | UNAUTHORIZED | 인증 실패 (토큰 없음/만료/잘못됨) |
| 403 | FORBIDDEN | 권한 없음 (역할/테넌트 불일치) |
| 404 | NOT_FOUND | 리소스 미존재 |
| 409 | CONFLICT | 중복 데이터 |
| 429 | RATE_LIMITED | 로그인 시도 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |
