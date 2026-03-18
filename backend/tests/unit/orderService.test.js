// OrderService 단위 테스트
const orderService = require('../../src/services/orderService');

describe('OrderService', () => {
  describe('exports', () => {
    it('should export createOrder function', () => {
      expect(typeof orderService.createOrder).toBe('function');
    });

    it('should export getTableOrders function', () => {
      expect(typeof orderService.getTableOrders).toBe('function');
    });

    it('should export getStoreOrders function', () => {
      expect(typeof orderService.getStoreOrders).toBe('function');
    });

    it('should export updateOrderStatus function', () => {
      expect(typeof orderService.updateOrderStatus).toBe('function');
    });

    it('should export deleteOrder function', () => {
      expect(typeof orderService.deleteOrder).toBe('function');
    });

    it('should export getOrderHistory function', () => {
      expect(typeof orderService.getOrderHistory).toBe('function');
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('should allow PENDING -> PREPARING', () => {
      expect(orderService.VALID_TRANSITIONS.PENDING).toBe('PREPARING');
    });

    it('should allow PREPARING -> COMPLETED', () => {
      expect(orderService.VALID_TRANSITIONS.PREPARING).toBe('COMPLETED');
    });

    it('should not allow COMPLETED -> any', () => {
      expect(orderService.VALID_TRANSITIONS.COMPLETED).toBeUndefined();
    });
  });
});
