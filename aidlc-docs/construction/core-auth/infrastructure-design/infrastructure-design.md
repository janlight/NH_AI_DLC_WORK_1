# Infrastructure Design - Unit 1: core-auth

---

## 배포 전략

| 환경 | 전략 |
|---|---|
| 개발 | 로컬 실행 (Node.js + Vite) + DB만 Docker |
| 프로덕션/통합 | Docker Compose (전체 컨테이너화) |

---

## 1. 개발 환경 구성

### Docker Compose (DB 전용)

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: tableorder-db
    environment:
      POSTGRES_DB: tableorder
      POSTGRES_USER: tableorder_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tableorder_user -d tableorder"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 로컬 실행 스크립트

```
터미널 1: docker compose -f docker-compose.dev.yml up -d
터미널 2: cd backend && npm run dev     (nodemon)
터미널 3: cd frontend && npm run dev    (vite)
```

---

## 2. 프로덕션 Docker Compose 구성

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
RUN mkdir -p logs
EXPOSE 3000
CMD ["node", "src/app.js"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### docker-compose.yml (프로덕션)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: tableorder-db
    environment:
      POSTGRES_DB: tableorder
      POSTGRES_USER: tableorder_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tableorder_user -d tableorder"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: tableorder-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://tableorder_user:${DB_PASSWORD}@postgres:5432/tableorder?connection_limit=20
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      CORS_ORIGIN: http://localhost
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - backend_logs:/app/logs
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: tableorder-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  backend_logs:
```

---

## 3. 환경 변수 관리

### .env (루트 - 공통)

```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_chars
```

### backend/.env (개발용)

```env
DATABASE_URL=postgresql://tableorder_user:devpassword@localhost:5432/tableorder?connection_limit=20
JWT_SECRET=dev_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=16h
BCRYPT_SALT_ROUNDS=12
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15
LOG_LEVEL=debug
```

### frontend/.env (개발용)

```env
VITE_API_URL=http://localhost:3000/api
```

### .gitignore 추가 항목

```
.env
backend/.env
frontend/.env
backend/logs/
node_modules/
```

---

## 4. 네트워크 구성

| 환경 | Frontend → Backend | Backend → DB |
|---|---|---|
| 개발 | localhost:5173 → localhost:3000 | localhost:3000 → localhost:5432 |
| 프로덕션 | nginx:80 → backend:3000 (Docker 내부 네트워크) | backend:3000 → postgres:5432 |

---

## 5. 볼륨 구성

| 볼륨 | 용도 | 영속성 |
|---|---|---|
| postgres_data | PostgreSQL 데이터 | 영구 (named volume) |
| backend_logs | 로그 파일 | 영구 (프로덕션만) |
| uploads | 메뉴 이미지 (Unit 2) | 영구 (추후 추가) |
