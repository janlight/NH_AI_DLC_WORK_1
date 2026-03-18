/**
 * useSSE composable 단위 테스트
 * 
 * EventSource를 모킹하여 연결/재연결/이벤트 처리를 테스트합니다.
 */

import { nextTick } from 'vue';

// EventSource 모킹
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.onerror = null;
    this.readyState = 1;
    MockEventSource.instances.push(this);
  }
  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }
  close() {
    this.readyState = 2;
  }
  // 테스트 헬퍼: 이벤트 발생 시뮬레이션
  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event]({ data: JSON.stringify(data) });
    }
  }
  _triggerError() {
    if (this.onerror) this.onerror(new Event('error'));
  }
}
MockEventSource.instances = [];

global.EventSource = MockEventSource;

// onUnmounted 모킹 (composable 외부에서 사용 시)
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  onUnmounted: jest.fn((fn) => { /* 테스트에서는 수동 호출 */ })
}));

const { useSSE } = require('../../src/composables/useSSE');

describe('useSSE', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    jest.useFakeTimers();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('connect 호출 시 EventSource를 생성한다', () => {
    const { connect } = useSSE('store-1', {});
    connect();
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toContain('/api/stores/store-1/events');
  });

  it('connected 이벤트 수신 시 status가 connected로 변경된다', () => {
    const { connect, status } = useSSE('store-1', {});
    connect();
    const es = MockEventSource.instances[0];
    es._emit('connected', { clientId: 'c1' });
    expect(status.value).toBe('connected');
  });

  it('new-order 이벤트를 핸들러에 전달한다', () => {
    const onNewOrder = jest.fn();
    const { connect } = useSSE('store-1', { onNewOrder });
    connect();
    const es = MockEventSource.instances[0];
    es._emit('new-order', { orderId: 'o1' });
    expect(onNewOrder).toHaveBeenCalledWith({ orderId: 'o1' });
  });

  it('order-status 이벤트를 핸들러에 전달한다', () => {
    const onOrderStatus = jest.fn();
    const { connect } = useSSE('store-1', { onOrderStatus });
    connect();
    const es = MockEventSource.instances[0];
    es._emit('order-status', { orderId: 'o1', status: 'PREPARING' });
    expect(onOrderStatus).toHaveBeenCalledWith({ orderId: 'o1', status: 'PREPARING' });
  });

  it('에러 발생 시 재연결을 시도한다', () => {
    const { connect, status, retryCount } = useSSE('store-1', {});
    connect();
    const es = MockEventSource.instances[0];
    es._triggerError();

    expect(status.value).toBe('reconnecting');
    expect(retryCount.value).toBe(1);

    // 타이머 진행 → 재연결
    jest.advanceTimersByTime(1000);
    expect(MockEventSource.instances).toHaveLength(2);
  });

  it('10회 초과 시 재연결을 중단한다', () => {
    const { connect, status, retryCount } = useSSE('store-1', {});
    connect();

    // 10회 에러 발생
    for (let i = 0; i < 10; i++) {
      const es = MockEventSource.instances[MockEventSource.instances.length - 1];
      es._triggerError();
      jest.advanceTimersByTime(30000);
    }

    // 11번째 에러
    const lastEs = MockEventSource.instances[MockEventSource.instances.length - 1];
    lastEs._triggerError();

    expect(status.value).toBe('disconnected');
    expect(retryCount.value).toBe(11);
  });

  it('manualReconnect 호출 시 retryCount를 리셋하고 재연결한다', () => {
    const { connect, manualReconnect, retryCount, status } = useSSE('store-1', {});
    connect();

    // 에러로 disconnected 상태 만들기
    for (let i = 0; i < 11; i++) {
      const es = MockEventSource.instances[MockEventSource.instances.length - 1];
      es._triggerError();
      jest.advanceTimersByTime(30000);
    }

    expect(status.value).toBe('disconnected');

    const countBefore = MockEventSource.instances.length;
    manualReconnect();
    expect(retryCount.value).toBe(0);
    expect(MockEventSource.instances.length).toBe(countBefore + 1);
  });

  it('disconnect 호출 시 EventSource를 닫는다', () => {
    const { connect, disconnect, status } = useSSE('store-1', {});
    connect();
    const es = MockEventSource.instances[0];
    disconnect();
    expect(es.readyState).toBe(2);
    expect(status.value).toBe('disconnected');
  });
});
