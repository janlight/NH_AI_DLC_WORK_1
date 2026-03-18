# NFR Requirements - Unit 3: order-sse

## 1. 성능 (Performance)

### NFR-PERF-001: 주문 생성 API 응답 시간
- 목표: 1초 이내 (p95)
- 측정: 주문 생성 요청 → 응답 반환까지
- SSE 브로드캐스트는 비동기 처리 (응답 시간에 포함하지 않음)

### NFR-PERF-002: SSE 이벤트 전달 시간
- 목표: 2초 이내 (주문 생성 → 관리자 대시보드 표시)
- 측정: 주문 DB 저장 완료 → SSE 이벤트 클라이언트 수신까지

### NFR-PERF-003: 주문 조회 API 응답 시간
- 목표: 500ms 이내
- 적용: 고객 주문 내역, 관리자 전체 주문 조회

### NFR-PERF-004: 동시 주문 처리
- 방식: 인메모리 큐 (매장별 Promise 기반 순차 처리)
- 목적: 주문번호 시퀀스 충돌 방지, 데이터 일관성 보장
- 구현: 매장별 큐 → 주문 생성 요청을 순차 실행 → 완료 후 다음 요청 처리

---

## 2. 확장성 (Scalability)

### NFR-SCALE-001: SSE 동시 연결
- 제한: 없음 (서버 리소스 허용 범위 내)
- 매장별 클라이언트 풀로 관리
- 연결 수 모니터링은 향후 필요 시 추가

### NFR-SCALE-002: 매장당 동시 주문
- 지원: 매장당 30~100 테이블 동시 주문
- 인메모리 큐로 순차 처리하되, 큐 대기 시간이 응답 시간 목표(1초)를 초과하지 않도록 관리

### NFR-SCALE-003: 멀티 테넌트
- 모든 데이터 접근은 storeId로 필터링
- 매장 간 데이터 격리 보장
- 인메모리 큐도 매장별 독립 운영

---

## 3. 가용성 (Availability)

### NFR-AVAIL-001: SSE 연결 복원
- 클라이언트 재연결: 지수 백오프 (1초~30초), 최대 10회
- 10회 초과 시 수동 재연결 버튼 제공
- 재연결 성공 시 전체 데이터 새로고침

### NFR-AVAIL-002: 주문 데이터 영속성
- 모든 주문은 PostgreSQL에 즉시 저장 (트랜잭션)
- 서버 재시작 시 인메모리 큐/SSE 연결은 초기화되나, 주문 데이터는 DB에 보존

---

## 4. 보안 (Security)

### NFR-SEC-001: API 인증
- 모든 주문 API는 JWT 인증 필수 (Unit 1 authMiddleware 사용)
- 고객 API: customer role 토큰
- 관리자 API: admin role 토큰

### NFR-SEC-002: SSE 엔드포인트 인증
- SSE 연결 시 관리자 JWT 검증 필수
- 토큰 없거나 만료 시 연결 거부 (401)

### NFR-SEC-003: 입력 검증
- 주문 생성: menuId, quantity 타입/범위 검증
- 상태 변경: 유효한 OrderStatus 값만 허용
- SQL Injection 방지: Prisma ORM 파라미터 바인딩 사용

### NFR-SEC-004: 데이터 격리
- storeId 기반 테넌트 격리
- 토큰의 storeId와 요청 URL의 storeId 일치 검증

---

## 5. 신뢰성 (Reliability)

### NFR-REL-001: 트랜잭션 무결성
- 주문 생성 (Order + OrderItem): 단일 트랜잭션
- 주문 삭제 (Order + OrderItem): 단일 트랜잭션
- 실패 시 전체 롤백

### NFR-REL-002: SSE 브로드캐스트 실패 처리
- 개별 클라이언트 전송 실패 시 해당 클라이언트만 제거
- 다른 클라이언트 전송에 영향 없음
- 브로드캐스트 실패가 주문 처리에 영향 없음 (fire-and-forget)

### NFR-REL-003: 인메모리 큐 실패 처리
- 큐 내 개별 주문 처리 실패 시 해당 요청에만 에러 반환
- 큐의 다음 요청은 정상 처리 계속

---

## 6. 유지보수성 (Maintainability)

### NFR-MAINT-001: 로깅
- console.log/error 기본 로깅 (MVP 수준)
- 주문 생성/삭제/상태변경 시 로그 출력
- SSE 연결/해제 시 로그 출력
- 에러 발생 시 스택 트레이스 포함

### NFR-MAINT-002: 테스트
- 단위 테스트: OrderService, SSEService 메서드별 테스트
- API 통합 테스트: 주문 CRUD + 상태 변경 API 엔드포인트 테스트
- 테스트 프레임워크: Jest (또는 Vitest)
- 테스트 커버리지 목표: Service 레이어 80% 이상
