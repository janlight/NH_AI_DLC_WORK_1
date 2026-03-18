# Infrastructure Design Plan - Unit 1: core-auth

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: 설계 산출물 분석
- [x] Step 2: 인프라 설계 계획 수립
- [x] Step 3: 질문 생성
- [x] Step 4: 사용자 답변 수집
- [x] Step 5: 답변 분석 (Q1=B - 모호함 없음)

### Part 2: 생성
- [x] Step 6: infrastructure-design.md 생성
- [x] Step 7: deployment-architecture.md 생성
- [x] Step 8: 검증 및 승인 요청 - 승인 완료

---

## 설계 범위

Requirements Analysis에서 Docker Compose 로컬 배포로 결정되었으므로, 인프라 설계는 다음에 집중합니다:
- Docker Compose 서비스 구성 (PostgreSQL, Backend, Frontend)
- Dockerfile 설계 (Backend, Frontend)
- 볼륨 및 네트워크 설정
- 환경 변수 관리 전략

---

## 질문

### Q1: 개발 환경 핫 리로드
개발 시 코드 변경 시 자동 반영(핫 리로드)을 어떻게 구성할까요?

- A) Docker 볼륨 마운트 + nodemon/vite (컨테이너 내에서 핫 리로드)
- B) 로컬에서 직접 실행 (npm run dev), DB만 Docker (가장 빠른 개발 경험)
- C) Other (please describe after [Answer]: tag below)

[Answer]: B

