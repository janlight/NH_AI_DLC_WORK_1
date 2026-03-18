# NFR Requirements - Unit 2: menu-management

## 1. 성능 요구사항

### PERF-01: 메뉴 목록 조회 응답 시간
- 목표: 200ms 이내 (p95)
- 측정 조건: 카테고리 10개, 메뉴 100개 기준
- 달성 방안:
  - Category.storeId + sortOrder 복합 인덱스
  - Menu.(storeId, categoryId, isActive, sortOrder) 복합 인덱스
  - HTTP 캐시 헤더 적용 (Cache-Control, ETag)

### PERF-02: 메뉴 상세 조회 응답 시간
- 목표: 100ms 이내 (p95)
- 달성 방안: PK 기반 단일 조회, 인덱스 활용

### PERF-03: 이미지 업로드 처리
- 최대 파일 크기: 5MB
- 동시 업로드: 최대 100건 처리 가능
- 달성 방안:
  - multer 동시 업로드 수 제한 (서버 레벨)
  - Express request body size limit 설정
  - 업로드 rate limiting (관리자당 분당 10건)

### PERF-04: 메뉴 CRUD 응답 시간
- 생성/수정/삭제: 300ms 이내 (p95)
- 순서 변경 (배치): 500ms 이내 (p95)

---

## 2. 캐싱 전략

### CACHE-01: HTTP 캐시 헤더
- 고객용 메뉴 목록 조회:
  - `Cache-Control: public, max-age=60` (1분)
  - `ETag` 기반 조건부 요청 지원
  - 메뉴 변경 시 ETag 자동 갱신
- 메뉴 상세 조회:
  - `Cache-Control: public, max-age=60`
  - `ETag` 지원
- 관리자 API: 캐싱 없음 (`Cache-Control: no-store`)
- 이미지 파일:
  - `Cache-Control: public, max-age=86400` (24시간)
  - 파일명에 timestamp 포함으로 캐시 무효화

---

## 3. 보안 요구사항 (Security Baseline 준수)

### SEC-01: 입력 검증 (SECURITY-05)
- 모든 API 파라미터에 대한 타입/길이/형식 검증
- express-validator 또는 Joi 라이브러리 사용
- 메뉴명: XSS 방지를 위한 HTML 이스케이프
- 가격: 정수 타입 강제, 범위 검증
- categoryId/menuId: UUID 형식 검증
- Request body size limit: 6MB (이미지 업로드 고려)

### SEC-02: 접근 제어 (SECURITY-08)
- 고객 API: authMiddleware (테이블 JWT 검증)
- 관리자 API: authMiddleware + adminRoleCheck
- Object-level authorization: storeId 일치 검증 (IDOR 방지)
- 다른 매장 리소스 접근 시 404 반환 (정보 노출 방지)

### SEC-03: 파일 업로드 보안 (SECURITY-05, SECURITY-09)
- MIME 타입 검증 (magic bytes 확인, 확장자만 신뢰하지 않음)
- 파일명 sanitization (경로 탐색 방지)
- 업로드 디렉토리를 정적 파일 서빙 경로로만 노출
- 디렉토리 리스팅 비활성화

### SEC-04: 에러 처리 (SECURITY-15)
- 프로덕션 환경에서 스택 트레이스 노출 금지
- 일반적 에러 메시지 반환 (내부 상세 정보 숨김)
- 글로벌 에러 핸들러에서 모든 미처리 예외 캐치
- DB 에러 시 generic 메시지 반환

### SEC-05: 구조화된 로깅 (SECURITY-03)
- 로깅 프레임워크: winston 또는 pino
- JSON 포맷 출력
- 필수 필드: timestamp, requestId, level, message, storeId
- 민감 정보 로깅 금지 (비밀번호, 토큰, PII)
- 로그 레벨: error, warn, info, debug

