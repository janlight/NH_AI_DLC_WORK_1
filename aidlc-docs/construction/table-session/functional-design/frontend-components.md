# Frontend Components - Unit 4: table-session

## 컴포넌트 구조

```
views/admin/
└── TableManageView.vue
    ├── TableCard.vue              # 테이블 카드 (대시보드 내 재사용)
    ├── TableSetupModal.vue        # 테이블 초기 설정 모달
    ├── OrderDeleteConfirm.vue     # 주문 삭제 확인 팝업
    ├── TableCompleteConfirm.vue   # 이용 완료 확인 팝업
    └── OrderHistoryModal.vue      # 과거 주문 내역 모달
```

## 컴포넌트 상세

### TableManageView.vue
- **역할**: 테이블 관리 메인 페이지
- **상태**: 테이블 목록, 선택된 테이블
- **API**: `GET /api/stores/:storeId/tables`
- **기능**: 테이블 목록 그리드 표시, 각 테이블 카드 렌더링

### TableSetupModal.vue
- **Props**: `storeId: string`
- **상태**: `tableNumber: number`, `password: string`
- **API**: `POST /api/stores/:storeId/tables`
- **검증**: 테이블 번호 필수, 비밀번호 필수
- **이벤트**: `@created` (성공 시 목록 갱신)

### OrderDeleteConfirm.vue
- **Props**: `orderId: string`, `orderNumber: string`
- **API**: `DELETE /api/stores/:storeId/orders/:orderId`
- **이벤트**: `@deleted` (성공 시 목록 갱신)

### TableCompleteConfirm.vue
- **Props**: `tableId: string`, `tableNumber: number`
- **API**: `POST /api/stores/:storeId/tables/:tableId/complete`
- **이벤트**: `@completed` (성공 시 테이블 리셋 반영)

### OrderHistoryModal.vue
- **Props**: `storeId: string`, `tableId: string`
- **상태**: `historyList: OrderHistory[]`, `startDate: string`, `endDate: string`
- **API**: `GET /api/stores/:storeId/tables/:tableId/order-history?startDate=&endDate=`
- **기능**: 날짜 필터, 시간 역순 목록, 각 주문 상세 (번호, 시각, 메뉴, 금액, 완료 시각)

## 사용자 인터랙션 플로우

### 테이블 초기 설정
```
테이블 관리 페이지 → "테이블 추가" 버튼 → TableSetupModal
→ 번호/비밀번호 입력 → 저장 → 성공 피드백 → 목록 갱신
```

### 주문 삭제
```
대시보드 테이블 카드 → 주문 상세 → "삭제" 버튼
→ OrderDeleteConfirm 팝업 → 확인 → 삭제 → 총액 재계산
```

### 이용 완료
```
대시보드 테이블 카드 → "이용 완료" 버튼
→ TableCompleteConfirm 팝업 → 확인 → 처리
→ 테이블 카드 리셋 (주문 0, 총액 0)
```

### 과거 내역 조회
```
대시보드 테이블 카드 → "과거 내역" 버튼
→ OrderHistoryModal → 날짜 필터 → 목록 표시 → "닫기"
```
