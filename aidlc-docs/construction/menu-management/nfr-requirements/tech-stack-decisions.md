# Tech Stack Decisions - Unit 2: menu-management

## 기본 기술 스택 (프로젝트 전체 결정사항)

| 영역 | 기술 | 버전 | 결정 근거 |
|---|---|---|---|
| 백엔드 런타임 | Node.js | 20 LTS | 프로젝트 표준 |
| 백엔드 프레임워크 | Express.js | 4.x | 프로젝트 표준 |
| ORM | Prisma | 5.x | 프로젝트 표준 |
| 데이터베이스 | PostgreSQL | 16 | 프로젝트 표준 |
| 프론트엔드 | Vue.js 3 | 3.x | 프로젝트 표준 |
| 상태 관리 | Pinia | 2.x | 프로젝트 표준 |
| CSS | Tailwind CSS | 3.x | 프로젝트 표준 |

---

## Unit 2 추가 기술 결정

### 1. 파일 업로드: multer

| 항목 | 결정 |
|---|---|
| 라이브러리 | multer |
| 저장 방식 | diskStorage (로컬 파일 시스템) |
| 파일 크기 제한 | 5MB |
| MIME 타입 필터 | image/jpeg, image/png |
| 저장 경로 | uploads/{storeId}/menus/ |
| 파일명 규칙 | {menuId}_{timestamp}.{ext} |

**결정 근거**: 요구사항에서 로컬 파일 시스템 저장으로 결정됨. multer는 Express 생태계 표준 파일 업로드 미들웨어.

### 2. 입력 검증: express-validator

| 항목 | 결정 |
|---|---|
| 라이브러리 | express-validator |
| 적용 범위 | 모든 API 엔드포인트 |
| 검증 방식 | 체이닝 API (check, body, param, query) |

**결정 근거**: Express 생태계와 자연스럽게 통합. SECURITY-05 준수를 위한 체계적 입력 검증.

### 3. 로깅: winston

| 항목 | 결정 |
|---|---|
| 라이브러리 | winston |
| 포맷 | JSON |
| 출력 | console (개발), file (프로덕션) |
| 로그 레벨 | error, warn, info, debug |
| 필수 필드 | timestamp, requestId, level, message, storeId |

**결정 근거**: SECURITY-03 준수. Node.js 생태계에서 가장 널리 사용되는 구조화된 로깅 라이브러리.

### 4. HTTP 캐싱

| 항목 | 결정 |
|---|---|
| 구현 방식 | Express 미들웨어 (커스텀) |
| 고객 메뉴 조회 | Cache-Control: public, max-age=60 + ETag |
| 메뉴 상세 조회 | Cache-Control: public, max-age=60 + ETag |
| 관리자 API | Cache-Control: no-store |
| 이미지 파일 | Cache-Control: public, max-age=86400 |

**결정 근거**: 200ms 응답 시간 목표 달성을 위한 클라이언트 캐싱. 서버 부하 감소.

### 5. 보안 미들웨어

| 항목 | 결정 |
|---|---|
| HTTP 헤더 | helmet (Unit 1에서 설정, 공유) |
| CORS | cors 패키지 (Unit 1에서 설정, 공유) |
| Rate Limiting | express-rate-limit (이미지 업로드 엔드포인트) |

**결정 근거**: SECURITY-04, SECURITY-08, SECURITY-11 준수.

---

## 데이터베이스 인덱스 설계

### Category 테이블
| 인덱스 | 컬럼 | 용도 |
|---|---|---|
| idx_category_store_sort | (storeId, sortOrder) | 매장별 카테고리 정렬 조회 |
| uq_category_store_name | (storeId, name) UNIQUE | 카테고리명 중복 방지 |

### Menu 테이블
| 인덱스 | 컬럼 | 용도 |
|---|---|---|
| idx_menu_store_active_sort | (storeId, isActive, categoryId, sortOrder) | 고객용 메뉴 조회 최적화 |
| idx_menu_category_active | (categoryId, isActive) | 카테고리별 활성 메뉴 조회 |

---

## 의존성 목록 (Unit 2 추가분)

### 백엔드
| 패키지 | 버전 | 용도 |
|---|---|---|
| multer | ^1.4.5 | 파일 업로드 |
| express-validator | ^7.x | 입력 검증 |
| winston | ^3.x | 구조화된 로깅 |
| express-rate-limit | ^7.x | Rate limiting |
| uuid | ^9.x | UUID 생성 (파일명) |

### 프론트엔드
| 패키지 | 버전 | 용도 |
|---|---|---|
| (추가 없음) | - | Vue 3 + Pinia + Tailwind 기본 스택으로 충분 |
