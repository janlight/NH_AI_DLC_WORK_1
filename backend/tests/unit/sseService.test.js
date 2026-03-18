const {
  subscribe,
  broadcast,
  removeClient,
  getClientCount,
  clearAllPools
} = require('../../src/services/sseService');

// Mock Express req/res
function createMockReqRes() {
  const written = [];
  const res = {
    writeHead: jest.fn(),
    write: jest.fn((data) => { written.push(data); return true; }),
    end: jest.fn()
  };
  const req = {
    on: jest.fn()
  };
  return { req, res, written };
}

describe('SSEService', () => {
  afterEach(() => {
    clearAllPools();
  });

  describe('subscribe', () => {
    it('SSE 헤더를 올바르게 설정한다', () => {
      const { req, res } = createMockReqRes();
      subscribe('store-1', req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
    });

    it('연결 확인 이벤트를 전송한다', () => {
      const { req, res, written } = createMockReqRes();
      const clientId = subscribe('store-1', req, res);

      expect(written[0]).toContain('event: connected');
      expect(written[0]).toContain(clientId);
    });

    it('클라이언트를 풀에 등록한다', () => {
      const { req, res } = createMockReqRes();
      subscribe('store-1', req, res);

      expect(getClientCount('store-1')).toBe(1);
    });

    it('연결 종료 이벤트 리스너를 등록한다', () => {
      const { req, res } = createMockReqRes();
      subscribe('store-1', req, res);

      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('같은 매장에 여러 클라이언트를 등록할 수 있다', () => {
      const m1 = createMockReqRes();
      const m2 = createMockReqRes();
      subscribe('store-1', m1.req, m1.res);
      subscribe('store-1', m2.req, m2.res);

      expect(getClientCount('store-1')).toBe(2);
    });
  });

  describe('broadcast', () => {
    it('매장의 모든 클라이언트에 이벤트를 전송한다', () => {
      const m1 = createMockReqRes();
      const m2 = createMockReqRes();
      subscribe('store-1', m1.req, m1.res);
      subscribe('store-1', m2.req, m2.res);

      broadcast('store-1', 'new-order', { orderId: '123' });

      // 각 클라이언트에 connected + broadcast = 2번 write
      expect(m1.res.write).toHaveBeenCalledTimes(2);
      expect(m2.res.write).toHaveBeenCalledTimes(2);

      const lastCall1 = m1.res.write.mock.calls[1][0];
      expect(lastCall1).toContain('event: new-order');
      expect(lastCall1).toContain('"orderId":"123"');
    });

    it('다른 매장의 클라이언트에는 전송하지 않는다', () => {
      const m1 = createMockReqRes();
      const m2 = createMockReqRes();
      subscribe('store-1', m1.req, m1.res);
      subscribe('store-2', m2.req, m2.res);

      broadcast('store-1', 'new-order', { orderId: '123' });

      // store-2 클라이언트는 connected 이벤트만 받음
      expect(m2.res.write).toHaveBeenCalledTimes(1);
    });

    it('연결된 클라이언트가 없으면 아무 동작도 하지 않는다', () => {
      // 에러 없이 정상 실행
      expect(() => broadcast('nonexistent', 'test', {})).not.toThrow();
    });

    it('전송 실패 시 해당 클라이언트만 제거한다', () => {
      const m1 = createMockReqRes();
      const m2 = createMockReqRes();
      subscribe('store-1', m1.req, m1.res);
      subscribe('store-1', m2.req, m2.res);

      // m1의 write를 실패하도록 설정
      m1.res.write.mockImplementation(() => { throw new Error('연결 끊김'); });

      broadcast('store-1', 'new-order', { orderId: '123' });

      // m1은 제거되고 m2만 남음
      expect(getClientCount('store-1')).toBe(1);
    });
  });

  describe('removeClient', () => {
    it('클라이언트를 풀에서 제거한다', () => {
      const { req, res } = createMockReqRes();
      const clientId = subscribe('store-1', req, res);

      removeClient('store-1', clientId);
      expect(getClientCount('store-1')).toBe(0);
    });

    it('존재하지 않는 클라이언트 제거 시 에러가 발생하지 않는다', () => {
      expect(() => removeClient('store-1', 'nonexistent')).not.toThrow();
    });

    it('마지막 클라이언트 제거 시 매장 엔트리도 삭제된다', () => {
      const { req, res } = createMockReqRes();
      const clientId = subscribe('store-1', req, res);

      removeClient('store-1', clientId);
      expect(getClientCount('store-1')).toBe(0);
    });
  });

  describe('getClientCount', () => {
    it('클라이언트가 없는 매장은 0을 반환한다', () => {
      expect(getClientCount('nonexistent')).toBe(0);
    });
  });
});
