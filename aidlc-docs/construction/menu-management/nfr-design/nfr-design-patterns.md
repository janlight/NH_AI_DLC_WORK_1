# NFR Design Patterns - Unit 2: menu-management

## 1. 성능 패턴

### 1.1 HTTP 캐싱 패턴 (Cache-Control + ETag)

**적용 대상**: 고객용 메뉴 조회 API

**패턴 구조**:
```
Client → Request (If-None-Match: "etag-value")
  → Server: DB에서 MAX(updatedAt) 조회
  → ETag 비교
    → 일치: 304 Not Modified (본문 없음)
    → 불일치: 200 OK + 새 데이터 + 새 ETag
```

**ETag 생성 규칙**:
- 메뉴 목록: 해당 매장의 Menu/Category 테이블에서 `MAX(updatedAt)` 타임스탬프를 ETag로 사용
- 메뉴 상세: 해당 Menu 레코드의 `updatedAt` 타임스탬프를 ETag로 사용
- 형식: `"ts-{timestamp_ms}"` (예: `"ts-1710000000000"`)

**캐시 헤더 설정**:

| 엔드포인트 | Cache-Control | ETag |
|---|---|---|
| GET /menus (고객) | public, max-age=60 | ✅ |
| GET /menus/:id (고객) | public, max-age=60 | ✅ |
| GET /menus (관리자) | no-store | ❌ |
| POST/PUT/DELETE | no-store | ❌ |
| 정적 이미지 | public, max-age=86400 | ❌ |

**구현 위치**: Express 미들웨어 (cacheMiddleware)

### 1.2 DB 인덱싱 패턴

**적용 대상**: 메뉴/카테고리 조회 쿼리 최적화

**인덱스 전략**:
- 커버링 인덱스: 자주 사용하는 조회 조건을 인덱스로 커버
- 복합 인덱스: storeId를 선두 컬럼으로 (멀티 테넌트 필터링)

**Prisma schema 인덱스 정의**:
```
Category:
  @@index([storeId, sortOrder])        // 매장별 카테고리 정렬 조회
  @@unique([storeId, name])            // 카테고리명 유일성

Menu:
  @@index([storeId, isActive, categoryId, sortOrder])  // 고객용 메뉴 조회
  @@index([categoryId, isActive])      // 카테고리별 활성 메뉴
```

---

## 2. 보안 패턴

### 2.1 입력 검증 패턴 (Validation Layer)

**적용 대상**: 모든 API 엔드포인트

**패턴 구조**:
```
Request → Route → ValidationMiddleware → Controller → Service → DB
                  (express-validator)
```

**검증 레이어 분리**:
- Route 레벨: express-validator 체인으로 타입/형식/범위 검증
- Service 레벨: 비즈니스 규칙 검증 (중복 검사, 참조 무결성)
- DB 레벨: 유니크 제약, FK 제약 (최종 방어선)

**검증 규칙 모듈화**:
```
backend/src/validators/
  └── menuValidator.js    // 메뉴 관련 검증 규칙 집합
```

### 2.2 접근 제어 패턴 (RBAC)

**적용 대상**: 모든 API 엔드포인트

**패턴 구조**:
```
Request → authMiddleware (JWT 검증)
        → roleCheck (고객/관리자 구분)
        → storeIdCheck (멀티 테넌트 격리)
        → Controller
```

**미들웨어 체인**:
- 고객 API: `authMiddleware` → `Controller`
- 관리자 API: `authMiddleware` → `requireAdmin` → `Controller`
- 모든 API: storeId는 JWT payload에서 추출, URL param과 일치 검증

### 2.3 파일 업로드 보안 패턴

**적용 대상**: 이미지 업로드 엔드포인트

**다층 검증**:
1. multer 레벨: fileFilter로 MIME 타입 검증, limits로 크기 제한
2. 애플리케이션 레벨: magic bytes 확인 (파일 헤더 검증)
3. 파일명 sanitization: 사용자 입력 파일명 무시, 서버에서 생성

**저장 경로 격리**:
```
uploads/
  └── {storeId}/
      └── menus/
          └── {menuId}_{timestamp}.{ext}
```

---

## 3. Rate Limiting 패턴

**적용 대상**: 이미지 업로드 엔드포인트

**전략**: 매장당(storeId 기반) 분당 20건 제한

**구현**:
```
express-rate-limit 설정:
  - windowMs: 60000 (1분)
  - max: 20
  - keyGenerator: (req) => req.params.storeId (JWT에서 추출한 storeId)
  - message: "이미지 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
```

**적용 범위**: `POST /api/stores/:storeId/menus/:menuId/image` 엔드포인트에만 적용

---

## 4. 로깅 패턴

### 4.1 구조화된 로깅 (SECURITY-03 준수)

**로깅 프레임워크**: winston

**로그 포맷** (JSON):
```json
{
  "timestamp": "2026-03-18T15:30:00.000Z",
  "level": "info",
  "requestId": "uuid-v4",
  "storeId": "store-001",
  "method": "POST",
  "path": "/api/stores/store-001/menus",
  "statusCode": 201,
  "duration": 45,
  "message": "Menu created successfully"
}
```

**로그 레벨 사용 기준**:
| 레벨 | 용도 |
|---|---|
| error | 예외, DB 에러, 파일 시스템 에러 |
| warn | 검증 실패, rate limit 도달, 비활성 메뉴 접근 시도 |
| info | CRUD 성공, 이미지 업로드 완료 |
| debug | 쿼리 파라미터, 요청 본문 (개발 환경만) |

**민감 정보 필터링**: 비밀번호, 토큰, 파일 내용은 로그에 포함하지 않음

### 4.2 Request ID 추적 패턴

**구현**: Express 미들웨어에서 각 요청에 UUID v4 할당
- 요청 시작 시 `req.requestId` 설정
- 모든 로그에 requestId 포함
- 응답 헤더에 `X-Request-Id` 포함

---

## 5. 에러 처리 패턴 (SECURITY-15 준수)

### 5.1 계층별 에러 처리

**패턴 구조**:
```
Service Layer: 비즈니스 에러 throw (AppError 클래스)
  → Controller: try/catch로 캐치
    → Global Error Handler: 미처리 에러 캐치, 로깅, 안전한 응답
```

**AppError 클래스**:
```
AppError {
  statusCode: number
  code: string        // 에러 코드 (NOT_FOUND, VALIDATION_ERROR 등)
  message: string     // 사용자 표시용 메시지
  isOperational: true // 예상된 비즈니스 에러
}
```

**Fail-Closed 원칙**: 예상치 못한 에러 시 500 + generic 메시지 반환, 상세 정보는 로그에만 기록

---

## 6. 멀티 테넌트 격리 패턴

**적용 대상**: 모든 DB 쿼리

**패턴**: 모든 Prisma 쿼리에 `where: { storeId }` 조건 필수

**구현 방식**:
- Service 메서드의 첫 번째 파라미터로 storeId 전달
- 모든 findMany, findUnique, create, update, delete에 storeId 포함
- 다른 매장 리소스 접근 시 404 반환 (정보 노출 방지)
