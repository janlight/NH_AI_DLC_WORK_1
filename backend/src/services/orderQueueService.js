/**
 * OrderQueueService - 매장별 인메모리 주문 큐
 * 
 * 패턴: Promise Chain Queue + Backpressure
 * - 매장별 독립 큐로 주문 생성을 순차 처리
 * - 큐 길이 제한(50개)과 개별 타임아웃(5초)으로 성능 보호
 */

const MAX_QUEUE_LENGTH = 50;
const ORDER_TIMEOUT_MS = 5000;

// Map<storeId, { promise: Promise, length: number }>
const storeQueues = new Map();

/**
 * Promise에 타임아웃을 적용하는 래퍼
 * @param {Promise} promise - 원본 Promise
 * @param {number} ms - 타임아웃 (밀리초)
 * @returns {Promise}
 */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject({
        code: 'ORDER_TIMEOUT',
        message: `주문 처리가 ${ms / 1000}초를 초과했습니다`,
        status: 500
      });
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * 매장별 큐에 주문 처리 함수를 추가하고 순차 실행
 * @param {string} storeId - 매장 ID
 * @param {Function} orderFn - 주문 처리 함수 (async)
 * @returns {Promise} 주문 처리 결과
 */
async function enqueueOrder(storeId, orderFn) {
  let queue = storeQueues.get(storeId) || { promise: Promise.resolve(), length: 0 };

  // Backpressure: 큐 길이 제한
  if (queue.length >= MAX_QUEUE_LENGTH) {
    throw {
      code: 'QUEUE_FULL',
      message: '주문 처리 대기열이 가득 찼습니다. 잠시 후 다시 시도해주세요.',
      status: 429
    };
  }

  queue.length++;
  storeQueues.set(storeId, queue);

  const next = queue.promise.then(async () => {
    try {
      return await withTimeout(orderFn(), ORDER_TIMEOUT_MS);
    } finally {
      queue.length--;
      // 큐가 비었으면 엔트리 정리
      if (queue.length <= 0) {
        storeQueues.delete(storeId);
      }
    }
  });

  // 에러 전파 방지 (다음 큐 아이템이 이전 에러에 영향받지 않도록)
  queue.promise = next.catch(() => {});

  return next;
}

/**
 * 특정 매장의 현재 큐 길이 조회 (모니터링/테스트용)
 * @param {string} storeId
 * @returns {number}
 */
function getQueueLength(storeId) {
  const queue = storeQueues.get(storeId);
  return queue ? queue.length : 0;
}

/**
 * 모든 큐 초기화 (테스트용)
 */
function clearAllQueues() {
  storeQueues.clear();
}

module.exports = {
  enqueueOrder,
  withTimeout,
  getQueueLength,
  clearAllQueues,
  MAX_QUEUE_LENGTH,
  ORDER_TIMEOUT_MS
};
