# Services

## 서비스 레이어 아키텍처

```
[Vue.js Frontend] → [Express.js API Routes] → [Service Layer] → [Prisma ORM] → [PostgreSQL]
                                                     ↓
                                              [SSE Manager]
```

---

## 1. AuthService

**책임**: 인증/인가 비즈니스 로직 오케스트레이션

**오케스트레이션 패턴**:
- 테이블 로그인: 매장 검증 → 테이블 검증 → 비밀번호 확인 → rate limit 확인 → JWT 발급
- 관리자 로그인: 매장 검증 → 사용자 검증 → 비밀번호 확인 → rate limit 확인 → JWT 발급

**의존성**: Prisma Client, bcrypt, jsonwebtoken

---

## 2. MenuService

**책임**: 메뉴 CRUD 비즈니스 로직 오케스트레이션

**오케스트레이션 패턴**:
- 메뉴 등록: 입력 검증 → 카테고리 확인 → 메뉴 생성 → 순서 할당
- 이미지 업로드: 파일 검증 → 로컬 저장 → URL 업데이트

**의존성**: Prisma Client, multer (파일 업로드)

---

## 3. TableService

**책임**: 테이블 및 세션 라이프사이클 관리

**오케스트레이션 패턴**:
- 이용 완료: 현재 주문 조회 → OrderHistory로 이동 → 현재 주문 삭제 → 세션 종료 → 테이블 리셋 (트랜잭션)

**의존성**: Prisma Client, OrderService

---

## 4. OrderService

**책임**: 주문 처리 비즈니스 로직 오케스트레이션

**오케스트레이션 패턴**:
- 주문 생성: 세션 확인 → 메뉴 유효성 검증 → 주문 저장 → SSE 알림 발송
- 상태 변경: 주문 확인 → 상태 업데이트 → SSE 알림 발송
- 주문 삭제: 주문 확인 → 삭제 → 총액 재계산 → SSE 알림 발송

**의존성**: Prisma Client, SSEService

---

## 5. SSEService

**책임**: 실시간 이벤트 스트림 관리

**오케스트레이션 패턴**:
- 연결: 매장별 클라이언트 풀 관리 → keep-alive 전송
- 브로드캐스트: 매장 ID로 클라이언트 필터 → 이벤트 전송
- 정리: 연결 끊김 감지 → 클라이언트 풀에서 제거

**의존성**: 없음 (인메모리 클라이언트 관리)

---

## 이벤트 흐름

| 이벤트 | 트리거 | SSE 이벤트명 | 수신자 |
|---|---|---|---|
| 신규 주문 | 고객 주문 생성 | `new-order` | 관리자 대시보드 |
| 상태 변경 | 관리자 상태 업데이트 | `order-status` | 관리자 대시보드 |
| 주문 삭제 | 관리자 주문 삭제 | `order-deleted` | 관리자 대시보드 |
| 테이블 완료 | 관리자 이용 완료 | `table-completed` | 관리자 대시보드 |
