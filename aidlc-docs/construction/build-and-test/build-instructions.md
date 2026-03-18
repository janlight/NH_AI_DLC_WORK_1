# Build Instructions - All Units

## Prerequisites
- **Node.js**: v18+ (LTS)
- **npm**: v9+
- **Docker & Docker Compose**: 최신 버전
- **Git**: 소스 코드 관리

## 환경 변수

```bash
# backend/.env
DATABASE_URL=postgresql://tableorder_user:password@localhost:5432/tableorder
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png
CLEANUP_CRON_SCHEDULE=0 3 * * *
CLEANUP_BATCH_SIZE=1000
ORDER_HISTORY_RETENTION_DAYS=90
```

## Build Steps

### 1. 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd ../frontend
npm install
```

### 2. 데이터베이스 설정

```bash
# Docker Compose로 PostgreSQL 시작
docker-compose up -d postgres

# Prisma 마이그레이션
cd backend
npx prisma migrate deploy
npx prisma generate

# 시드 데이터
npx prisma db seed
```

### 3. 백엔드 빌드 확인

```bash
cd backend
npm run lint  # lint 설정된 경우
```

### 4. 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드 결과물: `frontend/dist/`

## 확인
- Backend: `http://localhost:3000/api/stores/{storeId}/tables` 응답 확인
- Frontend: `http://localhost:5173` 접속 확인

## Troubleshooting

### Prisma 마이그레이션 실패
- PostgreSQL 컨테이너 실행 확인: `docker ps`
- DATABASE_URL 환경 변수 확인

### 포트 충돌
`.env`에서 `PORT` 값 변경 또는 기존 프로세스 종료
