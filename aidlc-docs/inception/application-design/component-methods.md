# Component Methods

> 참고: 상세 비즈니스 규칙은 Functional Design(CONSTRUCTION) 단계에서 정의

## 1. AuthComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `tableLogin(storeId, tableNumber, password)` | storeId: string, tableNumber: number, password: string | `{ token: string, tableId: string, sessionId: string }` | 테이블 로그인 및 JWT 발급 |
| `adminLogin(storeId, username, password)` | storeId: string, username: string, password: string | `{ token: string, role: string }` | 관리자 로그인 및 JWT 발급 |
| `verifyToken(token)` | token: string | `{ valid: boolean, payload: TokenPayload }` | JWT 토큰 검증 |
| `hashPassword(password)` | password: string | hashedPassword: string | bcrypt 비밀번호 해싱 |
| `checkRateLimit(identifier)` | identifier: string | `{ allowed: boolean, retryAfter?: number }` | 로그인 시도 제한 확인 |

## 2. StoreComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getStore(storeId)` | storeId: string | `Store` | 매장 정보 조회 |

## 3. MenuComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getMenusByStore(storeId)` | storeId: string | `Menu[]` (카테고리별 그룹) | 매장 메뉴 목록 조회 |
| `getMenuDetail(storeId, menuId)` | storeId: string, menuId: string | `Menu` | 메뉴 상세 조회 |
| `createMenu(storeId, menuData)` | storeId: string, menuData: CreateMenuInput | `Menu` | 메뉴 등록 |
| `updateMenu(storeId, menuId, menuData)` | storeId: string, menuId: string, menuData: UpdateMenuInput | `Menu` | 메뉴 수정 |
| `deleteMenu(storeId, menuId)` | storeId: string, menuId: string | `void` | 메뉴 삭제 |
| `updateMenuOrder(storeId, menuOrders)` | storeId: string, menuOrders: `{menuId, sortOrder}[]` | `void` | 메뉴 순서 변경 |
| `uploadImage(storeId, menuId, file)` | storeId: string, menuId: string, file: File | `{ imageUrl: string }` | 이미지 업로드 |

## 4. TableComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getTables(storeId)` | storeId: string | `Table[]` | 테이블 목록 조회 |
| `createTable(storeId, tableData)` | storeId: string, tableData: CreateTableInput | `Table` | 테이블 설정 |
| `completeTable(storeId, tableId)` | storeId: string, tableId: string | `void` | 이용 완료 (세션 종료, 이력 이동, 리셋) |

## 5. OrderComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `createOrder(storeId, tableId, orderData)` | storeId: string, tableId: string, orderData: CreateOrderInput | `Order` | 주문 생성 |
| `getTableOrders(storeId, tableId, sessionId)` | storeId: string, tableId: string, sessionId: string | `Order[]` | 현재 세션 주문 조회 |
| `getStoreOrders(storeId)` | storeId: string | `Order[]` (테이블별 그룹) | 매장 전체 주문 조회 |
| `updateOrderStatus(storeId, orderId, status)` | storeId: string, orderId: string, status: OrderStatus | `Order` | 주문 상태 변경 |
| `deleteOrder(storeId, orderId)` | storeId: string, orderId: string | `void` | 주문 삭제 |
| `getOrderHistory(storeId, tableId, dateFilter?)` | storeId: string, tableId: string, dateFilter?: DateRange | `OrderHistory[]` | 과거 주문 내역 조회 |

## 6. SSEComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `subscribe(storeId, res)` | storeId: string, res: Response | SSE stream | SSE 연결 등록 |
| `broadcast(storeId, event, data)` | storeId: string, event: string, data: any | `void` | 매장별 이벤트 브로드캐스트 |
| `removeClient(storeId, clientId)` | storeId: string, clientId: string | `void` | 연결 해제 정리 |
