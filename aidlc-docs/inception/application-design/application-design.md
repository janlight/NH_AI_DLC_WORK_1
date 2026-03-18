# Application Design - 통합 문서

## 기술 스택

| 영역 | 기술 | 선택 근거 |
|---|---|---|
| 백엔드 | Node.js + Express.js | 풍부한 생태계, 미들웨어 패턴 |
| 프론트엔드 | Vue.js 3 + Pinia | 공식 상태 관리, Composition API |
| UI | Tailwind CSS | 유틸리티 기반, 커스텀 디자인 자유도 |
| ORM | Prisma | 타입 안전, 마이그레이션 관리 |
| DB | PostgreSQL | 관계형 DB, 멀티 테넌트 지원 |
| 배포 | Docker Compose | 로컬 개발 환경 |
| 실시간 | SSE (Server-Sent Events) | 단방향 실시간 알림 |
| 인증 | JWT + bcrypt | 토큰 기반 인증, 안전한 해싱 |
| 파일 업로드 | multer + 로컬 파일 시스템 | 이미지 업로드 |

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Vue.js 3    │  │  Express.js  │  │PostgreSQL │  │
│  │  + Pinia     │→ │  + Prisma    │→ │           │  │
│  │  + Tailwind  │  │  + SSE       │  │           │  │
│  │  (Port 5173) │  │  (Port 3000) │  │(Port 5432)│  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                          │                           │
│                    ┌─────┴─────┐                     │
│                    │  uploads/ │                     │
│                    │ (images)  │                     │
│                    └───────────┘                     │
└─────────────────────────────────────────────────────┘
```

## API 설계 원칙

- RESTful URL 구조: `/api/stores/:storeId/...` (멀티 테넌트 명확)
- JWT 인증 미들웨어로 요청 보호
- 고객 API: 테이블 토큰 인증
- 관리자 API: 관리자 토큰 인증 + 역할 확인

## 컴포넌트 요약

| # | 컴포넌트 | 책임 | 상세 |
|---|---|---|---|
| 1 | AuthComponent | 인증/인가 | components.md 참조 |
| 2 | StoreComponent | 매장 관리 | components.md 참조 |
| 3 | MenuComponent | 메뉴 CRUD + 이미지 | components.md 참조 |
| 4 | TableComponent | 테이블 + 세션 관리 | components.md 참조 |
| 5 | OrderComponent | 주문 처리 | components.md 참조 |
| 6 | SSEComponent | 실시간 알림 | components.md 참조 |

## 서비스 요약

| # | 서비스 | 핵심 오케스트레이션 | 상세 |
|---|---|---|---|
| 1 | AuthService | 로그인 → 검증 → JWT 발급 | services.md 참조 |
| 2 | MenuService | 메뉴 CRUD + 이미지 업로드 | services.md 참조 |
| 3 | TableService | 세션 라이프사이클 + 이용 완료 | services.md 참조 |
| 4 | OrderService | 주문 생성 → SSE 알림 | services.md 참조 |
| 5 | SSEService | 매장별 클라이언트 풀 + 브로드캐스트 | services.md 참조 |

## 상세 문서 참조
- [components.md](./components.md) - 컴포넌트 정의 및 인터페이스
- [component-methods.md](./component-methods.md) - 메서드 시그니처
- [services.md](./services.md) - 서비스 정의 및 오케스트레이션
- [component-dependency.md](./component-dependency.md) - 의존성 및 데이터 흐름
