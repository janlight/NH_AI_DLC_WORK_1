import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/authStore.js';

// apiClient mock
vi.mock('../../src/api/client.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

import apiClient from '../../src/api/client.js';

// JWT 토큰 생성 헬퍼 (서명 없이 payload만)
function createMockToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

describe('authStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('인증되지 않은 초기 상태', () => {
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('tableLogin', () => {
    it('로그인 성공 시 토큰과 사용자 정보 저장', async () => {
      const mockToken = createMockToken({
        storeId: 'store-1',
        tableId: 'table-1',
        sessionId: 'session-1',
        tableNumber: 1,
        role: 'customer',
      });

      apiClient.post.mockResolvedValueOnce({
        data: { data: { token: mockToken, tableId: 'table-1', sessionId: 'session-1' } },
      });

      await store.tableLogin('sample-store', 1, '1234');

      expect(store.isAuthenticated).toBe(true);
      expect(store.token).toBe(mockToken);
      expect(store.user.role).toBe('customer');
      expect(store.isCustomer).toBe(true);
      expect(localStorage.getItem('table_auth_token')).toBe(mockToken);
    });

    it('로그인 실패 시 에러 전파', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Login failed'));

      await expect(store.tableLogin('bad', 1, 'wrong')).rejects.toThrow();
      expect(store.isAuthenticated).toBe(false);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('adminLogin', () => {
    it('관리자 로그인 성공', async () => {
      const mockToken = createMockToken({
        storeId: 'store-1',
        adminId: 'admin-1',
        username: 'admin',
        role: 'OWNER',
      });

      apiClient.post.mockResolvedValueOnce({
        data: { data: { token: mockToken, role: 'OWNER', username: 'admin' } },
      });

      await store.adminLogin('sample-store', 'admin', 'admin1234');

      expect(store.isAuthenticated).toBe(true);
      expect(store.user.role).toBe('OWNER');
      expect(store.isAdmin).toBe(true);
      expect(localStorage.getItem('admin_auth_token')).toBe(mockToken);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 상태 초기화', async () => {
      const mockToken = createMockToken({ role: 'customer', storeId: 's1' });
      apiClient.post.mockResolvedValueOnce({
        data: { data: { token: mockToken } },
      });
      await store.tableLogin('s', 1, 'p');

      store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(localStorage.getItem('table_auth_token')).toBeNull();
    });
  });

  describe('getters', () => {
    it('isCustomer: customer role일 때 true', () => {
      store.user = { role: 'customer' };
      expect(store.isCustomer).toBe(true);
      expect(store.isAdmin).toBe(false);
    });

    it('isAdmin: OWNER role일 때 true', () => {
      store.user = { role: 'OWNER' };
      expect(store.isAdmin).toBe(true);
      expect(store.isCustomer).toBe(false);
    });

    it('isAdmin: MANAGER role일 때 true', () => {
      store.user = { role: 'MANAGER' };
      expect(store.isAdmin).toBe(true);
    });

    it('storeId: user에서 storeId 반환', () => {
      store.user = { storeId: 'store-123' };
      expect(store.storeId).toBe('store-123');
    });

    it('storeId: user 없으면 null', () => {
      expect(store.storeId).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('토큰 없으면 false 반환', async () => {
      const result = await store.checkAuth();
      expect(result).toBe(false);
    });

    it('유효한 토큰이면 인증 복원', async () => {
      const mockToken = createMockToken({ role: 'OWNER', storeId: 's1' });
      localStorage.setItem('admin_auth_token', mockToken);
      apiClient.post.mockResolvedValueOnce({ data: {} });

      const result = await store.checkAuth();

      expect(result).toBe(true);
      expect(store.isAuthenticated).toBe(true);
    });
  });
});
