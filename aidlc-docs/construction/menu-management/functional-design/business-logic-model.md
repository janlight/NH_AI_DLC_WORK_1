# Business Logic Model - Unit 2: menu-management

## 1. 카테고리 관리 로직

### 1.1 카테고리 목록 조회
```
getCategoriesByStore(storeId):
  1. storeId로 카테고리 목록 조회 (sortOrder ASC)
  2. 각 카테고리별 활성 메뉴 수 포함
  3. 반환: Category[] (with menuCount)
```

### 1.2 카테고리 생성
```
createCategory(storeId, input):
  1. input.name trim 처리
  2. 동일 매장 내 카테고리명 중복 검사 (case-insensitive)
     - 중복 시: 409 Conflict "이미 존재하는 카테고리명입니다."
  3. sortOrder 결정:
     - input.sortOrder 있으면 사용
     - 없으면: 해당 매장 카테고리 최대 sortOrder + 1
  4. Category 레코드 생성
  5. 반환: 생성된 Category
```

### 1.3 카테고리 수정
```
updateCategory(storeId, categoryId, input):
  1. storeId + categoryId로 카테고리 조회
     - 미존재 시: 404 "카테고리를 찾을 수 없습니다."
  2. input.name 있으면:
     - trim 처리
     - 동일 매장 내 다른 카테고리와 이름 중복 검사
     - 중복 시: 409 Conflict
  3. 변경된 필드만 업데이트
  4. 반환: 수정된 Category
```

### 1.4 카테고리 삭제
```
deleteCategory(storeId, categoryId):
  1. storeId + categoryId로 카테고리 조회
     - 미존재 시: 404
  2. 해당 카테고리에 활성 메뉴(isActive=true) 존재 여부 확인
     - 존재 시: 400 "해당 카테고리에 활성 메뉴가 있어 삭제할 수 없습니다."
  3. Category 레코드 물리적 삭제
  4. 반환: void (204 No Content)
```

### 1.5 카테고리 순서 변경
```
updateCategoryOrder(storeId, categoryOrders[]):
  1. categoryOrders 배열의 각 categoryId가 해당 매장 소속인지 검증
     - 미소속 항목 존재 시: 400
  2. 트랜잭션 내에서 각 카테고리의 sortOrder 일괄 업데이트
  3. 반환: void (200 OK)
```

---

## 2. 메뉴 관리 로직

### 2.1 메뉴 목록 조회 (고객용)
```
getMenusByStore(storeId):
  1. storeId로 카테고리 목록 조회 (sortOrder ASC)
  2. 각 카테고리별 활성 메뉴(isActive=true) 조회 (sortOrder ASC)
  3. 카테고리-메뉴 그룹 구조로 반환
  4. 반환: { categories: [{ category, menus: Menu[] }] }
```

### 2.2 메뉴 목록 조회 (관리자용)
```
getMenusByStoreAdmin(storeId, categoryId?):
  1. storeId로 카테고리 목록 조회
  2. categoryId 필터 있으면 해당 카테고리만
  3. 모든 메뉴 조회 (isActive 무관, sortOrder ASC)
  4. 비활성 메뉴는 isActive=false 표시
  5. 반환: { categories: [{ category, menus: Menu[] }] }
```

### 2.3 메뉴 상세 조회
```
getMenuDetail(storeId, menuId):
  1. storeId + menuId로 메뉴 조회 (카테고리 정보 포함)
     - 미존재 시: 404 "메뉴를 찾을 수 없습니다."
  2. 고객 요청인 경우 isActive=false이면 404
  3. 반환: Menu (with category)
```

### 2.4 메뉴 등록
```
createMenu(storeId, input):
  1. 입력 검증:
     - name: 필수, 1~100자, trim
     - price: 필수, 정수, 100 ≤ price ≤ 500000
     - categoryId: 필수, 해당 매장 내 존재하는 카테고리
     - description: 선택, 0~500자
  2. categoryId 유효성 검증
     - 미존재 또는 다른 매장: 400 "유효하지 않은 카테고리입니다."
  3. 동일 카테고리 내 활성 메뉴명 중복 검사
     - 중복 시: 409 "동일 카테고리에 같은 이름의 메뉴가 존재합니다."
  4. sortOrder 결정: 해당 카테고리 내 최대값 + 1
  5. Menu 레코드 생성 (isActive=true, imageUrl=null)
  6. 반환: 생성된 Menu (201 Created)
```

