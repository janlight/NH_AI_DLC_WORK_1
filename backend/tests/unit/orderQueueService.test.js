const {
  enqueueOrder,
  withTimeout,
  getQueueLength,
  clearAllQueues,
  MAX_QUEUE_LENGTH
} = require('../../src/services/orderQueueService');

describe('OrderQueueService', () => {
  afterEach(() => {
    clearAllQueues();
  });

  describe('enqueueOrder', () => {
    it('단일 주문을 정상 처리한다', async () => {
      const result = await enqueueOrder('store-1', async () => ({ orderId: '1' }));
      expect(result).toEqual({ orderId: '1' });
    });

    it('같은 매장의 주문을 순차 처리한다', async () => {
      const executionOrder = [];

      const p1 = enqueueOrder('store-1', async () => {
        await new Promise((r) => setTimeout(r, 50));
        executionOrder.push(1);
        return { order: 1 };
      });

      const p2 = enqueueOrder('store-1', async () => {
        executionOrder.push(2);
        return { order: 2 };
      });

      await Promise.all([p1, p2]);
      expect(executionOrder).toEqual([1, 2]);
    });

    it('다른 매장의 주문은 병렬 처리된다', async () => {
      const startTimes = {};

      const p1 = enqueueOrder('store-1', async () => {
        startTimes['store-1'] = Date.now();
        await new Promise((r) => setTimeout(r, 50));
        return { store: 1 };
      });

      const p2 = enqueueOrder('store-2', async () => {
        startTimes['store-2'] = Date.now();
        await new Promise((r) => setTimeout(r, 50));
        return { store: 2 };
      });

      await Promise.all([p1, p2]);
      // 두 매장의 시작 시간 차이가 50ms 미만이면 병렬 처리된 것
      expect(Math.abs(startTimes['store-1'] - startTimes['store-2'])).toBeLessThan(50);
    });

    it('큐 길이 제한 초과 시 QUEUE_FULL 에러를 던진다', async () => {
      // 큐를 가득 채움
      const promises = [];
      for (let i = 0; i < MAX_QUEUE_LENGTH; i++) {
        promises.push(
          enqueueOrder('store-1', () => new Promise((r) => setTimeout(r, 1000)))
        );
      }

      // 초과 시도
      await expect(
        enqueueOrder('store-1', async () => ({}))
      ).rejects.toMatchObject({ code: 'QUEUE_FULL', status: 429 });

      // 정리: 타임아웃으로 자동 해제되도록 clearAllQueues
      clearAllQueues();
    });

    it('개별 주문 처리 실패가 다음 주문에 영향을 주지 않는다', async () => {
      const p1 = enqueueOrder('store-1', async () => {
        throw new Error('주문 실패');
      }).catch(() => 'failed');

      const p2 = enqueueOrder('store-1', async () => ({ orderId: '2' }));

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe('failed');
      expect(r2).toEqual({ orderId: '2' });
    });

    it('처리 완료 후 큐가 정리된다', async () => {
      await enqueueOrder('store-1', async () => ({ orderId: '1' }));
      expect(getQueueLength('store-1')).toBe(0);
    });
  });

  describe('withTimeout', () => {
    it('타임아웃 내 완료되면 결과를 반환한다', async () => {
      const result = await withTimeout(Promise.resolve('ok'), 1000);
      expect(result).toBe('ok');
    });

    it('타임아웃 초과 시 ORDER_TIMEOUT 에러를 던진다', async () => {
      const slowPromise = new Promise((r) => setTimeout(() => r('late'), 200));
      await expect(withTimeout(slowPromise, 50)).rejects.toMatchObject({
        code: 'ORDER_TIMEOUT',
        status: 500
      });
    });

    it('원본 Promise 에러는 그대로 전파된다', async () => {
      const failPromise = Promise.reject(new Error('원본 에러'));
      await expect(withTimeout(failPromise, 1000)).rejects.toThrow('원본 에러');
    });
  });

  describe('getQueueLength', () => {
    it('큐가 없는 매장은 0을 반환한다', () => {
      expect(getQueueLength('nonexistent')).toBe(0);
    });
  });
});
