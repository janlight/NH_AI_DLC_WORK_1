/**
 * menuStore 단위 테스트
 * Unit 2: menu-management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMenuStore } from '../../src/stores/menuStore';

// API client mock
vi.mock('../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../src/api/client';

describe('menuStore', () => {
  let store;
  const storeId = 'store-001';

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMenuStore();
    vi.clearAllMocks();
  });

  describe('fetchMenus', () => {
    it('고객용 메뉴를 조회하고 상태를 업데이트한다', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          data: {
            categories: [
              {
                category: { id: 'cat-1', name: '음료', sortOrder: 0 },
                menus: [{ id: 'menu-1', name: '아메리카노', price: 4500, isActive: true }],
              },
            ],
          },
        },
      });

      await store.fetchMenus(storeId);

      expect(store.categories).toHaveLength(1);
      expect(store.categories[0].name).toBe('음료');
      expect(store.menusByCategory['cat-1']).toHaveLength(1);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('에러 발생 시 error 상태를 설정한다', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { message: '서버 오류' } },
      });

      await expect(store.fetchMenus(storeId)).rejects.toBeDefined();
      expect(store.error).toBe('서버 오류');
      expect(store.isLoading).toBe(false);
    });
  });

  describe('fetchMenusAdmin', () => {
    it('관리자용 메뉴를 조회한다', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          data: {
            categories: [
              {
                category: { id: 'cat-1', name: '음료', sortOrder: 0 },
                menus: [
                  { id: 'menu-1', name: '아메리카노', isActive: true },
                  { id: 'menu-2', name: '라떼', isActive: false },
                ],
              },
            ],
          },
        },
      });

      await store.fetchMenusAdmin(storeId);

      expect(store.allMenus).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(`/api/stores/${storeId}/menus?admin=true`);
    });
  });

  describe('createCategory', () => {
    it('카테고리를 생성하고 목록에 추가한다', async () => {
      apiClient.post.mockResolvedValue({
        data: { data: { id: 'cat-new', name: '디저트', sortOrder: 0 } },
      });

      const result = await store.createCategory(storeId, { name: '디저트' });

      expect(result.name).toBe('디저트');
      expect(store.categories).toHaveLength(1);
    });
  });

  describe('deleteCategory', () => {
    it('카테고리를 삭제하고 목록에서 제거한다', async () => {
      store.categories = [{ id: 'cat-1', name: '음료' }];
      store.menusByCategory = { 'cat-1': [] };
      apiClient.delete.mockResolvedValue({});

      await store.deleteCategory(storeId, 'cat-1');

      expect(store.categories).toHaveLength(0);
      expect(store.menusByCategory['cat-1']).toBeUndefined();
    });
  });

  describe('createMenu', () => {
    it('메뉴를 생성하고 목록에 추가한다', async () => {
      store.menusByCategory = {};
      apiClient.post.mockResolvedValue({
        data: { data: { id: 'menu-new', name: '아메리카노', categoryId: 'cat-1', price: 4500 } },
      });

      const result = await store.createMenu(storeId, {
        categoryId: 'cat-1', name: '아메리카노', price: 4500,
      });

      expect(result.name).toBe('아메리카노');
      expect(store.allMenus).toHaveLength(1);
      expect(store.menusByCategory['cat-1']).toHaveLength(1);
    });
  });

  describe('deleteMenu', () => {
    it('메뉴를 soft delete한다 (isActive=false)', async () => {
      store.allMenus = [{ id: 'menu-1', categoryId: 'cat-1', isActive: true }];
      store.menusByCategory = { 'cat-1': [{ id: 'menu-1', isActive: true }] };
      apiClient.delete.mockResolvedValue({});

      await store.deleteMenu(storeId, 'menu-1');

      expect(store.allMenus[0].isActive).toBe(false);
      expect(store.menusByCategory['cat-1'][0].isActive).toBe(false);
    });
  });

  describe('uploadImage', () => {
    it('이미지를 업로드하고 imageUrl을 업데이트한다', async () => {
      store.allMenus = [{ id: 'menu-1', imageUrl: null }];
      apiClient.post.mockResolvedValue({
        data: { data: { imageUrl: '/uploads/store-001/menus/menu-1_123.jpg' } },
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await store.uploadImage(storeId, 'menu-1', file);

      expect(result.imageUrl).toContain('menu-1');
      expect(store.allMenus[0].imageUrl).toBe(result.imageUrl);
    });
  });

  describe('getters', () => {
    it('activeMenusByCategory는 활성 메뉴만 반환한다', () => {
      store.menusByCategory = {
        'cat-1': [
          { id: 'menu-1', isActive: true },
          { id: 'menu-2', isActive: false },
        ],
      };

      expect(store.activeMenusByCategory['cat-1']).toHaveLength(1);
    });

    it('getCategoryById는 ID로 카테고리를 찾는다', () => {
      store.categories = [{ id: 'cat-1', name: '음료' }];
      expect(store.getCategoryById('cat-1').name).toBe('음료');
      expect(store.getCategoryById('cat-999')).toBeUndefined();
    });
  });
});
