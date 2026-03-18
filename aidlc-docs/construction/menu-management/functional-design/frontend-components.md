# Frontend Components - Unit 2: menu-management

## 컴포넌트 계층 구조

### Text Alternative
```
고객 영역:
  MenuView.vue
    +-- CategoryTabs (카테고리 탭 네비게이션)
    +-- MenuGrid (메뉴 카드 그리드)
    |     +-- MenuCard (개별 메뉴 카드) x N
    +-- MenuDetailModal (메뉴 상세 모달)

관리자 영역:
  MenuManageView.vue
    +-- CategoryManager (카테고리 관리 섹션)
    |     +-- CategoryForm (카테고리 추가/수정 폼)
    +-- MenuList (메뉴 목록 테이블)
    |     +-- MenuListItem (개별 메뉴 행) x N
    +-- MenuForm (메뉴 추가/수정 폼)
    |     +-- ImageUploader (이미지 업로드)
    +-- MenuOrderManager (순서 관리)

Store:
  menuStore (Pinia)
```

---

## 1. 고객 영역 컴포넌트

### 1.1 MenuView.vue (페이지)

**경로**: `/menu` (로그인 후 기본 화면)

**책임**: 카테고리별 메뉴 탐색 및 상세 보기

**State**:
| 상태 | 타입 | 설명 |
|---|---|---|
| categories | Category[] | 카테고리 목록 |
| menusByCategory | Map<categoryId, Menu[]> | 카테고리별 메뉴 |
| selectedCategoryId | string | null | 현재 선택된 카테고리 |
| selectedMenu | Menu | null | 상세 보기 선택된 메뉴 |
| isLoading | boolean | 데이터 로딩 상태 |
| error | string | null | 에러 메시지 |

**사용자 인터랙션**:
1. 페이지 진입 시 → menuStore.fetchMenus() 호출
2. 카테고리 탭 클릭 → selectedCategoryId 변경, 해당 카테고리 섹션으로 스크롤
3. 메뉴 카드 클릭 → selectedMenu 설정, MenuDetailModal 표시
4. 에러 발생 시 → 에러 메시지 + 재시도 버튼

**API 연동**:
- `GET /api/stores/:storeId/menus` → 메뉴 목록 (카테고리별 그룹)

### 1.2 CategoryTabs (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| categories | Category[] | 카테고리 목록 |
| activeCategoryId | string | null | 현재 활성 카테고리 |

**Events**: `@select(categoryId)` - 카테고리 선택 시

**UI**: 가로 스크롤 가능한 탭 바, 터치 친화적 (최소 44px 높이)

### 1.3 MenuGrid (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| menus | Menu[] | 표시할 메뉴 목록 |
| categoryName | string | 카테고리명 (섹션 헤더) |

**Events**: `@selectMenu(menu)` - 메뉴 카드 클릭 시

**UI**: 반응형 그리드 (2~3열), 카드 형태

### 1.4 MenuCard (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| menu | Menu | 메뉴 데이터 |

**Events**: `@click` - 카드 클릭 시

**UI 표시 항목**: 이미지 (또는 플레이스홀더), 메뉴명, 가격
**터치 영역**: 최소 44x44px

### 1.5 MenuDetailModal (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| menu | Menu | null | 표시할 메뉴 (null이면 숨김) |
| visible | boolean | 모달 표시 여부 |

**Events**:
- `@close` - 모달 닫기
- `@addToCart(menu, quantity)` - 장바구니 추가 (cartStore 연동, Order Unit 책임)

**UI 표시 항목**: 이미지 (큰 사이즈), 메뉴명, 가격, 설명, 수량 선택, 장바구니 추가 버튼

---

## 2. 관리자 영역 컴포넌트

### 2.1 MenuManageView.vue (페이지)

**경로**: `/admin/menus`

**책임**: 카테고리 및 메뉴 CRUD, 순서 관리

**State**:
| 상태 | 타입 | 설명 |
|---|---|---|
| categories | Category[] | 카테고리 목록 |
| menus | Menu[] | 메뉴 목록 (전체, isActive 무관) |
| selectedCategoryId | string | null | 필터링 카테고리 |
| editingMenu | Menu | null | 수정 중인 메뉴 |
| isFormVisible | boolean | 메뉴 폼 표시 여부 |
| isCategoryFormVisible | boolean | 카테고리 폼 표시 여부 |

**사용자 인터랙션**:
1. 카테고리 관리 → CategoryManager로 CRUD
2. 메뉴 추가 버튼 → MenuForm 표시 (빈 폼)
3. 메뉴 수정 버튼 → MenuForm 표시 (기존 데이터)
4. 메뉴 삭제 버튼 → 확인 팝업 → soft delete
5. 순서 변경 → MenuOrderManager로 드래그 앤 드롭 또는 버튼

