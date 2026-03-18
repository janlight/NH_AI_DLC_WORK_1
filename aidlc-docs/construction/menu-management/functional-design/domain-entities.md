# Domain Entities - Unit 2: menu-management

## 엔티티 관계도

### Text Alternative
```
Category 1---* Menu
Menu 1---0..1 MenuImage (imageUrl 필드)
Store 1---* Category (storeId FK)
Store 1---* Menu (storeId FK)
```

---

## 1. Category (카테고리)

**목적**: 메뉴를 논리적으로 분류하는 카테고리 관리

| 속성 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID (string) | PK, auto-generated | 카테고리 고유 식별자 |
| storeId | string | FK → Store.id, NOT NULL | 소속 매장 ID (멀티 테넌트) |
| name | string | NOT NULL, max 50자 | 카테고리명 |
| sortOrder | integer | NOT NULL, default 0 | 노출 순서 (오름차순) |
| createdAt | datetime | NOT NULL, auto | 생성 시각 |
| updatedAt | datetime | NOT NULL, auto | 수정 시각 |

**유니크 제약**: (storeId, name) - 동일 매장 내 카테고리명 중복 불가

**관계**:
- Store 1 → * Category (매장별 카테고리)
- Category 1 → * Menu (카테고리별 메뉴)

---

## 2. Menu (메뉴)

**목적**: 매장에서 판매하는 개별 메뉴 항목

| 속성 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID (string) | PK, auto-generated | 메뉴 고유 식별자 |
| storeId | string | FK → Store.id, NOT NULL | 소속 매장 ID |
| categoryId | string | FK → Category.id, NOT NULL | 소속 카테고리 ID |
| name | string | NOT NULL, max 100자 | 메뉴명 |
| price | integer | NOT NULL, 100 ≤ price ≤ 500000 | 가격 (원 단위) |
| description | string | nullable, max 500자 | 메뉴 설명 |
| imageUrl | string | nullable, max 500자 | 이미지 파일 경로 (상대 경로) |
| sortOrder | integer | NOT NULL, default 0 | 카테고리 내 노출 순서 (오름차순) |
| isActive | boolean | NOT NULL, default true | 활성 상태 (soft delete용) |
| createdAt | datetime | NOT NULL, auto | 생성 시각 |
| updatedAt | datetime | NOT NULL, auto | 수정 시각 |

**유니크 제약**: (storeId, categoryId, name, isActive=true) - 동일 카테고리 내 활성 메뉴명 중복 불가 (앱 레벨 검증)

**관계**:
- Store 1 → * Menu
- Category 1 → * Menu
- Menu → OrderItem (다른 Unit에서 참조, 이 Unit에서는 soft delete로 무결성 보장)

---

## 3. DTO / Input 타입

### CreateCategoryInput

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| name | string | ✅ | 1~50자, 공백만 불가 |
| sortOrder | integer | ❌ | 0 이상, 미입력 시 마지막 순서 자동 할당 |

### UpdateCategoryInput

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| name | string | ❌ | 1~50자, 공백만 불가 |
| sortOrder | integer | ❌ | 0 이상 |

### CreateMenuInput

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| categoryId | string | ✅ | 유효한 카테고리 ID |
| name | string | ✅ | 1~100자, 공백만 불가 |
| price | integer | ✅ | 100 ≤ price ≤ 500000 |
| description | string | ❌ | 0~500자 |

### UpdateMenuInput

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| categoryId | string | ❌ | 유효한 카테고리 ID |
| name | string | ❌ | 1~100자, 공백만 불가 |
| price | integer | ❌ | 100 ≤ price ≤ 500000 |
| description | string | ❌ | 0~500자 |

### MenuOrderInput

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| menuId | string | ✅ | 유효한 메뉴 ID |
| sortOrder | integer | ✅ | 0 이상 |

### ImageUploadConstraints

| 항목 | 값 |
|---|---|
| 최대 파일 크기 | 5MB (5,242,880 bytes) |
| 허용 MIME 타입 | image/jpeg, image/png |
| 허용 확장자 | .jpg, .jpeg, .png |
| 저장 경로 | uploads/{storeId}/menus/ |
| 파일명 규칙 | {menuId}_{timestamp}.{ext} |
