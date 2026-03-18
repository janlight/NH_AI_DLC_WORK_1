# Frontend Components - Unit 1: core-auth

---

## 1. 컴포넌트 계층 구조

```
App.vue
├─ router-view
│   ├─ customer/LoginView.vue    (경로: /login)
│   ├─ customer/MenuView.vue     (경로: /:storeSlug/menu) [Unit 2]
│   ├─ customer/CartView.vue     (경로: /:storeSlug/cart) [Unit 3]
│   ├─ customer/OrderView.vue    (경로: /:storeSlug/orders) [Unit 3]
│   ├─ admin/LoginView.vue       (경로: /admin/login)
│   └─ admin/DashboardView.vue   (경로: /admin/:storeSlug/dashboard) [Unit 3]
```

---

## 2. 고객 LoginView.vue

### Props / State

| State | 타입 | 초기값 | 설명 |
|---|---|---|---|
| storeSlug | string | "" | 매장 식별자 |
| tableNumber | string | "" | 테이블 번호 |
| password | string | "" | 비밀번호 |
| isLoading | boolean | false | 로그인 진행 중 |
| errorMessage | string | "" | 에러 메시지 |
| isAutoLoginAttempted | boolean | false | 자동 로그인 시도 여부 |

### 사용자 인터랙션 흐름

```
페이지 진입
  ├─ localStorage에 저장된 로그인 정보 확인
  │   ├─ 존재 → 자동 로그인 시도
  │   │   ├─ 성공 → 메뉴 화면으로 이동
  │   │   └─ 실패 → 수동 로그인 폼 표시
  │   └─ 미존재 → 수동 로그인 폼 표시
  │
  수동 로그인 폼
  ├─ 매장 식별자 입력
  ├─ 테이블 번호 입력
  ├─ 비밀번호 입력
  └─ 로그인 버튼 클릭
      ├─ 입력 검증 (빈 값 체크)
      ├─ authStore.tableLogin() 호출
      ├─ 성공 → localStorage 저장 + 메뉴 화면 이동
      └─ 실패
          ├─ 429 → "로그인 시도 제한 초과. N분 후 다시 시도해주세요."
          └─ 기타 → 서버 에러 메시지 표시
```

### 폼 검증 규칙

| 필드 | 규칙 |
|---|---|
| storeSlug | 필수, 영문소문자+숫자+하이픈 |
| tableNumber | 필수, 양의 정수 |
| password | 필수 |

### 접근성 요구사항
- 모든 입력 필드에 label 연결
- 최소 터치 영역 44x44px
- 에러 메시지 aria-live="polite"
- 키보드 네비게이션 지원

---

## 3. 관리자 LoginView.vue

### Props / State

| State | 타입 | 초기값 | 설명 |
|---|---|---|---|
| storeSlug | string | "" | 매장 식별자 |
| username | string | "" | 사용자명 |
| password | string | "" | 비밀번호 |
| isLoading | boolean | false | 로그인 진행 중 |
| errorMessage | string | "" | 에러 메시지 |

### 사용자 인터랙션 흐름

```
페이지 진입
  ├─ localStorage에 저장된 관리자 토큰 확인
  │   ├─ 존재 → verify API 호출
  │   │   ├─ 유효 → 대시보드로 이동
  │   │   └─ 만료/무효 → 로그인 폼 표시
  │   └─ 미존재 → 로그인 폼 표시
  │
  로그인 폼
  ├─ 매장 식별자 입력
  ├─ 사용자명 입력
  ├─ 비밀번호 입력
  └─ 로그인 버튼 클릭
      ├─ 입력 검증
      ├─ authStore.adminLogin() 호출
      ├─ 성공 → localStorage 저장 + 대시보드 이동
      └─ 실패 → 에러 메시지 표시
```

### 폼 검증 규칙

