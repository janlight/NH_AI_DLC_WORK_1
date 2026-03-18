# Deployment Architecture - Unit 2: menu-management

## Docker Compose 구성 (Unit 2 추가분)

menu-management는 별도 컨테이너를 추가하지 않습니다. Unit 1에서 생성한 docker-compose.yml에 volume 설정만 추가합니다.

### docker-compose.yml 변경사항

```yaml
# Unit 1에서 생성한 기존 서비스에 volume 추가
services:
  backend:
    # ... (Unit 1 설정 유지)
    volumes:
      - menu-uploads:/app/uploads    # Unit 2 추가
    environment:
      # ... (Unit 1 환경 변수 유지)
      - UPLOAD_DIR=/app/uploads       # Unit 2 추가
      - MAX_FILE_SIZE=5242880         # Unit 2 추가

volumes:
  postgres-data:    # Unit 1
  menu-uploads:     # Unit 2 추가
    driver: local
```

---

## 배포 아키텍처 다이어그램

### Text Alternative
```
Docker Compose Environment
+--------------------------------------------------+
|                                                  |
|  [frontend]        [backend]        [postgres]   |
|  Vue.js :5173      Express :3000    PG :5432     |
|                        |                |        |
|                        +--- Prisma -----+        |
|                        |                         |
|                   [menu-uploads]                  |
|                   Named Volume                   |
|                   /app/uploads/                   |
|                                                  |
+--------------------------------------------------+
```

---

## 컨테이너별 역할 (Unit 2 관점)

| 컨테이너 | Unit 2 역할 | 변경사항 |
|---|---|---|
| backend | 메뉴 API 라우트 처리, 이미지 업로드/서빙 | 라우트 추가, volume 마운트 |
| frontend | MenuView, MenuManageView 페이지 | 라우트/컴포넌트 추가 |
| postgres | Category, Menu 테이블 | Prisma migration |

---

## 볼륨 관리

### menu-uploads 볼륨

| 항목 | 설정 |
|---|---|
| 타입 | Docker named volume |
| 드라이버 | local |
| 마운트 경로 | /app/uploads |
| 디렉토리 구조 | {storeId}/menus/{menuId}_{timestamp}.{ext} |
| 영속성 | docker-compose down 시에도 유지 |
| 삭제 | docker volume rm menu-uploads (명시적 삭제만) |

### 용량 추정

| 항목 | 값 |
|---|---|
| 매장당 최대 메뉴 | 500개 |
| 이미지당 최대 크기 | 5MB |
| 매장당 최대 용량 | 2.5GB |
| 100개 매장 시 | 250GB (최대 이론치) |
| 실제 예상 | 50~100GB (평균 이미지 1~2MB) |

---

## 개발 환경 실행 순서

```
1. docker-compose up -d postgres     # DB 시작
2. npx prisma migrate dev            # 스키마 마이그레이션 (Unit 1 + Unit 2 모델)
3. npx prisma db seed                # 시드 데이터
4. docker-compose up -d backend      # 백엔드 시작 (uploads 볼륨 자동 마운트)
5. npm run dev (frontend/)           # 프론트엔드 개발 서버
```

---

## 프로덕션 고려사항 (향후)

현재는 로컬 Docker Compose 환경이지만, 프로덕션 전환 시 고려할 사항:

| 항목 | 현재 (로컬) | 프로덕션 (향후) |
|---|---|---|
| 이미지 저장 | Docker named volume | S3 또는 클라우드 스토리지 |
| 정적 파일 서빙 | Express.static | CDN (CloudFront 등) |
| DB | Docker PostgreSQL | 관리형 DB (RDS 등) |
| TLS | 없음 | HTTPS 필수 |
| 로그 | 콘솔/파일 | 중앙 집중 로깅 서비스 |
