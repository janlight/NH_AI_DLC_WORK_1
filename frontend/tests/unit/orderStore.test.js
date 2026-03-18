import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrderStore } from '../../src/stores/orderStore';

// API 모킹
vi.mock('../../src/api/orderApi', () => ({
  createOrder: vi.fn(),
  getTableOrders: vi.fn(),
  getStoreOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  deleteOrder: vi.fn(),
  getOrderHistory: vi.fn()
}));

// cartStore 모킹
vi.mock('../../src/stores/cartStore', () => ({
  useCartStore: () => ({ clearCart: vi.fn() })
}));

import * as api from '../../src/api/orderApi';

describe('orderStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useOrderStore();
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('주문 생성 성공 시 데이터를 반환한다', async () => {
      api.createOrder.mockResolvedValue({ data: { id: 'o1', orderNumber: '20260318-001' } });
      const result = await store.createOrder('s1', 't1', [{ menuId: 'm1', quantity: 1 }]);
      expect(result.orderNumber).toBe('20260318-001');
      expect(store.loading).toBe(false);
    });

    it('주문 생성 실패 시 에러를 설정한다', async () => {
      api.createOrder.mockRejectedValue({ code: 'SESSION_NOT_FOUND' });
      await expect(store.createOrder('s1', 't1', [])).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
      expect(store.error).toBeTruthy();
    });
  });

  describe('fetchTableOrders', () => {
    it('주문 목록을 가져온다', async () => {
      api.getTableOrders.mockResolvedValue({ data: [{ id: 'o1' }] });
      await store.fetchTableOrders('s1', 't1');
      expect(store.orders).toHaveLength(1);
    });
  });

  describe('fetchStoreOrders', () => {
    it('매장 전체 주문을 가져온다', async () => {
      api.getStoreOrders.mockResolvedValue({ data: [{ tableId: 't1', totalAmount: 9000 }] });
      await store.fetchStoreOrders('s1');
      expect(store.storeOrders).toHaveLength(1);
    });
  });

  describe('SSE 이벤트 핸들러', () => {
    beforeEach(() => {
      store.storeOrders = [{
        tableId: 't1', totalAmount: 9000, orderCount: 1,
        recentOrders: [{ id: 'o1', status: 'PENDING', totalAmount: 9000 }]
      }];
    });

    it('handleNewOrder: 새 주문을 추가한다', () => {
      store.handleNewOrder({
        tableId: 't1',
        order: { id: 'o2', status: 'PENDING', totalAmount: 8000 }
      });
      expect(store.storeOrders[0].recentOrders).toHaveLength(2);
      expect(store.storeOrders[0].totalAmount).toBe(17000);
    });

    it('handleOrderStatus: 주문 상태를 업데이트한다', () => {
      store.handleOrderStatus({ orderId: 'o1', status: 'PREPARING' });
      expect(store.storeOrders[0].recentOrders[0].status).toBe('PREPARING');
    });

    it('handleOrderDeleted: 주문을 제거하고 총액을 업데이트한다', () => {
      store.handleOrderDeleted({ orderId: 'o1', tableId: 't1', newTotalAmount: 0 });
      expect(store.storeOrders[0].recentOrders).toHaveLength(0);
      expect(store.storeOrders[0].totalAmount).toBe(0);
    });

    it('handleTableCompleted: 테이블을 제거한다', () => {
      store.handleTableCompleted({ tableId: 't1' });
      expect(store.storeOrders).toHaveLength(0);
    });
  });
});
