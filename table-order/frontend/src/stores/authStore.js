import { defineStore } from 'pinia';
import apiClient from '../api/client.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    isCustomer: (state) => state.user?.role === 'customer',
    isAdmin: (state) => ['OWNER', 'MANAGER'].includes(state.user?.role),
    storeId: (state) => state.user?.storeId || null,
  },

  actions: {
    /**
     * 테이블 로그인
     */
    async tableLogin(storeSlug, tableNumber, password) {
      this.isLoading = true;
      try {
        const { data } = await apiClient.post('/auth/table-login', {
          storeSlug,
          tableNumber: parseInt(tableNumber, 10),
          password,
        });

        this.token = data.data.token;
        this.user = this._decodeToken(data.data.token);
        this.isAuthenticated = true;

        localStorage.setItem('table_auth_token', data.data.token);
        localStorage.setItem(
          'table_auth_credentials',
          JSON.stringify({ storeSlug, tableNumber, password })
        );

        return data.data;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 관리자 로그인
     */
    async adminLogin(storeSlug, username, password) {
      this.isLoading = true;
      try {
        const { data } = await apiClient.post('/auth/admin-login', {
          storeSlug,
          username,
          password,
        });

        this.token = data.data.token;
        this.user = this._decodeToken(data.data.token);
        this.isAuthenticated = true;

        localStorage.setItem('admin_auth_token', data.data.token);
        localStorage.setItem(
          'admin_auth_credentials',
          JSON.stringify({ storeSlug, username, password })
        );

        return data.data;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 로그아웃
     */
    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('table_auth_token');
      localStorage.removeItem('admin_auth_token');
    },

    /**
     * 저장된 토큰으로 인증 상태 복원
     */
    async checkAuth() {
      const adminToken = localStorage.getItem('admin_auth_token');
      const customerToken = localStorage.getItem('table_auth_token');
      const token = adminToken || customerToken;

      if (!token) return false;

      try {
        await apiClient.post('/auth/verify', null, {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.token = token;
        this.user = this._decodeToken(token);
        this.isAuthenticated = true;
        return true;
      } catch {
        return await this.autoRelogin();
      }
    },

    /**
     * 자동 재로그인
     */
    async autoRelogin() {
      // 관리자 재로그인 시도
      const adminCreds = localStorage.getItem('admin_auth_credentials');
      if (adminCreds) {
        try {
          const { storeSlug, username, password } = JSON.parse(adminCreds);
          await this.adminLogin(storeSlug, username, password);
          return true;
        } catch {
          // 실패 시 고객 재로그인 시도
        }
      }

      // 고객 재로그인 시도
      const tableCreds = localStorage.getItem('table_auth_credentials');
      if (tableCreds) {
        try {
          const { storeSlug, tableNumber, password } = JSON.parse(tableCreds);
          await this.tableLogin(storeSlug, tableNumber, password);
          return true;
        } catch {
          this.logout();
          return false;
        }
      }

      this.logout();
      return false;
    },

    /**
     * JWT 토큰 디코딩 (서명 검증 없이 payload만 추출)
     */
    _decodeToken(token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch {
        return null;
      }
    },
  },
});
