/**
 * Menu Store (Pinia) - 메뉴/카테고리 상태 관리
 * Unit 2: menu-management
 *
 * 관련 스토리: US-02-01, US-02-02, US-08-01, US-08-02, US-08-03
 */
import { defineStore } from 'pinia';
import apiClient from '../api/client';

export const useMenuStore = defineStore('menu', {
  state: () => ({
    categories: [],
    menusByCategory: {},
    allMenus: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * 활성 메뉴만 카테고리별 그룹
     */
    activeMenusByCategory(state) {
      const result = {};
      for (const [catId, menus] of Object.entries(state.menusByCategory)) {
        result[catId] = menus.filter((m) => m.isActive);
      }
      return result;
    },

    getCategoryById(state) {
      return (id) => state.categories.find((c) => c.id === id);
    },

    getMenuById(state) {
      return (id) => state.allMenus.find((m) => m.id === id);
    },
  },

  actions: {
    /**
     * 고객용 메뉴 조회
     */
    async fetchMenus(storeId) {
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await apiClient.get(`/api/stores/${storeId}/menus`);
        const result = data.data;

        this.categories = result.categories.map((c) => c.category);
        this.menusByCategory = {};
        result.categories.forEach((c) => {
          this.menusByCategory[c.category.id] = c.menus;
        });
      } catch (err) {
        this.error = err.response?.data?.message || '메뉴를 불러오는데 실패했습니다.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 관리자용 메뉴 조회
     */
    async fetchMenusAdmin(storeId, categoryId) {
      this.isLoading = true;
      this.error = null;
      try {
        let url = `/api/stores/${storeId}/menus?admin=true`;
        if (categoryId) url += `&categoryId=${categoryId}`;

        const { data } = await apiClient.get(url);
        const result = data.data;

        this.categories = result.categories.map((c) => c.category);
        this.allMenus = result.categories.flatMap((c) => c.menus);
        this.menusByCategory = {};
        result.categories.forEach((c) => {
          this.menusByCategory[c.category.id] = c.menus;
        });
      } catch (err) {
        this.error = err.response?.data?.message || '메뉴를 불러오는데 실패했습니다.';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 카테고리 목록 조회
     */
    async fetchCategories(storeId) {
      try {
        const { data } = await apiClient.get(`/api/stores/${storeId}/categories`);
        this.categories = data.data;
      } catch (err) {
        this.error = err.response?.data?.message || '카테고리를 불러오는데 실패했습니다.';
        throw err;
      }
    },

    async createCategory(storeId, input) {
      const { data } = await apiClient.post(`/api/stores/${storeId}/categories`, input);
      this.categories.push(data.data);
      return data.data;
    },

    async updateCategory(storeId, categoryId, input) {
      const { data } = await apiClient.put(`/api/stores/${storeId}/categories/${categoryId}`, input);
      const idx = this.categories.findIndex((c) => c.id === categoryId);
      if (idx !== -1) this.categories[idx] = data.data;
      return data.data;
    },

    async deleteCategory(storeId, categoryId) {
      await apiClient.delete(`/api/stores/${storeId}/categories/${categoryId}`);
      this.categories = this.categories.filter((c) => c.id !== categoryId);
      delete this.menusByCategory[categoryId];
    },

    async updateCategoryOrder(storeId, categoryOrders) {
      await apiClient.put(`/api/stores/${storeId}/categories/order`, { categoryOrders });
      // 로컬 상태 업데이트
      categoryOrders.forEach(({ categoryId, sortOrder }) => {
        const cat = this.categories.find((c) => c.id === categoryId);
        if (cat) cat.sortOrder = sortOrder;
      });
      this.categories.sort((a, b) => a.sortOrder - b.sortOrder);
    },

    async createMenu(storeId, input) {
      const { data } = await apiClient.post(`/api/stores/${storeId}/menus`, input);
      const menu = data.data;
      this.allMenus.push(menu);
      if (!this.menusByCategory[menu.categoryId]) {
        this.menusByCategory[menu.categoryId] = [];
      }
      this.menusByCategory[menu.categoryId].push(menu);
      return menu;
    },

    async updateMenu(storeId, menuId, input) {
      const { data } = await apiClient.put(`/api/stores/${storeId}/menus/${menuId}`, input);
      const menu = data.data;
      const idx = this.allMenus.findIndex((m) => m.id === menuId);
      if (idx !== -1) this.allMenus[idx] = menu;
      // 카테고리별 목록도 업데이트
      for (const catId of Object.keys(this.menusByCategory)) {
        const mIdx = this.menusByCategory[catId].findIndex((m) => m.id === menuId);
        if (mIdx !== -1) {
          if (catId === menu.categoryId) {
            this.menusByCategory[catId][mIdx] = menu;
          } else {
            this.menusByCategory[catId].splice(mIdx, 1);
            if (!this.menusByCategory[menu.categoryId]) {
              this.menusByCategory[menu.categoryId] = [];
            }
            this.menusByCategory[menu.categoryId].push(menu);
          }
          break;
        }
      }
      return menu;
    },

    async deleteMenu(storeId, menuId) {
      await apiClient.delete(`/api/stores/${storeId}/menus/${menuId}`);
      // soft delete: isActive를 false로 변경
      const menu = this.allMenus.find((m) => m.id === menuId);
      if (menu) menu.isActive = false;
      // 카테고리별 목록에서도 업데이트
      for (const catId of Object.keys(this.menusByCategory)) {
        const m = this.menusByCategory[catId].find((m) => m.id === menuId);
        if (m) {
          m.isActive = false;
          break;
        }
      }
    },

    async updateMenuOrder(storeId, menuOrders) {
      await apiClient.put(`/api/stores/${storeId}/menus/order`, { menuOrders });
      menuOrders.forEach(({ menuId, sortOrder }) => {
        const menu = this.allMenus.find((m) => m.id === menuId);
        if (menu) menu.sortOrder = sortOrder;
      });
    },

    async uploadImage(storeId, menuId, file) {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await apiClient.post(
        `/api/stores/${storeId}/menus/${menuId}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      // 로컬 상태 업데이트
      const menu = this.allMenus.find((m) => m.id === menuId);
      if (menu) menu.imageUrl = data.data.imageUrl;
      return data.data;
    },
  },
});
