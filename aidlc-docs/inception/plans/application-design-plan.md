# Application Design Plan

## 실행 체크리스트

- [x] Step 1: 컨텍스트 분석 (requirements.md, stories.md 로드)
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집 (Q1~Q5 전부 A)
- [x] Step 5: 답변 분석 (모호함 없음)
- [x] Step 6: 설계 산출물 생성
  - [x] components.md
  - [x] component-methods.md
  - [x] services.md
  - [x] component-dependency.md
  - [x] application-design.md (통합 문서)
- [x] Step 7: 설계 완전성 검증
- [ ] Step 8: 승인 요청

---

## 설계 범위

### 식별된 주요 컴포넌트 영역
1. **인증 컴포넌트** - 고객 테이블 인증 + 관리자 인증
2. **메뉴 컴포넌트** - 메뉴 CRUD + 카테고리 관리 + 이미지 업로드
3. **주문 컴포넌트** - 주문 생성/조회/삭제 + 상태 관리
4. **테이블 컴포넌트** - 테이블 설정 + 세션 라이프사이클
5. **실시간 통신 컴포넌트** - SSE 기반 주문 알림
6. **매장 컴포넌트** - 멀티 테넌트 매장 관리

### 식별된 서비스 레이어
- API 라우팅 레이어 (Express/Fastify)
- 비즈니스 로직 서비스 레이어
- 데이터 액세스 레이어 (PostgreSQL)

---

## 질문

### Q1: 백엔드 프레임워크 선택
Node.js 백엔드 프레임워크로 어떤 것을 사용할까요?

- A) Express.js - 가장 널리 사용, 풍부한 생태계, 미들웨어 패턴 (권장)
- B) Fastify - 높은 성능, 스키마 기반 검증, 플러그인 시스템

[Answer]: A

### Q2: 프론트엔드 상태 관리
Vue.js 상태 관리 방식을 어떻게 할까요?

- A) Pinia - Vue 3 공식 상태 관리, 간결한 API (권장)
- B) Vuex - Vue 2/3 호환, 전통적 Flux 패턴
- C) Composables만 사용 - 별도 상태 관리 라이브러리 없이 Vue 3 Composition API만 활용

[Answer]: A

### Q3: 데이터 액세스 패턴
PostgreSQL 접근 방식을 어떻게 할까요?

- A) ORM 사용 (Prisma) - 타입 안전, 마이그레이션 관리, 생산성 높음 (권장)
- B) ORM 사용 (Sequelize) - 전통적 ORM, 풍부한 기능
- C) Query Builder (Knex.js) - SQL에 가까운 제어, 유연성
- D) Raw SQL (pg 드라이버) - 최대 제어, 최소 추상화

[Answer]: A

### Q4: API 설계 스타일
REST API 설계 시 URL 구조를 어떻게 할까요?

- A) 매장 ID를 URL 경로에 포함 (예: `/api/stores/:storeId/menus`) (권장 - 멀티 테넌트 명확)
- B) 매장 ID를 JWT 토큰에서 추출 (예: `/api/menus`, 토큰에서 매장 식별)

[Answer]: A

### Q5: 프론트엔드 UI 프레임워크
Vue.js UI 컴포넌트 라이브러리를 사용할까요?

- A) Tailwind CSS만 사용 - 유틸리티 기반, 커스텀 디자인 자유도 높음 (권장)
- B) Vuetify - Material Design 기반, 풍부한 컴포넌트
- C) PrimeVue - 다양한 테마, 엔터프라이즈급 컴포넌트

[Answer]: A

---

## 필수 산출물
- [ ] `aidlc-docs/inception/application-design/components.md`
- [ ] `aidlc-docs/inception/application-design/component-methods.md`
- [ ] `aidlc-docs/inception/application-design/services.md`
- [ ] `aidlc-docs/inception/application-design/component-dependency.md`
- [ ] `aidlc-docs/inception/application-design/application-design.md`
