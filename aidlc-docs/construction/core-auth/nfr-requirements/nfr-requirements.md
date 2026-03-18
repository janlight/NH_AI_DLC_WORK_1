# NFR Requirements - Unit 1: core-auth

---

## NFR-CA-01: 성능

| 항목 | 요구사항 |
|---|---|
| 로그인 API 응답 시간 | 1초 이내 (bcrypt 해싱 포함) |
| 토큰 검증 API 응답 시간 | 100ms 이내 (서명 검증만) |
| DB 연결 풀 | connection_limit=20 |
| 동시 접속 | 매장당 30~100 테이블 동시 인증 처리 |
| bcrypt salt rounds | 12 (해싱 약 250ms, 1초 목표 내 충분) |

**설계 반영**:
- Prisma connection pool size를 DATABASE_URL에 `?connection_limit=20`으로 설정
- bcrypt 비동기 호출 사용 (이벤트 루프 블로킹 방지)
- JWT 검증은 CPU 바운드이나 매우 빠름 (< 5ms)

---

## NFR-CA-02: 보안

| 항목 | 요구사항 |
|---|---|
| 비밀번호 해싱 | bcrypt, salt rounds 12 |
| JWT 서명 | HS256, 환경 변수로 시크릿 관리 |
| JWT 만료 | 16시간 |
| Rate Limiting | 5회 실패 / 15분 차단 |
| HTTPS | TLS 1.2+ 강제 (프로덕션) |
| 보안 헤더 | helmet 미들웨어 (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) |
| CORS | 허용 origin 명시 (와일드카드 금지) |
| 입력 검증 | Joi 스키마 기반 전 API 파라미터 검증 |
| SQL Injection 방지 | Prisma 파라미터화 쿼리 (문자열 연결 금지) |
| XSS 방지 | CSP 헤더 + 입력 sanitization |
| 에러 메시지 | 프로덕션에서 스택 트레이스 미노출 |
| 시크릿 관리 | 소스 코드에 하드코딩 금지, .env 파일 + .gitignore |

**SECURITY Extension 매핑**:
- SECURITY-01: DB 연결 TLS, .env로 시크릿 분리
- SECURITY-03: winston 구조화 로깅, 민감 데이터 미로깅
- SECURITY-04: helmet 보안 헤더 5종
- SECURITY-05: Joi 입력 검증, Prisma 파라미터화 쿼리
- SECURITY-08: authMiddleware + roleMiddleware, 테넌트 격리
- SECURITY-09: 에러 메시지 일반화, 기본 credentials 시드 후 변경 안내
- SECURITY-11: 인증 모듈 분리, Rate Limiting
- SECURITY-12: bcrypt, 세션 만료, 브루트포스 방지
- SECURITY-15: 글로벌 에러 핸들러, fail-closed

---

## NFR-CA-03: 신뢰성

| 항목 | 요구사항 |
|---|---|
| 에러 처리 | 글로벌 에러 핸들러, 모든 외부 호출 try/catch |
| DB 연결 복구 | Prisma 자동 재연결 |
| Fail-closed | 인증 실패 시 접근 거부 (절대 fail-open 안 함) |
| 리소스 정리 | 에러 시 DB 트랜잭션 롤백, 연결 반환 |
| Unhandled Rejection | process.on('unhandledRejection') 핸들러 등록 |

---

## NFR-CA-04: 로깅 및 모니터링

| 항목 | 요구사항 |
|---|---|
| 로깅 프레임워크 | winston |
| 로그 형식 | JSON 구조화 (timestamp, level, message, requestId, context) |
| 로그 레벨 | error, warn, info, debug |
| HTTP 요청 로깅 | morgan 미들웨어 연동 (winston transport) |
| 보안 이벤트 로깅 | 로그인 실패, Rate Limit 차단, 권한 거부 |
| 민감 데이터 | 비밀번호, 토큰 값 절대 로깅 금지 |
| Request ID | 각 요청에 UUID 할당, 전 로그에 포함 |
| 로그 보존 | 최소 90일 (파일 rotation 설정) |

---

## NFR-CA-05: 확장성

| 항목 | 요구사항 |
|---|---|
| 멀티 테넌트 | storeId 기반 데이터 격리 |
| DB 인덱스 | 테넌트 격리 쿼리 최적화 인덱스 |
| 수평 확장 | JWT 기반 stateless 인증 (서버 간 세션 공유 불필요) |
| 연결 풀 | connection_limit=20 (100+ 매장 대응) |

---

## NFR-CA-06: 유지보수성

| 항목 | 요구사항 |
|---|---|
| 코드 구조 | 관심사 분리 (routes / services / middleware) |
| 환경 설정 | .env 파일 기반, 환경별 분리 가능 |
| 의존성 관리 | package-lock.json 커밋, 정확한 버전 고정 |
| 테스트 | 단위 테스트 + 통합 테스트 |
