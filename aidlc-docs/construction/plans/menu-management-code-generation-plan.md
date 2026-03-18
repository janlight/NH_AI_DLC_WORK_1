# Code Generation Plan - Unit 2: menu-management

## Unit 컨텍스트

- **Unit**: menu-management (메뉴 관리)
- **프로젝트 타입**: Greenfield, 모놀리스 (multi-unit)
- **코드 위치**: 워크스페이스 루트 (backend/, frontend/)
- **의존성**: Unit 1 (core-auth) - Prisma 스키마, Express 앱 구조, 인증 미들웨어, 에러 핸들러, 로거

## 구현 스토리
- US-02-01: 카테고리별 메뉴 조회
- US-02-02: 메뉴 상세 정보 확인
- US-08-01: 메뉴 등록
- US-08-02: 메뉴 수정 및 삭제
- US-08-03: 메뉴 조회 및 순서 관리

## 생성 파일 목록

### 백엔드
```
backend/src/
├── routes/menu.js
├── services/menuService.js
├── services/fileUploadService.js
├── validators/menuValidator.js
├── middleware/cache.js
```

### 백엔드 테스트
```
backend/tests/
├── services/menuService.test.js
├── services/fileUploadService.test.js
├── validators/menuValidator.test.js
├── routes/menu.test.js
```

### 프론트엔드
```
frontend/src/
├── stores/menuStore.js
├── views/customer/MenuView.vue
├── views/customer/MenuDetailModal.vue
├── views/admin/MenuManageView.vue
├── components/menu/CategoryTabs.vue
├── components/menu/MenuGrid.vue
├── components/menu/MenuCard.vue
├── components/menu/CategoryManager.vue
├── components/menu/MenuForm.vue
├── components/menu/ImageUploader.vue
├── components/menu/MenuOrderManager.vue
```

### 프론트엔드 테스트
```
frontend/tests/
├── stores/menuStore.test.js
├── components/menu/MenuCard.test.js
├── components/menu/MenuForm.test.js
├── views/customer/MenuView.test.js
├── views/admin/MenuManageView.test.js
```

### Prisma 스키마 추가
```
backend/prisma/
└── schema.prisma (Category, Menu 모델 추가)
```

---

## 실행 계획

### Part 1: 백엔드 - 비즈니스 로직

- [x] Step 1: Prisma 스키마에 Category, Menu 모델 추가 (인덱스 포함)
  - US-02-01, US-08-01 관련
- [x] Step 2: menuService.js 생성 (카테고리 CRUD + 메뉴 CRUD + ETag 헬퍼)
  - US-02-01, US-02-02, US-08-01, US-08-02, US-08-03 관련
- [x] Step 3: fileUploadService.js 생성 (이미지 저장/삭제/검증)
  - US-08-01 관련
- [x] Step 4: menuService 단위 테스트 생성
- [x] Step 5: fileUploadService 단위 테스트 생성

### Part 2: 백엔드 - API 레이어

- [x] Step 6: menuValidator.js 생성 (express-validator 검증 체인)
  - US-08-01, US-08-02, US-08-03 관련
- [x] Step 7: cache.js 미들웨어 생성 (HTTP 캐시 + ETag)
  - PERF-01 관련
- [x] Step 8: menu.js 라우트 생성 (카테고리 API + 메뉴 API + 이미지 업로드)
  - US-02-01, US-02-02, US-08-01, US-08-02, US-08-03 관련
- [x] Step 9: menuValidator 단위 테스트 생성
- [x] Step 10: menu 라우트 단위 테스트 생성

### Part 3: 프론트엔드 - Store & 컴포넌트

- [x] Step 11: menuStore.js 생성 (Pinia store)
  - US-02-01, US-02-02, US-08-01, US-08-02, US-08-03 관련
- [x] Step 12: 고객 컴포넌트 생성 (CategoryTabs, MenuGrid, MenuCard, MenuDetailModal)
  - US-02-01, US-02-02 관련
- [x] Step 13: MenuView.vue 생성 (고객 메뉴 페이지)
  - US-02-01, US-02-02 관련
- [x] Step 14: 관리자 컴포넌트 생성 (CategoryManager, MenuForm, ImageUploader, MenuOrderManager)
  - US-08-01, US-08-02, US-08-03 관련
- [x] Step 15: MenuManageView.vue 생성 (관리자 메뉴 관리 페이지)
  - US-08-01, US-08-02, US-08-03 관련

### Part 4: 프론트엔드 - 테스트

- [x] Step 16: menuStore 단위 테스트 생성
- [x] Step 17: 고객 컴포넌트 단위 테스트 생성 (MenuCard, MenuView)
- [x] Step 18: 관리자 컴포넌트 단위 테스트 생성 (MenuForm, MenuManageView)

### Part 5: 문서 & 배포

- [x] Step 19: 라우터 설정 업데이트 (frontend/src/router/index.js에 메뉴 라우트 추가)
- [x] Step 20: docker-compose.yml에 menu-uploads 볼륨 추가
- [x] Step 21: 코드 생성 요약 문서 작성 (aidlc-docs/construction/menu-management/code/)

---

## 총 21개 Step, 5개 스토리 커버
