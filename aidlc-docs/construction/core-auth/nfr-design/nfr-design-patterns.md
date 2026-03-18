# NFR Design Patterns - Unit 1: core-auth

---

## 1. 인증 미들웨어 체인 패턴

### 패턴: Chain of Responsibility

```
Request → authMiddleware → roleMiddleware → tenantMiddleware → Handler
            │                  │                  │
            ▼                  ▼                  ▼
        토큰 검증          역할 확인          테넌트 격리
        (401 거부)        (403 거부)         (403 거부)
```

**구현 설계**:

```javascript
// 미들웨어 체인 적용 예시
router.get('/api/stores/:storeId/orders',
  authMiddleware,                    // JWT 검증
  roleMiddleware(['admin']),         // 관리자만 허용
  orderController.getStoreOrders     // 핸들러
);

router.post('/api/stores/:storeId/tables/:tableId/orders',
  authMiddleware,                    // JWT 검증
  roleMiddleware(['customer']),      // 고객만 허용
  orderController.createOrder        // 핸들러
);
```

**Fail-Closed 원칙**: 미들웨어 체인의 어느 단계에서든 실패하면 즉시 거부. 다음 단계로 넘어가지 않음.

---

## 2. Rate Limiting 패턴

### 패턴: DB 기반 Sliding Window

```
로그인 요청
  │
  ▼
LoginAttempt 테이블 조회
  │ SELECT COUNT(*) FROM login_attempts
  │ WHERE identifier = ? AND attempted_at > (NOW - 15min) AND success = false
  │
  ▼
failCount >= 5?
  ├─ YES → 429 응답 + retryAfter 계산
  └─ NO  → 로그인 로직 진행
              │
              ▼
          로그인 결과
          ├─ 성공 → LoginAttempt(success=true) 기록
          └─ 실패 → LoginAttempt(success=false) 기록
```

**Sliding Window 방식**: 고정 윈도우가 아닌 현재 시각 기준 15분 이내를 조회하므로, 윈도우 경계에서의 burst 공격 방지.

**retryAfter 계산**:
```
마지막 실패 시각 + 15분 - 현재 시각 = 남은 차단 시간(초)
```

---

## 3. 에러 처리 패턴

### 패턴: Custom Error Hierarchy + Global Handler

```
AppError (base)
  ├─ ValidationError (400)
  ├─ UnauthorizedError (401)
  ├─ ForbiddenError (403)
  ├─ NotFoundError (404)
  ├─ ConflictError (409)
  └─ RateLimitError (429)
```

**AppError 클래스 설계**:
```javascript
class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // 예상된 에러 vs 프로그래밍 에러 구분
  }
}
```

**글로벌 에러 핸들러 흐름**:
```
에러 수신
  ├─ AppError (isOperational=true)
  │   → 클라이언트에 statusCode + message 반환
  │   → info 레벨 로깅
  │
  ├─ Prisma 에러
  │   → 에러 코드별 매핑 (P2002→409, P2025→404)
  │   → warn 레벨 로깅
  │
  └─ 예상치 못한 에러 (isOperational=false)
      → 클라이언트에 500 + "서버 오류가 발생했습니다" 반환
      → error 레벨 로깅 (스택 트레이스 포함)
      → 스택 트레이스는 서버 로그에만 기록, 클라이언트에 미노출
```

---

## 4. 로깅 패턴

### 패턴: Structured JSON Logging + Transport 분리

**winston 설정 구조**:
```
winston Logger
  ├─ Transport: Console (개발 환경)
  │   └─ format: colorize + simple (가독성)
  │
  ├─ Transport: DailyRotateFile (전 환경)
  │   ├─ filename: logs/app-%DATE%.log
  │   ├─ datePattern: YYYY-MM-DD
  │   ├─ maxFiles: 90d (90일 보존)
  │   └─ format: JSON
  │
  └─ Transport: DailyRotateFile (에러 전용)
      ├─ filename: logs/error-%DATE%.log
      ├─ level: error
      └─ maxFiles: 90d
```

**로그 포맷 (JSON)**:
```json
{
  "timestamp": "2026-03-18T15:30:00.000Z",
  "level": "info",
  "message": "Admin login successful",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "storeId": "uuid",
    "username": "admin",
    "ip": "192.168.1.1"
  }
}
```

**Request ID 패턴**:
```
요청 수신 → UUID 생성 → req.requestId에 저장 → 모든 로그에 포함
```

**민감 데이터 필터링**:
- password, token, passwordHash 필드는 로그에서 자동 마스킹
- winston format에서 커스텀 필터 적용

---

## 5. 보안 헤더 패턴

### 패턴: helmet 미들웨어 설정

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind CSS 인라인 스타일
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})
```

---

## 6. 입력 검증 패턴

### 패턴: Schema-First Validation with Joi

```
요청 수신 → Joi 스키마 검증 → 실패 시 400 + 상세 에러 → 성공 시 핸들러 진행
```

**검증 미들웨어 설계**:
```javascript
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw new ValidationError('입력 검증 실패', details);
  }
  req.body = value; // sanitized 값으로 교체
  next();
};
```

**스키마 예시**:
```javascript
const tableLoginSchema = Joi.object({
  storeSlug: Joi.string().max(50).pattern(/^[a-z0-9-]+$/).required(),
  tableNumber: Joi.number().integer().min(1).required(),
  password: Joi.string().min(1).max(100).required()
});
```
