# Logical Components - Unit 2: menu-management

## 컴포넌트 아키텍처

### Text Alternative
```
[Client] → [Express Router]
              |
              +→ [authMiddleware] → [roleCheck]
              +→ [cacheMiddleware] (GET 요청만)
              +→ [rateLimitMiddleware] (이미지 업로드만)
              +→ [validationMiddleware]
              +→ [requestIdMiddleware]
              |
              v
         [Menu Controller]
              |
              v
         [MenuService] → [Prisma Client] → [PostgreSQL]
              |
              +→ [FileUploadService] → [Local File System]
              +→ [Logger (winston)]
```

---

## 1. 미들웨어 컴포넌트

### 1.1 cacheMiddleware

**목적**: HTTP 캐시 헤더 설정 및 ETag 기반 조건부 응답

**위치**: `backend/src/middleware/cache.js`

**동작**:
- GET 요청에만 적용
- 응답 후 Cache-Control, ETag 헤더 설정
- If-None-Match 헤더와 ETag 비교 → 일치 시 304 반환

**설정 가능 옵션**:
| 옵션 | 기본값 | 설명 |
|---|---|---|
| maxAge | 60 | Cache-Control max-age (초) |
| isPublic | true | public/private 캐시 |
| generateETag | function | ETag 생성 함수 |

### 1.2 rateLimitMiddleware

**목적**: 이미지 업로드 rate limiting

**위치**: `backend/src/middleware/rateLimit.js`

**설정**:
| 항목 | 값 |
|---|---|
| windowMs | 60000 (1분) |
| max | 20 |
| keyGenerator | storeId 기반 |
| 적용 대상 | POST /menus/:menuId/image |

### 1.3 validationMiddleware

**목적**: 요청 파라미터 검증

**위치**: `backend/src/validators/menuValidator.js`

**검증 체인 목록**:
| 체인 | 적용 엔드포인트 | 검증 항목 |
|---|---|---|
| validateCreateMenu | POST /menus | name, price, categoryId, description |
| validateUpdateMenu | PUT /menus/:id | name?, price?, categoryId?, description? |
| validateMenuOrder | PUT /menus/order | menuOrders[] 배열 |
| validateCreateCategory | POST /categories | name, sortOrder? |
| validateUpdateCategory | PUT /categories/:id | name?, sortOrder? |
| validateCategoryOrder | PUT /categories/order | categoryOrders[] 배열 |
| validateImageUpload | POST /menus/:id/image | file (multer에서 처리) |
| validateStoreId | 전체 | params.storeId UUID 형식 |
| validateMenuId | 상세/수정/삭제 | params.menuId UUID 형식 |

### 1.4 requestIdMiddleware

**목적**: 요청별 고유 ID 할당 및 추적

**위치**: `backend/src/middleware/requestId.js` (Unit 1에서 생성, 공유)

**동작**: UUID v4 생성 → `req.requestId` 설정 → 응답 헤더 `X-Request-Id` 추가

---

## 2. 서비스 컴포넌트

### 2.1 MenuService (확장)

**위치**: `backend/src/services/menuService.js`

**NFR 적용 사항**:
- 모든 메서드에 storeId 파라미터 (멀티 테넌트 격리)
- 모든 DB 작업에 try/catch + AppError throw
- 성공/실패 로깅 (winston)
- ETag 생성을 위한 updatedAt 반환

**ETag 헬퍼 메서드**:
```
getMenusETag(storeId):
  1. SELECT MAX(updatedAt) FROM Menu WHERE storeId = ? AND isActive = true
  2. SELECT MAX(updatedAt) FROM Category WHERE storeId = ?
  3. 두 값 중 더 큰 값을 ETag로 반환
  4. 형식: "ts-{timestamp_ms}"
```

### 2.2 FileUploadService

**목적**: 이미지 파일 저장/삭제 로직 분리

**위치**: `backend/src/services/fileUploadService.js`

**메서드**:
| 메서드 | 설명 |
|---|---|
| saveImage(storeId, menuId, file) | 파일 저장, 경로 반환 |
| deleteImage(imageUrl) | 기존 이미지 파일 삭제 |
| validateFile(file) | magic bytes 검증 |
| ensureDirectory(path) | 디렉토리 존재 확인/생성 |

**에러 처리**:
- 파일 저장 실패 시 AppError throw
- 이전 이미지 삭제 실패 시 warn 로깅 (non-blocking)

---

## 3. 유틸리티 컴포넌트

### 3.1 AppError

**위치**: `backend/src/utils/AppError.js` (Unit 1에서 생성, 공유)

**구조**:
```
class AppError extends Error {
  constructor(statusCode, code, message)
  - statusCode: HTTP 상태 코드
  - code: 에러 코드 문자열
  - message: 사용자 표시용 메시지
  - isOperational: true (예상된 에러)
}
```

### 3.2 Logger

**위치**: `backend/src/utils/logger.js` (Unit 1에서 생성, 공유)

**설정**:
- 개발 환경: console transport, debug 레벨
- 프로덕션 환경: file transport, info 레벨
- JSON 포맷, timestamp 자동 포함

---

## 4. 정적 파일 서빙

**목적**: 업로드된 이미지 파일 제공

**설정**:
```
express.static('uploads', {
  maxAge: '1d',           // 24시간 캐시
  index: false,           // 디렉토리 리스팅 비활성화
  dotfiles: 'deny'        // 숨김 파일 접근 차단
})
```

**경로**: `/uploads/{storeId}/menus/{filename}`

---

## 5. 파일 구조 (Unit 2 최종)

```
backend/src/
├── routes/
│   └── menu.js                    // 라우트 정의 + 미들웨어 체인
├── services/
│   ├── menuService.js             // 메뉴/카테고리 비즈니스 로직
│   └── fileUploadService.js       // 이미지 파일 관리
├── validators/
│   └── menuValidator.js           // express-validator 검증 체인
├── middleware/
│   └── cache.js                   // HTTP 캐시 미들웨어
└── (공유: Unit 1에서 생성)
    ├── middleware/auth.js
    ├── middleware/errorHandler.js
    ├── middleware/requestId.js
    ├── middleware/rateLimit.js
    ├── utils/AppError.js
    └── utils/logger.js

backend/uploads/                   // 이미지 저장 디렉토리
  └── {storeId}/menus/
```
