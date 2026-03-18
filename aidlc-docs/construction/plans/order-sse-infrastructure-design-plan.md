# Infrastructure Design Plan - Unit 3: order-sse

## 개요
Functional Design과 NFR Design에서 정의된 논리적 컴포넌트를 실제 인프라 구성으로 매핑합니다.
프로젝트는 Docker Compose 기반 로컬 개발 환경(MVP)입니다.

## 실행 계획

### Part 1: 질문 수집
- [x] Step 1: 설계 산출물 분석
- [x] Step 2: 인프라 결정 질문 생성 및 수집
- [x] Step 3: 답변 분석 → **Unit 1 의존으로 보류 결정**

### Part 2: Infrastructure Design 산출물 생성
- [x] Step 4: infrastructure-design.md 생성 (Unit 1 의존 항목 + Unit 3 고유 요구사항)
- [x] Step 5: deployment-architecture.md → 보류 (Unit 1 완료 후 작성)
- [x] Step 6: 승인 요청

---

## Infrastructure Design 질문

아래 질문에 답변해주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해주세요.

## Question 1
Docker Compose에서 백엔드/프론트엔드 컨테이너 구성을 어떻게 할까요?

A) 단일 컨테이너: 백엔드가 프론트엔드 빌드 결과물도 서빙 (Express static)
B) 분리 컨테이너: 백엔드(Express) + 프론트엔드(Nginx) 각각 별도 컨테이너
C) 개발 모드 전용: 백엔드(nodemon) + 프론트엔드(Vite dev server) 각각 별도 컨테이너, 프로덕션 빌드는 나중에 결정
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
PostgreSQL 데이터 영속성을 어떻게 관리할까요?

A) Docker Volume: named volume으로 DB 데이터 영속화 (컨테이너 재시작 시 데이터 유지)
B) Host Bind Mount: 호스트 디렉토리에 직접 마운트 (데이터 직접 접근 가능)
C) 영속성 없음: 개발 환경이므로 컨테이너 재시작 시 seed 데이터로 초기화
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
프론트엔드에서 백엔드 API 및 SSE 연결 시 프록시 설정을 어떻게 할까요?

A) Vite Proxy: 개발 시 vite.config.js의 proxy 설정으로 /api → 백엔드 포워딩
B) Nginx Reverse Proxy: Nginx 컨테이너가 /api 경로를 백엔드로 프록시
C) CORS 허용: 프록시 없이 프론트엔드에서 백엔드 URL 직접 호출 + CORS 설정
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
Prisma 마이그레이션 실행 시점을 어떻게 할까요?

A) 컨테이너 시작 시 자동 실행: docker-compose entrypoint에서 `prisma migrate deploy` 후 앱 시작
B) 수동 실행: 개발자가 직접 `docker exec`로 마이그레이션 명령 실행
C) 초기 설정 스크립트: `npm run setup` 같은 스크립트로 마이그레이션 + seed 한번에 실행
D) Other (please describe after [Answer]: tag below)

[Answer]: 