### SEC-06: HTTP 보안 헤더 (SECURITY-04)
- helmet 미들웨어 적용 (Unit 1 core-auth에서 설정, menu-management에서 준수)
- Content-Security-Policy, X-Content-Type-Options, X-Frame-Options 등

### SEC-07: CORS 정책 (SECURITY-08)
- 허용 origin 명시적 설정 (와일드카드 금지)
- 인증된 엔드포인트에서 credentials: true 시 origin 명시 필수

---

## 4. 확장성 요구사항

### SCALE-01: 멀티 테넌트 격리
- 모든 쿼리에 storeId WHERE 조건 필수
- 인덱스에 storeId 포함
- 매장 간 데이터 접근 불가

### SCALE-02: 데이터 볼륨
- 매장당 카테고리: 최대 50개
- 매장당 메뉴: 최대 500개 (활성 + 비활성)
- 100개+ 매장 지원 시 총 메뉴 수: ~50,000건
- 인덱스 설계로 대응

### SCALE-03: 이미지 저장
- 로컬 파일 시스템 (현재 단계)
- 매장당 이미지: 최대 500개 × 5MB = 2.5GB
- 디스크 용량 모니터링 필요

---

## 5. 가용성 요구사항

### AVAIL-01: 에러 복구
- 이미지 업로드 실패 시 DB 롤백 (트랜잭션)
- 파일 시스템 에러 시 적절한 에러 메시지 반환
- 부분 실패 방지 (이미지 저장 + DB 업데이트 원자성)

### AVAIL-02: 데이터 일관성
- soft delete 시 isActive 플래그 일관성 보장
- 순서 변경 시 트랜잭션 내 일괄 업데이트

---

## 6. 유지보수성 요구사항

### MAINT-01: 코드 구조
- Service 레이어에 비즈니스 로직 집중
- Route 레이어는 요청/응답 처리만
- 검증 로직은 별도 validator 모듈

### MAINT-02: 테스트 가능성
- Service 레이어 단위 테스트 가능한 구조
- Prisma Client 모킹 가능한 의존성 주입 패턴

---

## Security Baseline Compliance Summary

| Rule | Status | 비고 |
|---|---|---|
| SECURITY-01 (Encryption) | Compliant | TLS 적용, DB 암호화 (Unit 1 인프라) |
| SECURITY-02 (Access Logging) | N/A | 네트워크 중간자 없음 (로컬 Docker) |
| SECURITY-03 (App Logging) | Compliant | 구조화된 로깅 (winston/pino) 적용 |
| SECURITY-04 (HTTP Headers) | Compliant | helmet 미들웨어 (Unit 1에서 설정) |
| SECURITY-05 (Input Validation) | Compliant | express-validator/Joi 적용, 파라미터 검증 |
| SECURITY-06 (Least Privilege) | N/A | IAM 정책 없음 (로컬 환경) |
| SECURITY-07 (Network Config) | N/A | Docker Compose 로컬 환경 |
| SECURITY-08 (Access Control) | Compliant | JWT 인증 + storeId 검증 + 역할 기반 접근 |
| SECURITY-09 (Hardening) | Compliant | 에러 메시지 일반화, 디렉토리 리스팅 비활성화 |
| SECURITY-10 (Supply Chain) | Compliant | package-lock.json, 정확한 버전 고정 |
| SECURITY-11 (Secure Design) | Compliant | 보안 로직 분리, rate limiting, 오용 시나리오 고려 |
| SECURITY-12 (Auth/Credential) | N/A | 인증은 Unit 1 (core-auth) 책임 |
| SECURITY-13 (Integrity) | Compliant | SRI 해시 (CDN 리소스), 감사 로깅 |
| SECURITY-14 (Alerting) | Compliant | 인증 실패/권한 위반 로깅, 로그 보존 정책 |
| SECURITY-15 (Exception Handling) | Compliant | 글로벌 에러 핸들러, fail-closed, 리소스 정리 |
