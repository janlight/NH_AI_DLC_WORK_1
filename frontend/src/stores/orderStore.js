/**
 * Order Store - 주문 상태 관리 (Pinia + API 연동)
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  createOrder as apiCreateOrder,
  getTableOrders as apiGetTableOrders,
  getStoreOrders as apiGetStoreOrders,
  updateOrderStatus as apiUpdateOrderStatus,
  deleteOrder as apiDeleteOrder,
  getOrderHistory as apiGetOrderHistory
} from '../api/orderApi';
import { useCartStore } from './cartStore';

export const useOrderStore = defineStore('order', () => {
  const orders = ref([]);
  const storeOrders = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // ─── 고객 Actions ───

  async function createOrder(storeId, tableId, items) {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiCreateOrder(storeId, tableId, items);
      const cartStore = useCartStore();
      cartStore.clearCart();
      return result.data;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTableOrders(storeId, tableId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiGetTableOrders(storeId, tableId);
      orders.value = result.data;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  // ─── 관리자 Actions ───

  async function fetchStoreOrders(storeId) {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiGetStoreOrders(storeId);
      storeOrders.value = result.data;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStatus(storeId, orderId, status) {
    error.value = null;
    try {
      const result = await apiUpdateOrderStatus(storeId, orderId, status);
      // 로컬 상태 업데이트
      updateLocalOrderStatus(orderId, status);
      return result.data;
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  async function removeOrder(storeId, orderId) {
    error.value = null;
    try {
      await apiDeleteOrder(storeId, orderId);
      removeLocalOrder(orderId);
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  async function fetchOrderHistory(storeId, tableId, params) {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiGetOrderHistory(storeId, tableId, params);
      return result.data;
    } catch (err) {
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  }

  // ─── SSE 이벤트 핸들러 ───

  function handleNewOrder(data) {
    const tableIndex = storeOrders.value.findIndex((t) => t.tableId === data.tableId);
    if (tableIndex >= 0) {
      const table = storeOrders.value[tableIndex];
      table.recentOrders.unshift(data.order);
      if (table.recentOrders.length > 3) table.recentOrders.pop();
      table.totalAmount += data.order.totalAmount;
      table.orderCount += 1;
    }
  }

  function handleOrderStatus(data) {
    updateLocalOrderStatus(data.orderId, data.status);
  }

  function handleOrderDeleted(data) {
    removeLocalOrder(data.orderId);
    // 총액 업데이트
    const tableIndex = storeOrders.value.findIndex((t) => t.tableId === data.tableId);
    if (tableIndex >= 0) {
      storeOrders.value[tableIndex].totalAmount = data.newTotalAmount;
    }
  }

  function handleTableCompleted(data) {
    const tableIndex = storeOrders.value.findIndex((t) => t.tableId === data.tableId);
    if (tableIndex >= 0) {
      storeOrders.value.splice(tableIndex, 1);
    }
  }

  // ─── 내부 헬퍼 ───

  function updateLocalOrderStatus(orderId, status) {
    for (const table of storeOrders.value) {
      const order = table.recentOrders.find((o) => o.id === orderId);
      if (order) {
        order.status = status;
        break;
      }
    }
    const order = orders.value.find((o) => o.id === orderId);
    if (order) order.status = status;
  }

  function removeLocalOrder(orderId) {
    for (const table of storeOrders.value) {
      table.recentOrders = table.recentOrders.filter((o) => o.id !== orderId);
      table.orderCount = Math.max(0, table.orderCount - 1);
    }
    orders.value = orders.value.filter((o) => o.id !== orderId);
  }

  return {
    orders,
    storeOrders,
    loading,
    error,
    createOrder,
    fetchTableOrders,
    fetchStoreOrders,
    updateStatus,
    removeOrder,
    fetchOrderHistory,
    handleNewOrder,
    handleOrderStatus,
    handleOrderDeleted,
    handleTableCompleted
  };
});
