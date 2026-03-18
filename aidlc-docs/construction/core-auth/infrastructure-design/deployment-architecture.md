# Deployment Architecture - Unit 1: core-auth

---

## 개발 환경 아키텍처

```
+------------------------------------------+
|            Developer Machine              |
|                                           |
|  +-------------+    +----------------+    |
|  | Vite Dev    |    | Node.js        |    |
|  | Server      |--->| Express        |    |
|  | (port 5173) |    | + nodemon      |    |
|  |             |    | (port 3000)    |    |
|  +-------------+    +-------+--------+    |
|                             |             |
|                     +-------v--------+    |
|                     | Docker         |    |
|                     | PostgreSQL 16  |    |
|                     | (port 5432)    |    |
|                     | [volume mount] |    |
|                     +----------------+    |
+------------------------------------------+
```

**개발 시작 순서**:
1. `docker compose -f docker-compose.dev.yml up -d` (DB 시작)
2. `cd backend && npx prisma migrate dev` (스키마 적용)
3. `cd backend && npx prisma db seed` (시드 데이터, 최초 1회)
4. `cd backend && npm run dev` (백엔드 시작)
5. `cd frontend && npm run dev` (프론트엔드 시작)

---

## 프로덕션 환경 아키텍처

```
+--------------------------------------------------+
|               Docker Compose                      |
|                                                   |
|  +------------+  +-------------+  +------------+  |
|  | nginx      |  | Node.js     |  | PostgreSQL |  |
|  | (Frontend) |->| Express     |->| 16-alpine  |  |
|  | port 80    |  | port 3000   |  | port 5432  |  |
|  | static     |  | [logs vol]  |  | [data vol] |  |
|  | files      |  |             |  |            |  |
|  +------------+  +-------------+  +------------+  |
|                                                   |
|  Internal Network: tableorder-net                 |
+--------------------------------------------------+
```

**프로덕션 배포 순서**:
1. `.env` 파일에 프로덕션 시크릿 설정
2. `docker compose build` (이미지 빌드)
3. `docker compose up -d` (전체 서비스 시작)
4. `docker compose exec backend npx prisma migrate deploy` (마이그레이션)
5. `docker compose exec backend node prisma/seed.js` (시드, 최초 1회)

---

## Frontend nginx 설정

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Vue.js SPA - 모든 경로를 index.html로
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE 프록시 (긴 연결 유지)
    location /api/stores/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 보안 헤더
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

---

## package.json 스크립트

### backend/package.json

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "migrate": "npx prisma migrate dev",
    "migrate:deploy": "npx prisma migrate deploy",
    "seed": "node prisma/seed.js",
    "test": "jest --coverage",
    "lint": "eslint src/"
  }
}
```

### frontend/package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "lint": "eslint src/"
  }
}
```

---

## Node.js 버전 통일

```
# .nvmrc (루트)
20
```

팀원 모두 `nvm use`로 동일 버전 사용.
