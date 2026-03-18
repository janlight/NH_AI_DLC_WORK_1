# 테이블오더 (Table Order SaaS Platform)

매장 내 테이블에서 QR 코드 또는 테이블 번호로 로그인하여 메뉴 조회, 주문, 실시간 주문 현황 확인이 가능한 SaaS 플랫폼입니다.

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Node.js 20, Express 4, Prisma ORM |
| Frontend | Vue.js 3, Pinia, Vue Router, Tailwind CSS |
| Database | PostgreSQL 16 |
| Infra | Docker, Docker Compose, Nginx |
| Test | Jest (Backend), Vitest (Frontend) |

## 프로젝트 구조

```
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express 앱 엔트리
│   │   ├── routes/                # API 라우트
│   │   │   ├── auth.js            # 인증 (테이블/관리자 로그인)
│   │   │   ├── menu.js            # 메뉴 CRUD
│   │   │   ├── orderRoutes.js     # 주문 CRUD
│   │   │   ├── sseRoutes.js       # SSE 실시간 이벤트
│   │   │   └── table.js           # 테이블 관리
│   │   ├── services/              # 비즈니스 로직
│   │   ├── middleware/            # 인증, 에러 처리
│   │   ├── utils/                 # 로거, 에러 클래스
│   │   └── validators/           # 입력 검증
│   ├── prisma/
│   │   ├── schema.prisma          # DB 스키마
│   │   └── seed.js                # 시드 데이터
│   └── tests/                     # Jest 테스트
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── customer/          # 고객 화면 (로그인, 메뉴, 장바구니, 주문)
│       │   └── admin/             # 관리자 화면 (로그인, 대시보드, 메뉴관리, 테이블관리)
│       ├── stores/                # Pinia 상태관리
│       ├── composables/           # useSSE (실시간 이벤트)
│       └── api/                   # Axios API 클라이언트
├── docker-compose.yml
└── .env.example
```

## 사전 요구사항

- Node.js 20+
- Docker & Docker Compose
- Git

---

## 로컬 개발 환경 실행

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 값을 설정합니다:

```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_at_least_32_characters
```

Backend용 `.env`도 생성합니다:

```bash
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://tableorder_user:your_secure_password@localhost:5432/tableorder
JWT_SECRET=your_jwt_secret_key_at_least_32_characters
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png
EOF
```

### 2. PostgreSQL 실행

```bash
docker-compose up -d postgres
```

DB 헬스체크 확인:

```bash
docker ps  # tableorder-db STATUS가 healthy인지 확인
```

### 3. Backend 실행

```bash
cd backend
npm install
npx prisma migrate dev      # 마이그레이션 실행
npx prisma db seed           # 시드 데이터 생성
npm run dev                  # nodemon 개발 서버 (http://localhost:3000)
```

### 4. Frontend 실행

```bash
cd frontend
npm install
npm run dev                  # Vite 개발 서버 (http://localhost:5173)
```

API 프록시가 설정되어 있어 `/api/*` 요청은 자동으로 `localhost:3000`으로 전달됩니다.

---

## Docker Compose 전체 실행 (프로덕션)

```bash
cp .env.example .env
# .env 파일에 DB_PASSWORD, JWT_SECRET 설정

docker-compose up -d --build
```

| 서비스 | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

종료:

```bash
docker-compose down
```

데이터 포함 완전 삭제:

```bash
docker-compose down -v
```

---

## 시드 데이터 (기본 계정)

| 항목 | 값 |
|---|---|
| 매장 slug | `sample-store` |
| 관리자 ID | `admin` |
| 관리자 비밀번호 | `admin1234` |
| 테이블 번호 | 1~5 |
| 테이블 비밀번호 | `1234` |
| 샘플 메뉴 | 9개 (메인메뉴, 사이드, 음료, 디저트) |

---

## 테스트 실행

### Backend 테스트 (Jest)

```bash
cd backend
npm test                     # 전체 테스트 + 커버리지
npx jest --verbose           # 상세 출력
```

### Frontend 테스트 (Vitest)

```bash
cd frontend
npm test                     # 전체 테스트 (vitest --run)
npx vitest --run --reporter=verbose   # 상세 출력
```

---

## 주요 API 엔드포인트

### 인증

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/auth/table-login` | 테이블 로그인 |
| POST | `/api/auth/admin-login` | 관리자 로그인 |

### 메뉴

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/stores/:storeId/menus` | 메뉴 목록 조회 |
| POST | `/api/stores/:storeId/menus` | 메뉴 생성 (관리자) |
| PUT | `/api/stores/:storeId/menus/:id` | 메뉴 수정 (관리자) |
| DELETE | `/api/stores/:storeId/menus/:id` | 메뉴 삭제 (관리자) |

### 주문

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/stores/:storeId/tables/:tableId/orders` | 주문 생성 |
| GET | `/api/stores/:storeId/tables/:tableId/orders` | 테이블 주문 조회 |
| GET | `/api/stores/:storeId/orders` | 매장 전체 주문 (관리자) |
| PATCH | `/api/stores/:storeId/orders/:id/status` | 주문 상태 변경 (관리자) |
| DELETE | `/api/stores/:storeId/orders/:id` | 주문 삭제 (관리자) |

### SSE (실시간 이벤트)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/stores/:storeId/events` | SSE 연결 (관리자 대시보드) |

### 테이블 관리

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/stores/:storeId/tables` | 테이블 목록 |
| POST | `/api/stores/:storeId/tables` | 테이블 생성 |
| POST | `/api/stores/:storeId/tables/:id/complete` | 이용 완료 |
| GET | `/api/stores/:storeId/tables/:id/history` | 주문 이력 |
| DELETE | `/api/stores/:storeId/tables/:tableId/orders/:orderId` | 개별 주문 삭제 |

### 헬스체크

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 확인 |

---

## 주요 npm 스크립트

### Backend (`backend/`)

| 스크립트 | 명령어 | 설명 |
|---|---|---|
| `npm run dev` | `nodemon src/app.js` | 개발 서버 (자동 재시작) |
| `npm start` | `node src/app.js` | 프로덕션 서버 |
| `npm test` | `jest --coverage` | 테스트 + 커버리지 |
| `npm run migrate` | `npx prisma migrate dev` | DB 마이그레이션 |
| `npm run seed` | `node prisma/seed.js` | 시드 데이터 |

### Frontend (`frontend/`)

| 스크립트 | 명령어 | 설명 |
|---|---|---|
| `npm run dev` | `vite` | 개발 서버 (HMR) |
| `npm run build` | `vite build` | 프로덕션 빌드 |
| `npm run preview` | `vite preview` | 빌드 미리보기 |
| `npm test` | `vitest --run` | 테스트 실행 |
