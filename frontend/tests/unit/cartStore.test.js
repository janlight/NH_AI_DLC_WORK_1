import { setActivePinia, createPinia } from 'pinia';
import { useCartStore } from '../../src/stores/cartStore';

// localStorage 모킹
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('cartStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
    store = useCartStore();
    store.init('store-1', 'table-1');
  });

  describe('addItem', () => {
    it('새 메뉴를 장바구니에 추가한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      expect(store.items).toHaveLength(1);
      expect(store.items[0].menuName).toBe('비빔밥');
      expect(store.items[0].quantity).toBe(1);
    });

    it('동일 메뉴 추가 시 수량이 증가한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      expect(store.items).toHaveLength(1);
      expect(store.items[0].quantity).toBe(2);
    });

    it('localStorage에 저장한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cart_store-1_table-1',
        expect.any(String)
      );
    });
  });

  describe('updateQuantity', () => {
    it('수량을 업데이트한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.updateQuantity('m1', 3);
      expect(store.items[0].quantity).toBe(3);
    });

    it('수량 0이면 항목을 삭제한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.updateQuantity('m1', 0);
      expect(store.items).toHaveLength(0);
    });
  });

  describe('removeItem', () => {
    it('항목을 삭제한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.addItem({ id: 'm2', name: '김치찌개', price: 8000 });
      store.removeItem('m1');
      expect(store.items).toHaveLength(1);
      expect(store.items[0].menuId).toBe('m2');
    });
  });

  describe('clearCart', () => {
    it('장바구니를 비운다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.clearCart();
      expect(store.items).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('totalAmount를 올바르게 계산한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.addItem({ id: 'm2', name: '김치찌개', price: 8000 });
      store.updateQuantity('m1', 2);
      expect(store.totalAmount).toBe(9000 * 2 + 8000);
    });

    it('itemCount를 올바르게 계산한다', () => {
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      store.updateQuantity('m1', 3);
      expect(store.itemCount).toBe(3);
    });

    it('isEmpty가 올바르게 동작한다', () => {
      expect(store.isEmpty).toBe(true);
      store.addItem({ id: 'm1', name: '비빔밥', price: 9000 });
      expect(store.isEmpty).toBe(false);
    });
  });

  describe('loadFromStorage', () => {
    it('localStorage에서 장바구니를 복원한다', () => {
      const savedItems = [{ menuId: 'm1', menuName: '비빔밥', price: 9000, quantity: 2 }];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedItems));

      store.loadFromStorage();
      expect(store.items).toHaveLength(1);
      expect(store.items[0].quantity).toBe(2);
    });
  });
});