**API 연동**:
- `GET /api/stores/:storeId/categories` → 카테고리 목록
- `POST/PUT/DELETE /api/stores/:storeId/categories/:id` → 카테고리 CRUD
- `GET /api/stores/:storeId/menus?admin=true` → 메뉴 목록 (관리자)
- `POST/PUT/DELETE /api/stores/:storeId/menus/:id` → 메뉴 CRUD
- `PUT /api/stores/:storeId/menus/order` → 메뉴 순서 변경
- `POST /api/stores/:storeId/menus/:id/image` → 이미지 업로드

### 2.2 CategoryManager (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| categories | Category[] | 카테고리 목록 |

**Events**:
- `@create(input)` - 카테고리 생성
- `@update(categoryId, input)` - 카테고리 수정
- `@delete(categoryId)` - 카테고리 삭제
- `@reorder(categoryOrders[])` - 순서 변경

**UI**: 카테고리 목록 + 추가/수정/삭제 버튼, 순서 변경 (위/아래 버튼)

### 2.3 MenuForm (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| menu | Menu | null | 수정 시 기존 데이터, 생성 시 null |
| categories | Category[] | 카테고리 선택 목록 |

**Events**:
- `@submit(menuData)` - 폼 제출
- `@cancel` - 취소

**폼 필드 및 검증**:
| 필드 | 타입 | 필수 | 프론트엔드 검증 |
|---|---|---|---|
| name | text input | ✅ | 1~100자, 공백만 불가 |
| price | number input | ✅ | 100~500,000 정수 |
| categoryId | select | ✅ | 카테고리 목록에서 선택 |
| description | textarea | ❌ | 0~500자 |
| image | file input | ❌ | JPG/PNG, 5MB 이하 |

**검증 에러 메시지**:
- 메뉴명 미입력: "메뉴명을 입력해주세요."
- 가격 범위 초과: "가격은 100원 이상 500,000원 이하여야 합니다."
- 카테고리 미선택: "카테고리를 선택해주세요."
- 이미지 형식 오류: "JPG 또는 PNG 형식만 가능합니다."
- 이미지 크기 초과: "5MB 이하의 이미지만 업로드 가능합니다."

### 2.4 ImageUploader (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| currentImageUrl | string | null | 현재 이미지 URL |

**Events**:
- `@select(file)` - 파일 선택 시
- `@remove` - 이미지 제거 시

**UI**: 이미지 미리보기, 파일 선택 버튼, 제거 버튼
**클라이언트 검증**: 파일 선택 시 즉시 크기/형식 검증

### 2.5 MenuOrderManager (컴포넌트)

**Props**:
| Prop | 타입 | 설명 |
|---|---|---|
| menus | Menu[] | 순서 변경 대상 메뉴 목록 |

**Events**:
- `@reorder(menuOrders[])` - 순서 변경 완료

**UI**: 드래그 앤 드롭 또는 위/아래 버튼으로 순서 조정, 저장 버튼

---

## 3. menuStore (Pinia)

### State
| 상태 | 타입 | 초기값 | 설명 |
|---|---|---|---|
| categories | Category[] | [] | 카테고리 목록 |
| menusByCategory | Record<string, Menu[]> | {} | 카테고리별 메뉴 |
| allMenus | Menu[] | [] | 전체 메뉴 (관리자용) |
| isLoading | boolean | false | 로딩 상태 |
| error | string | null | null | 에러 메시지 |

### Actions
| Action | 설명 | API 호출 |
|---|---|---|
| fetchMenus() | 고객용 메뉴 조회 | GET /menus |
| fetchMenusAdmin(categoryId?) | 관리자용 메뉴 조회 | GET /menus?admin=true |
| fetchCategories() | 카테고리 목록 조회 | GET /categories |
| createCategory(input) | 카테고리 생성 | POST /categories |
| updateCategory(id, input) | 카테고리 수정 | PUT /categories/:id |
| deleteCategory(id) | 카테고리 삭제 | DELETE /categories/:id |
| updateCategoryOrder(orders) | 카테고리 순서 변경 | PUT /categories/order |
| createMenu(input) | 메뉴 생성 | POST /menus |
| updateMenu(id, input) | 메뉴 수정 | PUT /menus/:id |
| deleteMenu(id) | 메뉴 삭제 (soft) | DELETE /menus/:id |
| updateMenuOrder(orders) | 메뉴 순서 변경 | PUT /menus/order |
| uploadImage(menuId, file) | 이미지 업로드 | POST /menus/:id/image |

### Getters
| Getter | 설명 |
|---|---|
| activeMenusByCategory | isActive=true 메뉴만 카테고리별 그룹 |
| getCategoryById(id) | ID로 카테고리 조회 |
| getMenuById(id) | ID로 메뉴 조회 |

---

## 4. 라우트 설정 (router 추가분)

| 경로 | 컴포넌트 | 인증 | 설명 |
|---|---|---|---|
| /menu | MenuView.vue | 고객 (테이블 로그인) | 메뉴 조회 (기본 화면) |
| /admin/menus | MenuManageView.vue | 관리자 | 메뉴 관리 |
