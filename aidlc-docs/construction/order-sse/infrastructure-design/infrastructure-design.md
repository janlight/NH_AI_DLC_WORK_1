# Infrastructure Design - Unit 3: order-sse

## 상태: Unit 1 의존 - 보류

> ⚠️ 인프라 결정의 대부분은 Unit 1 (core-auth)에서 구축하는 기반 인프라에 의존합니다.
> Unit 1 개발 완료 후 실제 구조를 확인하고 결정합니다.

---

## Unit 1 의존 항목 (보류)

| 항목 | 설명 | Unit 1 결정 사항 |
|---|---|---|
| Docker Compose 구성 | 컨테이너 분리/통합 방식 | docker-compose.yml |
| PostgreSQL 설정 | 데이터 영속성, 볼륨 | DB 컨테이너 설정 |
| 프록시 설정 | API/SSE 프록시 방식 | Vite/Nginx 설정 |
| Prisma 마이그레이션 | 실행 시점, 전략 | schema.prisma, seed.js |
| Express 앱 구조 | app.js, 글로벌 미들웨어 | 앱 진입점, 라우터 등록 방식 |
| 환경 변수 | DB URL, JWT Secret 등 | .env 파일 구조 |

---

## Unit 3 고유 인프라 요구사항

### 1. SSE 프록시 버퍼링 비활성화
- SSE 연결 시 프록시(Nginx 등)의 응답 버퍼링을 비활성화해야 함
- Express 응답 헤더에 `X-Accel-Buffering: no` 설정 (sseService에서 처리)
- Unit 1이 Nginx를 사용할 경우, SSE 엔드포인트에 대한 `proxy_buffering off` 설정 필요

### 2. SSE 연결 타임아웃
- 프록시/로드밸런서의 유휴 연결 타임아웃이 heartbeat 간격(30초)보다 길어야 함
- Unit 1이 Nginx를 사용할 경우: `proxy_read_timeout 120s` 이상 권장

### 3. 인메모리 상태
- OrderQueueService, SSEService의 클라이언트 풀은 인메모리 상태
- 서버 재시작 시 초기화됨 (DB 데이터는 보존)
- 단일 인스턴스 환경 전제 (멀티 인스턴스 시 Redis 등 필요)

---

## Unit 1 개발 완료 후 확인/조정 사항

1. **docker-compose.yml**: Unit 3 서비스가 별도 컨테이너인지, 동일 백엔드 컨테이너인지 확인
2. **프록시 설정**: SSE 엔드포인트(`/api/stores/:storeId/events`)에 대한 버퍼링 비활성화 설정 추가
3. **환경 변수**: Unit 3에서 필요한 환경 변수가 .env에 포함되어 있는지 확인
4. **라우터 등록**: app.js에서 Unit 3 라우터 등록 방식 확인 및 적용
5. **에러 핸들러**: Unit 1의 globalErrorHandler와 Unit 3의 에러 응답 형식 호환성 확인
