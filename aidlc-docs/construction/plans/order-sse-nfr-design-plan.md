# NFR Design Plan - Unit 3: order-sse

## 개요
NFR Requirements에서 정의된 비기능 요구사항을 구체적인 설계 패턴과 논리적 컴포넌트로 변환합니다.

## 실행 계획

### Part 1: 질문 수집
- [x] Step 1: NFR Requirements 분석
- [x] Step 2: 설계 결정 질문 생성 및 수집
- [x] Step 3: 답변 분석 (모호함/모순 검증)

### Part 2: NFR Design 산출물 생성
- [x] Step 4: nfr-design-patterns.md 생성 (복원력, 성능, 보안 패턴)
- [x] Step 5: logical-components.md 생성 (논리적 컴포넌트 설계)
- [ ] Step 6: 승인 요청

---

## NFR Design 질문

아래 질문에 답변해주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해주세요.

## Question 1
SSE 브로드캐스트 실패 시 복원력 패턴을 어떻게 설계할까요?

A) Fire-and-Forget: 전송 실패 시 해당 클라이언트만 제거하고 로그만 남김 (현재 NFR 요구사항 그대로)
B) Retry-Once: 전송 실패 시 1회 재시도 후 실패하면 클라이언트 제거
C) Dead Letter Queue: 전송 실패 이벤트를 별도 저장하여 클라이언트 재연결 시 재전송
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
인메모리 주문 큐의 성능 보호 패턴을 어떻게 설계할까요?

A) 큐 길이 제한 없음 + 타임아웃만 적용: 개별 주문 처리에 5초 타임아웃, 큐 크기는 제한하지 않음
B) 큐 길이 제한 + 타임아웃: 매장당 큐 최대 50개 대기, 초과 시 429 Too Many Requests 반환 + 개별 5초 타임아웃
C) 큐 길이 제한 + 타임아웃 + 모니터링: B안 + 큐 길이가 임계값(30개) 초과 시 경고 로그 출력
D) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 3
API 입력 검증 패턴을 어떻게 구현할까요?

A) 라우트 핸들러 내 직접 검증: if문으로 각 필드 타입/범위 직접 체크
B) 검증 미들웨어 패턴: express-validator 또는 Joi 같은 라이브러리로 스키마 기반 검증
C) 커스텀 검증 유틸리티: 자체 validate 함수를 만들어 재사용 가능한 검증 로직 구성
D) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4
에러 응답 형식을 어떻게 표준화할까요?

A) 간단한 형식: `{ error: "에러 메시지" }` (MVP에 적합)
B) 구조화된 형식: `{ error: { code: "ORDER_NOT_FOUND", message: "주문을 찾을 수 없습니다", details: {} } }`
C) HTTP Problem Details (RFC 7807): `{ type, title, status, detail, instance }` 표준 형식
D) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 5
서비스 레이어의 에러 처리 패턴을 어떻게 설계할까요?

A) 직접 throw: 서비스에서 적절한 HTTP 상태 코드와 메시지를 가진 에러를 직접 throw, 라우터에서 try-catch
B) Result 패턴: 서비스가 `{ success, data, error }` 형태의 결과 객체를 반환, 라우터에서 분기 처리
C) 커스텀 에러 클래스: AppError, NotFoundError, ValidationError 등 에러 클래스 정의 + 글로벌 에러 핸들러 미들웨어
D) Other (please describe after [Answer]: tag below)

[Answer]: b
