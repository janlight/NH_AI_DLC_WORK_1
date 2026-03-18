# Tech Stack Decisions - Unit 4: table-session

## 공통 기술 스택 (Unit 1에서 결정)

| 영역 | 기술 | Unit 4 활용 |
|---|---|---|
| 런타임 | Node.js | Express 라우트, 서비스 |
| 프레임워크 | Express.js | API 라우트 정의 |
| ORM | Prisma | 트랜잭션, 낙관적 잠금 |
| DB | PostgreSQL | 테이블/세션/이력 저장 |
| 프론트엔드 | Vue.js 3 + Pinia | TableManageView |
| UI | Tailwind CSS | 컴포넌트 스타일링 |

## Unit 4 고유 기술 결정

### 1. 트랜잭션 관리
- **선택**: Prisma Interactive Transactions (`$transaction`)
- **설정**: `timeout: 60000` (60초)
- **근거**: 이용 완료 시 다수 주문 이력 이동이 필요하며, 대량 주문 시나리오 대응

### 2. 낙관적 잠금
- **선택**: TableSession.version 필드 + Prisma `update WHERE`
- **구현**: `prisma.tableSession.update({ where: { id, version }, data: { version: { increment: 1 } } })`
- **근거**: 이용 완료/주문 생성 동시 발생은 드문 케이스이므로 낙관적 잠금이 적합

### 3. 배치 작업 (과거 내역 삭제)
- **선택**: node-cron
- **스케줄**: `0 3 * * *` (매일 03:00)
- **배치 크기**: 1000건씩 삭제 (DB 부하 방지)
- **근거**: 별도 인프라 없이 앱 내에서 실행 가능, MVP에 적합

### 4. DB 인덱스 전략
- `Table(storeId)` - 매장별 테이블 조회
- `TableSession(tableId, isActive)` - 활성 세션 조회
- `OrderHistory(storeId, tableId, expiresAt)` - 과거 내역 조회 + 만료 삭제
- `OrderHistory(expiresAt)` - 배치 삭제 대상 조회

### 5. Unit 3 의존성 통신
- **방식**: 직접 함수 import (모놀리스 내부)
- **인터페이스**: OrderService, SSEService를 import하여 호출
- **근거**: 동일 프로세스 내 모듈 간 통신, 별도 프로토콜 불필요
