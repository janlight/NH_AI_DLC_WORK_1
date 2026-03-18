/**
 * SSEService - Server-Sent Events 연결 관리 및 브로드캐스트
 * 
 * 패턴: Fire-and-Forget 브로드캐스트
 * - 매장별 클라이언트 풀 관리
 * - 30초 간격 heartbeat
 * - 전송 실패 시 해당 클라이언트만 제거
 */

const { v4: uuidv4 } = require('uuid');

const HEARTBEAT_INTERVAL_MS = 30000;

// Map<storeId, Map<clientId, { res, heartbeatTimer }>>
const clientPools = new Map();

/**
 * SSE 클라이언트 등록
 * @param {string} storeId - 매장 ID
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 * @returns {string} clientId
 */
function subscribe(storeId, req, res) {
  const clientId = uuidv4();

  // SSE 헤더 설정
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // 초기 연결 확인 이벤트
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  // Heartbeat 타이머
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (error) {
      console.error(`Heartbeat 실패 [store: ${storeId}, client: ${clientId}]`, error.message);
      removeClient(storeId, clientId);
    }
  }, HEARTBEAT_INTERVAL_MS);

  // 클라이언트 풀에 등록
  if (!clientPools.has(storeId)) {
    clientPools.set(storeId, new Map());
  }
  clientPools.get(storeId).set(clientId, { res, heartbeatTimer });

  console.log(`SSE 연결 [store: ${storeId}, client: ${clientId}]`);

  // 연결 종료 시 정리
  req.on('close', () => {
    console.log(`SSE 연결 종료 [store: ${storeId}, client: ${clientId}]`);
    removeClient(storeId, clientId);
  });

  return clientId;
}

/**
 * 매장의 모든 SSE 클라이언트에 이벤트 브로드캐스트
 * @param {string} storeId - 매장 ID
 * @param {string} eventName - 이벤트명
 * @param {object} data - 이벤트 데이터
 */
function broadcast(storeId, eventName, data) {
  const pool = clientPools.get(storeId);
  if (!pool || pool.size === 0) {
    return; // 연결된 클라이언트 없음
  }

  const eventString = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const [clientId, client] of pool) {
    try {
      client.res.write(eventString);
    } catch (error) {
      console.error(`SSE 전송 실패 [store: ${storeId}, client: ${clientId}]`, error.message);
      removeClient(storeId, clientId);
    }
  }
}

/**
 * 클라이언트 제거
 * @param {string} storeId - 매장 ID
 * @param {string} clientId - 클라이언트 ID
 */
function removeClient(storeId, clientId) {
  const pool = clientPools.get(storeId);
  if (!pool) return;

  const client = pool.get(clientId);
  if (client) {
    clearInterval(client.heartbeatTimer);
    pool.delete(clientId);
  }

  // 풀이 비었으면 매장 엔트리 삭제
  if (pool.size === 0) {
    clientPools.delete(storeId);
  }
}

/**
 * 특정 매장의 연결된 클라이언트 수 조회
 * @param {string} storeId
 * @returns {number}
 */
function getClientCount(storeId) {
  const pool = clientPools.get(storeId);
  return pool ? pool.size : 0;
}

/**
 * 모든 클라이언트 풀 초기화 (테스트용)
 */
function clearAllPools() {
  for (const [, pool] of clientPools) {
    for (const [, client] of pool) {
      clearInterval(client.heartbeatTimer);
    }
  }
  clientPools.clear();
}

module.exports = {
  subscribe,
  broadcast,
  removeClient,
  getClientCount,
  clearAllPools,
  HEARTBEAT_INTERVAL_MS
};
