# Business Rules - Unit 1: core-auth

---

## BR-AUTH-01: 테이블 로그인

| 항목 | 규칙 |
|---|---|
| 입력 | storeId (slug), tableNumber, password |
| 매장 검증 | slug로 매장 조회, 미존재 또는 비활성 시 → 에러 "매장을 찾을 수 없습니다" |
| 테이블 검증 | storeId + tableNumber로 테이블 조회, 미존재 또는 비활성 시 → 에러 "테이블 정보가 올바르지 않습니다" |
| Rate Limit | BR-AUTH-05 적용 (identifier: `{storeId}:table:{tableNumber}`) |
| 비밀번호 확인 | bcrypt.compare(password, table.passwordHash), 실패 시 → LoginAttempt 기록 + 에러 "비밀번호가 올바르지 않습니다" |
| 세션 처리 | 활성 세션 존재 시 재사용, 없으면 새 세션 생성 |
| JWT 발급 | payload: `{ storeId, tableId, sessionId, tableNumber, role: "customer" }`, 만료: 16시간 |
| 성공 응답 | `{ token, tableId, sessionId, tableNumber }` |
| 로그인 정보 저장 | 클라이언트에서 localStorage에 저장 (자동 로그인용) |

---

## BR-AUTH-02: 관리자 로그인

| 항목 | 규칙 |
|---|---|
| 입력 | storeId (slug), username, password |
| 매장 검증 | slug로 매장 조회, 미존재 또는 비활성 시 → 에러 "매장을 찾을 수 없습니다" |
| 사용자 검증 | storeId + username으로 Admin 조회, 미존재 또는 비활성 시 → 에러 "로그인 정보가 올바르지 않습니다" |
| Rate Limit | BR-AUTH-05 적용 (identifier: `{storeId}:admin:{username}`) |
| 비밀번호 확인 | bcrypt.compare(password, admin.passwordHash), 실패 시 → LoginAttempt 기록 + 에러 "로그인 정보가 올바르지 않습니다" |
| JWT 발급 | payload: `{ storeId, adminId, username, role: admin.role }`, 만료: 16시간 |
| 성공 응답 | `{ token, role, username }` |

**보안 규칙**: 관리자 로그인 에러 메시지는 username/password 중 어느 것이 틀렸는지 구분하지 않음 (정보 노출 방지)

---

## BR-AUTH-03: JWT 토큰 검증

| 항목 | 규칙 |
|---|---|
| 입력 | Authorization 헤더의 Bearer 토큰 |
| 헤더 검증 | Authorization 헤더 미존재 또는 Bearer 형식 아닌 경우 → 401 |
| 서명 검증 | jwt.verify(token, SECRET_KEY), 실패 시 → 401 "유효하지 않은 토큰입니다" |
| 만료 검증 | 토큰 만료 시 → 401 "토큰이 만료되었습니다" (클라이언트에서 자동 재로그인 트리거) |
| payload 추출 | req.user에 payload 저장 (storeId, role 등) |
| 테넌트 격리 | req.params.storeId와 토큰의 storeId 불일치 시 → 403 |

---

## BR-AUTH-04: 역할 기반 접근 제어

| 역할 | 접근 가능 API |
|---|---|
| customer | 메뉴 조회, 장바구니→주문 생성, 본인 테이블 주문 조회 |
| admin (OWNER) | 모든 관리자 API (메뉴 관리, 테이블 관리, 주문 관리, 대시보드) |
| admin (MANAGER) | 주문 관리, 테이블 관리, 대시보드 (메뉴 CRUD 제외 가능 - 추후 확장) |

**미들웨어 체인**:
```
authMiddleware (토큰 검증) → roleMiddleware(allowedRoles) → 라우트 핸들러
```

**Object-Level Authorization**:
- customer: 본인 테이블(tableId)의 리소스만 접근 가능
- admin: 본인 매장(storeId)의 리소스만 접근 가능

---

## BR-AUTH-05: 로그인 시도 제한 (Rate Limiting)

| 항목 | 규칙 |
|---|---|
| 식별자 | `{storeId}:{type}:{identifier}` (type: table/admin) |
| 차단 조건 | 최근 15분 내 연속 5회 실패 |
| 차단 시간 | 15분 |
| 차단 응답 | 429 Too Many Requests + `{ retryAfter: 남은초 }` |
| 판정 로직 | LoginAttempt 테이블에서 identifier 기준 최근 15분 내 실패 건수 조회 |
| 차단 해제 | 15분 경과 후 자동 해제 (성공 로그인 시에도 카운트 리셋) |
| 성공 시 | LoginAttempt에 success=true 기록 |

---

## BR-AUTH-06: 비밀번호 해싱

| 항목 | 규칙 |
|---|---|
| 알고리즘 | bcrypt |
| Salt Rounds | 12 |
| 적용 대상 | Admin.passwordHash, Table.passwordHash |
| 해싱 시점 | 계정/테이블 생성 시, 비밀번호 변경 시 |
| 비교 | bcrypt.compare() 사용 (타이밍 공격 방지 내장) |

---

## BR-AUTH-07: 세션 만료 및 자동 재로그인

| 항목 | 규칙 |
|---|---|
| JWT 만료 시간 | 16시간 |
| 만료 감지 | API 요청 시 401 응답 수신 |
| 고객 자동 재로그인 | localStorage의 저장된 정보로 자동 tableLogin 재시도 |
| 관리자 자동 재로그인 | localStorage의 저장된 정보로 자동 adminLogin 재시도 |
| 재로그인 실패 | 수동 로그인 화면으로 이동 |
| 장바구니 보존 | 세션 만료 중에도 localStorage의 장바구니 데이터 유지 |

---

## BR-AUTH-08: 시드 데이터

| 항목 | 내용 |
|---|---|
| 기본 매장 | 1개 매장 생성 (name: "샘플매장", slug: "sample-store") |
| 기본 관리자 | 1개 OWNER 계정 (username: "admin", password: "admin1234" → bcrypt 해싱) |
| 기본 카테고리 | 3~4개 (예: 메인메뉴, 사이드, 음료, 디저트) |
| 기본 메뉴 | 카테고리별 2~3개 샘플 메뉴 |
| 기본 테이블 | 5개 테이블 (번호 1~5, password: "1234" → bcrypt 해싱) |
| 실행 조건 | DB 마이그레이션 후 1회 실행, 이미 데이터 존재 시 스킵 |
