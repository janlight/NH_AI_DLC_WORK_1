# Unit of Work Plan

## 실행 체크리스트

### Part 1: 계획
- [x] Step 1: 분해 계획 수립
- [x] Step 2: 질문 생성
- [x] Step 3: 사용자 답변 수집
- [x] Step 4: 답변 분석 (모호함/모순 없음)
- [x] Step 5: 계획 승인 (답변 명확하여 바로 생성 진행)

### Part 2: 생성
- [x] Step 6: unit-of-work.md 생성
- [x] Step 7: unit-of-work-dependency.md 생성
- [x] Step 8: unit-of-work-story-map.md 생성
- [x] Step 9: 검증 및 승인 요청 - 승인 완료 (2026-03-18T14:40:22+09:00)

---

## 분해 전략

이 프로젝트는 **단일 앱 라우팅** 방식(모놀리스)으로 결정되었으므로, 하나의 Unit of Work 내에서 논리적 모듈로 분리합니다.

### 예상 구조
```
table-order/
├── backend/          # Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── middleware/   # 인증, 에러 처리
│   │   └── sse/          # SSE 관리
│   ├── prisma/           # 스키마, 마이그레이션, 시드
│   └── uploads/          # 이미지 저장
├── frontend/         # Vue.js 3 + Pinia + Tailwind
│   └── src/
│       ├── views/        # 페이지 컴포넌트
│       ├── components/   # 재사용 컴포넌트
│       ├── stores/       # Pinia 스토어
│       ├── router/       # Vue Router
│       └── api/          # API 클라이언트
└── docker-compose.yml
```

---

## 질문

### Q1: 코드 디렉토리 구조
위 예상 구조대로 backend/frontend 분리 방식으로 진행할까요?

- A) 위 구조대로 진행 (권장)
- B) 다른 구조 제안 (직접 설명)

[Answer]: A

### Q2: 개발 순서 우선순위
어떤 모듈부터 개발을 시작할까요?

- A) 백엔드 우선 (DB 스키마 → API → 프론트엔드) (권장)
- B) 프론트엔드 우선 (UI → Mock API → 실제 API 연동)
- C) 풀스택 동시 (백엔드/프론트엔드 병렬 개발)

[Answer]: A

---

## 필수 산출물
- [x] `aidlc-docs/inception/application-design/unit-of-work.md`
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
