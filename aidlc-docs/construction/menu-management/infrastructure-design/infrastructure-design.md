# Infrastructure Design - Unit 2: menu-management

## 개요

menu-management Unit은 모놀리스 아키텍처 내 논리적 모듈로, Unit 1(core-auth)에서 구축한 공유 인프라 위에서 동작합니다. 별도 컨테이너나 서비스를 추가하지 않으며, 이미지 저장을 위한 Docker volume 설정만 추가합니다.

---

## 1. 공유 인프라 (Unit 1 제공)

| 컴포넌트 | 인프라 | 비고 |
|---|---|---|
| 백엔드 서버 | Express.js (Node.js 컨테이너) | 단일 앱, 라우트 추가 |
| 데이터베이스 | PostgreSQL 16 (컨테이너) | Prisma ORM 사용 |
| 프론트엔드 | Vue.js 3 (개발 서버) | 라우트 추가 |
| 리버스 프록시 | 없음 (개발 환경) | 직접 접근 |

---

## 2. Unit 2 추가 인프라

### 2.1 이미지 저장소

| 항목 | 설정 |
|---|---|
| 저장 방식 | 로컬 파일 시스템 |
| Docker 볼륨 | named volume (`menu-uploads`) |
| 컨테이너 마운트 경로 | `/app/uploads` |
| 디렉토리 구조 | `uploads/{storeId}/menus/` |
| 영속성 | 컨테이너 재시작/삭제 시에도 유지 |

### 2.2 정적 파일 서빙

| 항목 | 설정 |
|---|---|
| 서빙 방식 | Express.static 미들웨어 |
| URL 경로 | `/uploads/*` |
| 캐시 헤더 | `Cache-Control: public, max-age=86400` |
| 보안 | 디렉토리 리스팅 비활성화, dotfiles 차단 |

---

## 3. 데이터베이스 스키마 (Unit 2 추가분)

Unit 1에서 생성한 Prisma schema에 다음 모델을 추가합니다:

### Category 모델
- storeId (FK → Store)
- name, sortOrder
- 인덱스: (storeId, sortOrder), UNIQUE(storeId, name)

### Menu 모델
- storeId (FK → Store), categoryId (FK → Category)
- name, price, description, imageUrl, sortOrder, isActive
- 인덱스: (storeId, isActive, categoryId, sortOrder), (categoryId, isActive)

---

## 4. 네트워크 설정

| 항목 | 설정 |
|---|---|
| 내부 네트워크 | Docker Compose default network |
| 백엔드 포트 | 3000 (Unit 1에서 설정) |
| 프론트엔드 포트 | 5173 (Vite 개발 서버, Unit 1에서 설정) |
| DB 포트 | 5432 (내부 전용) |

menu-management는 별도 포트를 사용하지 않으며, 기존 Express 앱에 라우트를 추가하는 방식입니다.

---

## 5. 환경 변수 (Unit 2 추가분)

| 변수 | 값 | 설명 |
|---|---|---|
| UPLOAD_DIR | /app/uploads | 이미지 업로드 디렉토리 |
| MAX_FILE_SIZE | 5242880 | 최대 파일 크기 (5MB, bytes) |
| ALLOWED_MIME_TYPES | image/jpeg,image/png | 허용 MIME 타입 |

---

## 6. Security Baseline Compliance

| Rule | Status | 비고 |
|---|---|---|
| SECURITY-01 | Compliant | DB 암호화 (Unit 1), TLS는 프로덕션 시 적용 |
| SECURITY-07 | N/A | Docker Compose 로컬 환경, 외부 네트워크 노출 없음 |
| SECURITY-09 | Compliant | 디렉토리 리스팅 비활성화, 에러 메시지 일반화 |
| SECURITY-10 | Compliant | package-lock.json 버전 고정, Dockerfile 버전 명시 |
| 기타 | N/A | 인프라 레벨 보안은 로컬 개발 환경에서 제한적 |
