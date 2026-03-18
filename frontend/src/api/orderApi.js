/**
 * Order API 클라이언트
 * 
 * Unit 1의 api/client.js (axios 인스턴스)를 사용합니다.
 */

import apiClient from './client';

/**
 * 주문 생성 (고객)
 */
export function createOrder(storeId, tableId, items) {
  return apiClient.post(`/stores/${storeId}/tables/${tableId}/orders`, { items });
}

/**
 * 현재 세션 주문 조회 (고객)
 */
export function getTableOrders(storeId, tableId) {
  return apiClient.get(`/stores/${storeId}/tables/${tableId}/orders`);
}

/**
 * 매장 전체 주문 조회 (관리자)
 */
export function getStoreOrders(storeId) {
  return apiClient.get(`/stores/${storeId}/orders`);
}

/**
 * 주문 상태 변경 (관리자)
 */
export function updateOrderStatus(storeId, orderId, status) {
  return apiClient.put(`/stores/${storeId}/orders/${orderId}/status`, { status });
}

/**
 * 주문 삭제 (관리자)
 */
export function deleteOrder(storeId, orderId) {
  return apiClient.delete(`/stores/${storeId}/orders/${orderId}`);
}

/**
 * 과거 주문 내역 조회 (관리자)
 */
export function getOrderHistory(storeId, tableId, params = {}) {
  return apiClient.get(`/stores/${storeId}/tables/${tableId}/order-history`, { params });
}

export default apiClient;
