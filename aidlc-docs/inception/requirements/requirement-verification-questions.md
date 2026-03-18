# Requirements Verification Questions

테이블오더 서비스 요구사항을 분석한 결과, 아래 항목들에 대한 확인이 필요합니다.
각 질문의 [Answer]: 태그 뒤에 선택지 알파벳을 입력해주세요.

---

## Question 1: 기술 스택 - 백엔드
백엔드 서버 기술 스택으로 어떤 것을 사용하시겠습니까?

A) Node.js (Express/Fastify)
B) Python (FastAPI/Django)
C) Java (Spring Boot)
D) Go
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2: 기술 스택 - 프론트엔드
고객용/관리자용 프론트엔드 기술 스택으로 어떤 것을 사용하시겠습니까?

A) React
B) Vue.js
C) Next.js (React 기반 풀스택)
D) Svelte
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3: 데이터베이스
데이터 저장소로 어떤 데이터베이스를 사용하시겠습니까?

A) PostgreSQL
B) MySQL
C) DynamoDB (AWS NoSQL)
D) MongoDB
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: 배포 환경
서비스 배포 환경은 어떻게 계획하고 계십니까?

A) AWS 클라우드 (EC2, ECS, Lambda 등)
B) 로컬/온프레미스 서버
C) Docker Compose 기반 로컬 개발 환경만 (배포는 추후 결정)
D) Vercel/Netlify (프론트) + AWS (백엔드)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5: 매장 규모
하나의 서비스 인스턴스가 지원해야 하는 매장 수는 어느 정도입니까?

A) 단일 매장 (1개 매장 전용)
B) 소규모 멀티 매장 (2~10개)
C) 중규모 멀티 매장 (10~100개)
D) 대규모 SaaS (100개 이상)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 6: 테이블 수
매장당 관리해야 하는 테이블 수는 대략 어느 정도입니까?

A) 소규모 (1~10개)
B) 중규모 (10~30개)
C) 대규모 (30~100개)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7: 이미지 저장
메뉴 이미지 관리 방식은 어떻게 하시겠습니까?

A) 외부 URL 링크만 사용 (이미지 업로드 기능 없음)
B) 서버 로컬 파일 시스템에 업로드
C) AWS S3 등 클라우드 스토리지에 업로드
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8: 고객용/관리자용 앱 분리
고객용 인터페이스와 관리자용 인터페이스를 어떻게 구성하시겠습니까?

A) 하나의 프론트엔드 앱에서 라우팅으로 분리
B) 별도의 프론트엔드 앱 2개로 분리
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9: 초기 데이터
개발 및 테스트를 위한 초기 데이터(시드 데이터)가 필요합니까?

A) 예 - 샘플 매장, 메뉴, 테이블 데이터 포함
B) 아니오 - 빈 상태로 시작하고 관리자가 직접 등록
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10: 관리자 계정 생성
매장 관리자 계정은 어떻게 생성됩니까?

A) 시스템 초기화 시 기본 관리자 계정 자동 생성 (시드 데이터)
B) 별도의 슈퍼 관리자가 매장 관리자 계정을 생성
C) 관리자 회원가입 기능 제공
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11: Security Extensions
이 프로젝트에 보안 확장 규칙(Security Extension Rules)을 적용하시겠습니까?

A) Yes — 모든 SECURITY 규칙을 blocking constraint로 적용 (프로덕션 수준 애플리케이션에 권장)
B) No — SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---
