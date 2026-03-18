# Build Instructions - Unit 4: table-session

## Prerequisites
- **Node.js**: v18+
- **npm**: v9+
- **Docker & Docker Compose**: 최신 버전
- **PostgreSQL**: Docker Compose로 제공

## 환경 변수

```bash
# .env (table-order/ 루트)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tableorder
JWT_SECRET=your-secret-key
CLEANUP_CRON_SCHEDULE=0 3 * * *
CLEANUP_BATCH_SIZE=1000
ORDER_HISTORY_RETENTION_DAYS=90
```

## Build Steps

### 1. 프로젝트 루트 이동
```bash
cd table-order
```

### 2. Backend 의존성 설치
```bash
cd backend
npm install
npm install express @prisma/client bcrypt jsonwebtoken node-cron
npm install -D jest supertest prisma
```

### 3. Frontend 의존성 설치
```bash
cd ../frontend
npm install
npm install vue@3 vue-router@4 pinia axios
npm install -D vitest @vue/test-utils jsdom
```

### 4. Docker Compose로 DB 기동
```bash
cd ..
docker-compose up -d postgres
```

### 5. Prisma 마이그레이션 (Unit 1 스키마 필요)
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 6. Backend 서버 시작
```bash
npm start
# 또는 개발 모드: npm run dev
```

### 7. Frontend 개발 서버 시작
```bash
cd ../frontend
npm run dev
```

## 빌드 확인
- Backend: `http://localhost:3000/api/stores/{storeId}/tables` 응답 확인
- Frontend: `http://localhost:5173` 접속 확인

## Troubleshooting

### Prisma 마이그레이션 실패
- PostgreSQL 컨테이너가 실행 중인지 확인: `docker ps`
- DATABASE_URL 환경 변수 확인

### 포트 충돌
- 3000 또는 5173 포트 사용 중인 프로세스 종료: `lsof -i :3000`
