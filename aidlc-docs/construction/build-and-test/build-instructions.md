# Build Instructions - Unit 3: order-sse

## Prerequisites
- **Node.js**: v18+ (LTS)
- **npm**: v9+
- **Docker & Docker Compose**: (Unit 1에서 구성, PostgreSQL 실행용)
- **Git**: 소스 코드 관리

## 환경 변수

```bash
# backend/.env (Unit 1에서 생성, 아래는 Unit 3에서 필요한 항목)
DATABASE_URL=postgresql://user:password@localhost:5432/tableorder
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3000
```

## Build Steps

### 1. 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd frontend
npm install
```

Unit 3에서 추가로 필요한 패키지:

```bash
# 백엔드 (Unit 1에서 이미 설치되어 있을 수 있음)
cd backend
npm install express uuid
npm install -D jest supertest

# 프론트엔드 (Unit 1에서 이미 설치되어 있을 수 있음)
cd frontend
npm install vue pinia axios vue-router
npm install -D jest @vue/test-utils
```

### 2. 데이터베이스 설정

```bash
# Docker Compose로 PostgreSQL 시작 (Unit 1에서 구성)
docker-compose up -d postgres

# Prisma 마이그레이션 실행 (Unit 1에서 스키마 관리)
cd backend
npx prisma migrate deploy
npx prisma generate

# 시드 데이터 (Unit 1에서 관리)
npx prisma db seed
```

### 3. 백엔드 빌드 확인

```bash
cd backend
# 문법 검증 (lint가 설정된 경우)
npm run lint

# 서버 시작 테스트
node -e "require('./src/services/orderQueueService'); console.log('orderQueueService OK')"
node -e "require('./src/services/sseService'); console.log('sseService OK')"
node -e "require('./src/services/orderService'); console.log('orderService OK')"
node -e "require('./src/routes/orderRoutes'); console.log('orderRoutes OK')"
node -e "require('./src/routes/sseRoutes'); console.log('sseRoutes OK')"
```

### 4. 프론트엔드 빌드

```bash
cd frontend
npm run build
```

- 빌드 결과물: `frontend/dist/`
- 빌드 성공 시 에러 없이 완료

## Unit 1 통합 시 추가 작업

1. `backend/src/app.js`에 라우터 등록:
```javascript
const { router: orderRouter, setPrisma } = require('./routes/orderRoutes');
const { router: sseRouter } = require('./routes/sseRoutes');

// Prisma 주입
setPrisma(prisma);

// 라우터 등록 (authMiddleware 적용)
app.use('/api/stores/:storeId', authMiddleware('customer'), orderRouter);
app.use('/api/stores/:storeId', authMiddleware('admin'), sseRouter);
```

2. `frontend/src/router/index.js`에 라우트 추가:
```javascript
{ path: '/customer/cart', component: () => import('./views/customer/CartView.vue') },
{ path: '/customer/orders', component: () => import('./views/customer/OrderView.vue') },
{ path: '/admin/dashboard', component: () => import('./views/admin/DashboardView.vue') }
```

## Troubleshooting

### uuid 모듈 없음
```bash
npm install uuid
```

### Prisma Client 생성 안됨
```bash
npx prisma generate
```

### 포트 충돌
`.env`에서 `PORT` 값을 변경하거나 기존 프로세스 종료
