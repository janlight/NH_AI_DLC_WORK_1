# Tech Stack Decisions - Unit 1: core-auth

---

## 핵심 기술 스택 (INCEPTION 단계 결정)

| 영역 | 기술 | 버전 | 결정 시점 |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Requirements Analysis |
| Backend Framework | Express.js | 4.x | Application Design |
| ORM | Prisma | 5.x | Application Design |
| Database | PostgreSQL | 16 | Requirements Analysis |
| Frontend | Vue.js 3 | 3.x | Requirements Analysis |
| State Management | Pinia | 2.x | Application Design |
| CSS | Tailwind CSS | 3.x | Application Design |
| Auth | JWT (jsonwebtoken) | 9.x | Application Design |
| Hashing | bcrypt (bcryptjs) | 2.x | Application Design |
| Container | Docker Compose | 3.8+ | Requirements Analysis |

---

## NFR 단계 추가 결정

### 로깅

| 라이브러리 | 버전 | 용도 |
|---|---|---|
| winston | 3.x | 구조화 로깅 프레임워크 |
| winston-daily-rotate-file | 5.x | 로그 파일 일별 rotation (90일 보존) |
| morgan | 1.x | HTTP 요청 로깅 (winston transport 연동) |

**선택 근거**: winston은 Node.js 생태계에서 가장 널리 사용되는 로깅 프레임워크로, 다양한 transport(콘솔, 파일, 외부 서비스)를 지원하며 JSON 구조화 로깅에 적합합니다.

### 입력 검증

| 라이브러리 | 버전 | 용도 |
|---|---|---|
| joi | 17.x | API 입력 스키마 검증 |

**선택 근거**: Joi는 Express와의 통합이 자연스럽고, 스키마 기반으로 선언적 검증이 가능하며, 에러 메시지 커스터마이징이 풍부합니다.

### 보안

| 라이브러리 | 버전 | 용도 |
|---|---|---|
| helmet | 7.x | HTTP 보안 헤더 설정 |
| cors | 2.x | CORS 정책 관리 |
| express-rate-limit | 7.x | API 레벨 rate limiting (보조) |

### 유틸리티

| 라이브러리 | 버전 | 용도 |
|---|---|---|
| uuid | 9.x | Request ID 생성 |
| dotenv | 16.x | 환경 변수 로드 |

---

## Docker Compose 구성

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tableorder
      POSTGRES_USER: tableorder_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://tableorder_user:${DB_PASSWORD}@postgres:5432/tableorder?connection_limit=20
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: development
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api
```

---

## 의존성 요약

### backend/package.json 주요 의존성

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.0",
    "joi": "^17.0.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.0",
    "morgan": "^1.10.0",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^5.0.0",
    "uuid": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.0.0",
    "nodemon": "^3.0.0"
  }
}
```

### frontend/package.json 주요 의존성

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

---

## 버전 고정 정책

- package.json: 캐럿(^) 범위 지정
- package-lock.json: 정확한 버전 고정, 반드시 커밋
- Dockerfile: Node.js 이미지 태그 고정 (예: `node:20-alpine`, `latest` 금지)
- Docker Compose: PostgreSQL 이미지 태그 고정 (예: `postgres:16-alpine`)