| 필드 | 규칙 |
|---|---|
| storeSlug | 필수, 영문소문자+숫자+하이픈 |
| username | 필수, max 50자 |
| password | 필수 |

---

## 4. authStore (Pinia)

### State

| 속성 | 타입 | 초기값 | 설명 |
|---|---|---|---|
| token | string/null | null | JWT 토큰 |
| user | object/null | null | 디코딩된 사용자 정보 |
| isAuthenticated | boolean | false | 인증 상태 |
| isLoading | boolean | false | 로딩 상태 |

### Actions

| Action | 설명 |
|---|---|
| tableLogin(storeSlug, tableNumber, password) | 테이블 로그인 → 토큰 저장 → user 설정 |
| adminLogin(storeSlug, username, password) | 관리자 로그인 → 토큰 저장 → user 설정 |
| logout() | 토큰/user 초기화, localStorage 토큰 삭제 |
| checkAuth() | localStorage 토큰 확인 → verify API → 상태 복원 |
| autoRelogin() | 저장된 credentials로 자동 재로그인 시도 |

### Getters

| Getter | 반환 | 설명 |
|---|---|---|
| isCustomer | boolean | role === "customer" |
| isAdmin | boolean | role === "OWNER" 또는 "MANAGER" |
| storeId | string/null | 현재 매장 ID |

---

## 5. API Client (api/client.js)

### 설정

```
baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api"
timeout: 10000ms
```

### Interceptors

**Request Interceptor**:
```
토큰 존재 시 → Authorization: Bearer {token} 헤더 추가
```

**Response Interceptor**:
```
401 응답 수신 시
  ├─ 토큰 만료 에러 → autoRelogin() 시도
  │   ├─ 성공 → 원래 요청 재시도
  │   └─ 실패 → 로그인 페이지로 이동
  └─ 기타 401 → 로그인 페이지로 이동
```

---

## 6. Router (router/index.js)

### 라우트 정의

| 경로 | 컴포넌트 | 가드 | 설명 |
|---|---|---|---|
| /login | customer/LoginView | 없음 | 고객 로그인 |
| /:storeSlug/menu | customer/MenuView | customerAuth | 메뉴 (Unit 2) |
| /:storeSlug/cart | customer/CartView | customerAuth | 장바구니 (Unit 3) |
| /:storeSlug/orders | customer/OrderView | customerAuth | 주문내역 (Unit 3) |
| /admin/login | admin/LoginView | 없음 | 관리자 로그인 |
| /admin/:storeSlug/dashboard | admin/DashboardView | adminAuth | 대시보드 (Unit 3) |
| /admin/:storeSlug/menus | admin/MenuManageView | adminAuth | 메뉴관리 (Unit 2) |
| /admin/:storeSlug/tables | admin/TableManageView | adminAuth | 테이블관리 (Unit 4) |

### Navigation Guards

**customerAuth**:
```
authStore.isAuthenticated && authStore.isCustomer
  ├─ true → next()
  └─ false → redirect(/login)
```

**adminAuth**:
```
authStore.isAuthenticated && authStore.isAdmin
  ├─ true → next()
  └─ false → redirect(/admin/login)
```

---

## 7. localStorage 키 구조

| 키 | 값 | 용도 |
|---|---|---|
| table_auth_token | JWT 토큰 | 고객 인증 토큰 |
| table_auth_credentials | `{ storeSlug, tableNumber, password }` | 자동 재로그인용 |
| admin_auth_token | JWT 토큰 | 관리자 인증 토큰 |
| admin_auth_credentials | `{ storeSlug, username, password }` | 관리자 자동 재로그인용 |
| cart_items | JSON 배열 | 장바구니 데이터 (Unit 3) |

**보안 고려사항**:
- credentials 저장은 자동 로그인 편의를 위한 것으로, 프로덕션에서는 refresh token 방식 권장
- 현재 MVP 단계에서는 요구사항(US-01-01)에 따라 localStorage 저장 방식 채택
