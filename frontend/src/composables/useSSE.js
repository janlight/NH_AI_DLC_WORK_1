/**
 * useSSE Composable - SSE 연결 관리
 * 
 * 패턴: Exponential Backoff + Circuit Breaker (최대 10회)
 */

import { ref, onUnmounted } from 'vue';

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

/**
 * @param {string} storeId - 매장 ID
 * @param {object} handlers - 이벤트 핸들러
 * @param {Function} handlers.onNewOrder
 * @param {Function} handlers.onOrderStatus
 * @param {Function} handlers.onOrderDeleted
 * @param {Function} handlers.onTableCompleted
 */
export function useSSE(storeId, handlers = {}) {
  const status = ref('disconnected');
  const retryCount = ref(0);

  let eventSource = null;
  let retryTimer = null;

  function connect() {
    cleanup();

    const token = localStorage.getItem('token');
    const url = `/api/stores/${storeId}/events`;

    // EventSource는 커스텀 헤더를 지원하지 않으므로 쿼리 파라미터로 토큰 전달
    // Unit 1 통합 시 인증 방식에 따라 조정 필요
    eventSource = new EventSource(`${url}?token=${token || ''}`);

    eventSource.addEventListener('connected', (e) => {
      status.value = 'connected';
      retryCount.value = 0;
      console.log('SSE 연결 성공:', JSON.parse(e.data));
    });

    eventSource.addEventListener('new-order', (e) => {
      try {
        const data = JSON.parse(e.data);
        handlers.onNewOrder?.(data);
      } catch (err) {
        console.error('new-order 이벤트 파싱 실패:', err);
      }
    });

    eventSource.addEventListener('order-status', (e) => {
      try {
        const data = JSON.parse(e.data);
        handlers.onOrderStatus?.(data);
      } catch (err) {
        console.error('order-status 이벤트 파싱 실패:', err);
      }
    });

    eventSource.addEventListener('order-deleted', (e) => {
      try {
        const data = JSON.parse(e.data);
        handlers.onOrderDeleted?.(data);
      } catch (err) {
        console.error('order-deleted 이벤트 파싱 실패:', err);
      }
    });

    eventSource.addEventListener('table-completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        handlers.onTableCompleted?.(data);
      } catch (err) {
        console.error('table-completed 이벤트 파싱 실패:', err);
      }
    });

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      attemptReconnect();
    };
  }

  function attemptReconnect() {
    retryCount.value += 1;

    if (retryCount.value > MAX_RETRIES) {
      status.value = 'disconnected';
      console.log(`SSE 재연결 중단: ${MAX_RETRIES}회 초과`);
      return;
    }

    status.value = 'reconnecting';
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount.value - 1), MAX_DELAY_MS);
    console.log(`SSE 재연결 시도 ${retryCount.value}/${MAX_RETRIES} (${delay}ms 후)`);

    retryTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  function manualReconnect() {
    retryCount.value = 0;
    connect();
  }

  function disconnect() {
    cleanup();
    status.value = 'disconnected';
  }

  function cleanup() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    status,
    retryCount,
    connect,
    disconnect,
    manualReconnect
  };
}
