/**
 * Cart Store - 장바구니 상태 관리 (Pinia + localStorage)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const items = ref([]);
  const storeId = ref('');
  const tableId = ref('');

  // ─── Getters ───

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const isEmpty = computed(() => items.value.length === 0);

  // ─── localStorage 키 ───

  function getStorageKey() {
    return `cart_${storeId.value}_${tableId.value}`;
  }

  function saveToStorage() {
    localStorage.setItem(getStorageKey(), JSON.stringify(items.value));
  }

  // ─── Actions ───

  function init(newStoreId, newTableId) {
    storeId.value = newStoreId;
    tableId.value = newTableId;
    loadFromStorage();
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        items.value = JSON.parse(stored);
      }
    } catch {
      items.value = [];
    }
  }

  function addItem(menu) {
    const existing = items.value.find((item) => item.menuId === menu.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.value.push({
        menuId: menu.id,
        menuName: menu.name,
        price: menu.price,
        quantity: 1,
        imageUrl: menu.imageUrl || null
      });
    }
    saveToStorage();
  }

  function updateQuantity(menuId, quantity) {
    if (quantity <= 0) {
      removeItem(menuId);
      return;
    }
    const item = items.value.find((i) => i.menuId === menuId);
    if (item) {
      item.quantity = quantity;
      saveToStorage();
    }
  }

  function removeItem(menuId) {
    items.value = items.value.filter((i) => i.menuId !== menuId);
    saveToStorage();
  }

  function clearCart() {
    items.value = [];
    localStorage.removeItem(getStorageKey());
  }

  return {
    items,
    storeId,
    tableId,
    totalAmount,
    itemCount,
    isEmpty,
    init,
    loadFromStorage,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };
});
