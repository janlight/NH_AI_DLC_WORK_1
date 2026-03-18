# Business Rules - Unit 4: table-session

## BR-T01: 테이블 번호 유니크 제약
- 동일 매장 내 테이블 번호는 중복 불가
- 검증 시점: 테이블 생성/수정 시

## BR-T02: 테이블 세션 자동 시작
- 세션이 없는 테이블에서 첫 주문 생성 시 자동으로 새 세션 시작
- 새 TableSession 레코드 생성 (isActive: true)
- Table.currentSessionId 업데이트
- 이미 활성 세션이 있으면 해당 세션에 주문 추가 (새 세션 생성 안 함)

## BR-T03: 이용 완료 처리 (트랜잭션)
이용 완료는 단일 트랜잭션으로 처리:
1. 현재 세션의 모든 주문 조회
2. 각 주문을 OrderHistory로 복사 (항목 JSON 스냅샷 포함)
3. OrderHistory.expiresAt = 현재 시각 + 90일
4. 현재 세션의 주문 및 주문 항목 삭제
5. TableSession.isActive = false, completedAt = 현재 시각
6. Table.currentSessionId = null
7. SSE 이벤트 발행 (table-completed)

## BR-T04: 이용 완료 시 고객 태블릿 리셋
- 이용 완료 SSE 이벤트 수신 시 고객 태블릿:
  - 장바구니 localStorage 비우기
  - 메뉴 화면으로 자동 리다이렉트
- 구현: SSE 이벤트를 고객 태블릿에도 전송하거나, 다음 API 호출 시 세션 무효 응답으로 처리

## BR-T05: 주문 삭제 (관리자 직권)
- 확인 팝업 필수
- 삭제 후 해당 테이블 총 주문액 재계산
- SSE 이벤트 발행 (order-deleted)
- 삭제된 주문은 OrderHistory에 저장하지 않음

## BR-T06: 과거 주문 내역 조회
- 테이블별 과거 주문 목록 (시간 역순)
- 날짜 필터링 지원 (startDate, endDate)
- expiresAt이 지난 레코드는 조회 대상에서 제외

## BR-T07: 과거 주문 내역 자동 삭제
- 보존 기간: 90일
- expiresAt 기준으로 만료된 레코드 삭제
- 구현: 주기적 배치 또는 조회 시 필터링 (MVP에서는 조회 시 필터링)

## BR-T08: 활성 세션 제약
- 하나의 테이블에 동시에 활성 세션은 최대 1개
- 이전 세션이 완료되지 않은 상태에서 새 세션 시작 불가
