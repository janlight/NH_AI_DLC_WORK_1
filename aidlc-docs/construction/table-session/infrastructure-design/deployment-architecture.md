# Deployment Architecture - Unit 4: table-session

## 배포 구조

Unit 4는 독립 배포 단위가 아닌, 모놀리스 백엔드/프론트엔드의 일부로 배포됩니다.

```
Docker Compose (Unit 1 관리)
├── backend (Express.js)
│   ├── routes/table.js          ← Unit 4
│   ├── services/tableService.js ← Unit 4
│   ├── jobs/orderHistoryCleanup.js ← Unit 4 (node-cron, 서버 내 실행)
│   └── ... (다른 Unit 모듈)
├── frontend (Vue.js)
│   └── views/admin/TableManageView.vue ← Unit 4
└── postgres (PostgreSQL)
    └── 인덱스: Table, TableSession, OrderHistory ← Unit 4 요구
```

## 배포 시 고려사항

### 코드 통합
- Unit 4 코드는 backend/, frontend/ 디렉토리에 직접 추가
- 별도 빌드/배포 파이프라인 불필요
- Unit 1의 Docker Compose로 전체 앱 빌드 및 실행

### DB 마이그레이션
- Unit 4 인덱스는 Prisma 스키마에 `@@index` 디렉티브로 추가
- `npx prisma migrate dev`로 마이그레이션 생성 및 적용
- Unit 1에서 스키마 관리, Unit 4는 인덱스 요구사항 PR로 전달

### 배치 작업 시작
- `app.js`에서 서버 시작 시 cron job 등록:
```
// app.js (Unit 1 관리)
require('./jobs/orderHistoryCleanup').start()
```

## 모니터링

- 배치 작업 실행 로그: `console.log` (MVP)
- 배치 실패 로그: `console.error`
- 향후 확장: 구조화된 로깅 (winston 등)
