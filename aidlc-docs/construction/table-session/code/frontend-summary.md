# Frontend Summary - Unit 4: table-session

## 컴포넌트

| 파일 | 스토리 | 설명 |
|---|---|---|
| TableManageView.vue | US-07-01~04 | 테이블 관리 메인 페이지 (그리드 레이아웃) |
| TableSetupModal.vue | US-07-01 | 테이블 추가 모달 (번호, 비밀번호) |
| OrderDeleteConfirm.vue | US-07-02 | 주문 삭제 확인 팝업 |
| TableCompleteConfirm.vue | US-07-03 | 이용 완료 확인 팝업 (conflictRetry 적용) |
| OrderHistoryModal.vue | US-07-04 | 과거 주문 내역 모달 (날짜 필터) |

## 유틸리티

| 파일 | 설명 |
|---|---|
| conflictRetry.js | 409 Conflict 자동 재시도 (3초 대기, 최대 2회) |

## data-testid 목록
- `table-add-button`, `table-card-{n}`, `table-complete-button`, `table-history-button`
- `table-setup-number-input`, `table-setup-password-input`, `table-setup-submit-button`
- `order-delete-confirm-button`, `table-complete-confirm-button`
- `history-close-button`, `history-start-date`, `history-end-date`, `history-filter-button`