### 2.5 메뉴 수정
```
updateMenu(storeId, menuId, input):
  1. storeId + menuId로 메뉴 조회
     - 미존재 시: 404
  2. 입력 검증 (제공된 필드만):
     - name: 1~100자, trim
     - price: 정수, 100 ≤ price ≤ 500000
     - categoryId: 해당 매장 내 존재하는 카테고리
     - description: 0~500자
  3. categoryId 변경 시:
     - 새 카테고리 유효성 검증
     - 새 카테고리 내 메뉴명 중복 검사
  4. name 변경 시:
     - 현재(또는 변경될) 카테고리 내 메뉴명 중복 검사
  5. 변경된 필드만 업데이트
  6. 반환: 수정된 Menu
```

### 2.6 메뉴 삭제 (Soft Delete)
```
deleteMenu(storeId, menuId):
  1. storeId + menuId로 메뉴 조회
     - 미존재 시: 404
     - 이미 비활성(isActive=false) 시: 400 "이미 삭제된 메뉴입니다."
  2. isActive = false로 업데이트
  3. updatedAt 갱신
  4. 반환: void (204 No Content)
```

### 2.7 메뉴 순서 변경
```
updateMenuOrder(storeId, menuOrders[]):
  1. menuOrders 배열의 각 menuId가 해당 매장 소속인지 검증
     - 미소속 항목 존재 시: 400
  2. 트랜잭션 내에서 각 메뉴의 sortOrder 일괄 업데이트
  3. 반환: void (200 OK)
```

---

## 3. 이미지 업로드 로직

### 3.1 이미지 업로드
```
uploadImage(storeId, menuId, file):
  1. storeId + menuId로 메뉴 조회
     - 미존재 시: 404
  2. 파일 검증:
     - 파일 존재 여부 확인
     - MIME 타입 검증 (image/jpeg, image/png)
     - 파일 크기 검증 (≤ 5MB)
     - 검증 실패 시: 400 + 구체적 에러 메시지
  3. 저장 경로 생성: uploads/{storeId}/menus/
     - 디렉토리 미존재 시 자동 생성
  4. 파일명 생성: {menuId}_{timestamp}.{ext}
  5. 기존 이미지 존재 시:
     - 이전 파일 삭제 (파일 시스템)
  6. 새 파일 저장
  7. Menu.imageUrl 업데이트 (상대 경로)
  8. 반환: { imageUrl: string }
```

---

## 4. 에러 처리 모델

| 상황 | HTTP 상태 | 에러 코드 | 메시지 |
|---|---|---|---|
| 카테고리/메뉴 미존재 | 404 | NOT_FOUND | "카테고리/메뉴를 찾을 수 없습니다." |
| 이름 중복 | 409 | DUPLICATE_NAME | "이미 존재하는 이름입니다." |
| 필수 필드 누락 | 400 | VALIDATION_ERROR | 구체적 필드별 메시지 |
| 가격 범위 초과 | 400 | VALIDATION_ERROR | "가격은 100원 이상 500,000원 이하여야 합니다." |
| 이미지 크기 초과 | 400 | FILE_TOO_LARGE | "이미지 파일 크기는 5MB 이하여야 합니다." |
| 이미지 형식 오류 | 400 | INVALID_FILE_TYPE | "JPG 또는 PNG 형식의 이미지만 업로드 가능합니다." |
| 활성 메뉴 있는 카테고리 삭제 | 400 | CATEGORY_HAS_MENUS | "해당 카테고리에 활성 메뉴가 있어 삭제할 수 없습니다." |
| 이미 삭제된 메뉴 재삭제 | 400 | ALREADY_DELETED | "이미 삭제된 메뉴입니다." |
| 권한 없음 | 403 | FORBIDDEN | "접근 권한이 없습니다." |
| 다른 매장 리소스 접근 | 404 | NOT_FOUND | 리소스 미존재로 응답 (정보 노출 방지) |
