# Functional Design Plan - Unit 2: menu-management

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: Unit 컨텍스트 분석
- [x] Step 2: 설계 계획 수립
- [x] Step 3: 질문 생성
- [ ] Step 4: 사용자 답변 수집
- [ ] Step 5: 답변 분석

### Part 2: 생성
- [ ] Step 6: domain-entities.md 생성
- [ ] Step 7: business-rules.md 생성
- [ ] Step 8: business-logic-model.md 생성
- [ ] Step 9: frontend-components.md 생성
- [ ] Step 10: 검증 및 승인 요청

---

## 설계 범위

- MenuComponent / MenuService 상세 비즈니스 로직
- 카테고리 관리, 메뉴 CRUD, 이미지 업로드
- 메뉴 노출 순서 관리
- 프론트엔드: MenuView (고객), MenuManageView (관리자), menuStore

## 관련 스토리
- US-02-01 (카테고리별 메뉴 조회)
- US-02-02 (메뉴 상세 정보 확인)
- US-08-01 (메뉴 등록)
- US-08-02 (메뉴 수정 및 삭제)
- US-08-03 (메뉴 조회 및 순서 관리)

---

## 질문

### Q1: 카테고리 관리 방식
메뉴 카테고리는 어떻게 관리할까요?

- A) 관리자가 자유롭게 카테고리 CRUD 가능 (별도 Category 테이블)
- B) 시드 데이터로 고정 카테고리 제공, 관리자가 추가/수정 가능
- C) 시스템 고정 카테고리만 사용 (변경 불가)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q2: 이미지 업로드 제약
메뉴 이미지 업로드 시 파일 크기 및 형식 제한은?

- A) 최대 5MB, JPG/PNG만 허용
- B) 최대 10MB, JPG/PNG/WebP 허용
- C) 제한 없음 (서버 기본 설정)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q3: 가격 범위 검증
메뉴 가격의 허용 범위는?

- A) 0원 초과 ~ 1,000,000원 이하
- B) 100원 이상 ~ 500,000원 이하
- C) 제한 없음 (양수만 검증)
- D) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q4: 메뉴 삭제 시 기존 주문 처리
이미 주문된 메뉴를 삭제할 때 기존 주문 데이터는?

- A) 메뉴 삭제해도 기존 주문 데이터는 유지 (메뉴명/가격 스냅샷 보존)
- B) 메뉴 삭제 시 soft delete (비활성화만, 데이터 유지)
- C) Other (please describe after [Answer]: tag below)

[Answer]: 

