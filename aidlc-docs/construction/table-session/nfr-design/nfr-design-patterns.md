# NFR Design Patterns - Unit 4: table-session

## DP-T01: Unit of Work 트랜잭션 패턴 (NFR-T01)

**패턴**: Prisma Interactive Transaction
**적용 대상**: `completeTable()` (이용 완료)

```
completeTable(storeId, tableId):
  prisma.$transaction(async (tx) => {
    // 1. 세션 조회 + 버전 확인
    session = tx.tableSession.findFirst({ where: { tableId, isActive: true } })
    
    // 2. 현재 세션 주문 + 항목 조회
    orders = tx.order.findMany({ where: { tableId, sessionId }, include: { items: true } })
    
    // 3. OrderHistory 일괄 생성
    tx.orderHistory.createMany({ data: orders.map(toHistoryRecord) })
    
    // 4. 주문 항목 삭제 → 주문 삭제
    tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
    tx.order.deleteMany({ where: { id: { in: orderIds } } })
    
    // 5. 세션 종료
    tx.tableSession.update({ where: { id: sessionId, version }, data: { isActive: false, completedAt: now(), version: { increment: 1 } } })
    
    // 6. 테이블 리셋
    tx.table.update({ where: { id: tableId }, data: { currentSessionId: null } })
  }, { timeout: 60000 })
  
  // 트랜잭션 커밋 후 SSE 발행 (best-effort)
  sseService.broadcast(storeId, 'table-completed', { tableId, tableNumber })
```

## DP-T02: 낙관적 잠금 패턴 (NFR-T02)

**패턴**: Version Field + Conditional Update
**적용 대상**: TableSession

```
// 업데이트 시 version 조건 포함
tx.tableSession.update({
  where: { id: sessionId, version: currentVersion },
  data: { ..., version: { increment: 1 } }
})

// 충돌 감지: Prisma P2025 에러 (Record not found)
catch (error) {
  if (error.code === 'P2025') {
    return res.status(409).json({
      error: 'CONFLICT',
      message: '현재 테이블 정리 중입니다. 잠시 후 다시 시도해주세요.',
      retryAfter: 3000
    })
  }
}
```

**클라이언트 처리**:
- 409 응답 수신 시 사용자에게 메시지 표시
- 3초 후 자동 재시도 (최대 2회)
- 2회 실패 시 수동 재시도 안내

## DP-T03: 스케줄 배치 패턴 (NFR-T03)

**패턴**: Scheduled Batch Delete (node-cron)
**적용 대상**: OrderHistory 만료 레코드 삭제

```
// 매일 03:00 실행
cron.schedule('0 3 * * *', async () => {
  let deleted = 0
  do {
    const result = await prisma.orderHistory.deleteMany({
      where: { expiresAt: { lt: new Date() } },
      take: 1000  // 배치 크기
    })
    deleted = result.count
  } while (deleted === 1000)
})
```

**실패 처리**: console.error 로그 기록, 다음 배치에서 자동 재시도 (만료 조건 동일)

## DP-T04: 쿼리 최적화 패턴 (NFR-T04)

**패턴**: Aggregation at DB Level + Strategic Indexing
**적용 대상**: 테이블 목록 조회

```
// N+1 방지: 테이블 + 현재 세션 주문 총액을 단일 쿼리로
SELECT t.*, 
  COALESCE(SUM(o."totalAmount"), 0) as "currentTotal"
FROM "Table" t
LEFT JOIN "Order" o ON o."tableId" = t.id 
  AND o."sessionId" = t."currentSessionId"
WHERE t."storeId" = $1
GROUP BY t.id
```

**인덱스**:
- `CREATE INDEX idx_table_store ON "Table"("storeId")`
- `CREATE INDEX idx_order_table_session ON "Order"("tableId", "sessionId")`
- `CREATE INDEX idx_history_store_table_expires ON "OrderHistory"("storeId", "tableId", "expiresAt")`
- `CREATE INDEX idx_history_expires ON "OrderHistory"("expiresAt")`

## DP-T05: 테넌트 격리 미들웨어 패턴 (NFR-T05)

**패턴**: Request-Level Tenant Validation
**적용 대상**: 모든 table-session API

```
// 라우트 레벨에서 storeId 검증
const validateTenant = (req, res, next) => {
  if (req.params.storeId !== req.user.storeId) {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }
  next()
}

router.use('/api/stores/:storeId/tables', authMiddleware, validateTenant)
```

## DP-T06: 트랜잭션 후 이벤트 발행 패턴 (NFR-T06)

**패턴**: Post-Commit Event Emission (Best-Effort)
**적용 대상**: 이용 완료, 주문 삭제

```
// 트랜잭션 성공 후 SSE 발행
try {
  await prisma.$transaction(...)  // 데이터 변경
  sseService.broadcast(...)       // 이벤트 발행 (트랜잭션 외부)
} catch (txError) {
  throw txError  // 트랜잭션 실패 시 이벤트 발행 안 함
}
// SSE 발행 실패는 무시 (best-effort)
```

**Fallback**: 관리자 대시보드 30초 간격 폴링으로 최신 상태 동기화
