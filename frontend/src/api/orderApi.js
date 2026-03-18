/**
 * Order API 클라이언트
 * 
 * Unit 1의 api/client.js (axios 인스턴스)를 사용합니다.
 * Unit 1 미완료 시 독립 axios 인스턴스를 사용합니다.
 */

import axios from 'axios';

// Unit 1 통합 시 import apiClient from './client' 로 교체
const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 파싱
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: '네트워크 오류가 발생했습니다'
    };
    return Promise.reject(errorData);
  }
);

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
