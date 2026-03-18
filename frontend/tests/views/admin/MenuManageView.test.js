/**
 * MenuManageView 컴포넌트 단위 테스트
 * Unit 2: menu-management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MenuManageView from '../../../src/views/admin/MenuManageView.vue';
import { useMenuStore } from '../../../src/stores/menuStore';

vi.mock('../../../src/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: { categories: [] } } }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MenuManageView', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMenuStore();
    vi.clearAllMocks();
  });

  it('로딩 중일 때 로딩 인디케이터를 표시한다', () => {
    store.isLoading = true;

    const wrapper = mount(MenuManageView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it('메뉴 추가 버튼이 존재한다', () => {
    store.isLoading = false;
    store.categories = [];
    store.allMenus = [];

    const wrapper = mount(MenuManageView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[data-testid="menu-manage-add-button"]').exists()).toBe(true);
  });

  it('메뉴 목록 테이블을 렌더링한다', () => {
    store.isLoading = false;
    store.categories = [{ id: 'cat-1', name: '음료', sortOrder: 0 }];
    store.allMenus = [
      { id: 'menu-1', name: '아메리카노', categoryId: 'cat-1', price: 4500, isActive: true },
    ];
    store.menusByCategory = {
      'cat-1': [{ id: 'menu-1', name: '아메리카노', categoryId: 'cat-1', price: 4500, isActive: true }],
    };

    const wrapper = mount(MenuManageView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[data-testid="menu-manage-table"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('아메리카노');
    expect(wrapper.text()).toContain('4,500원');
  });

  it('비활성 메뉴에 비활성 뱃지를 표시한다', () => {
    store.isLoading = false;
    store.categories = [{ id: 'cat-1', name: '음료', sortOrder: 0 }];
    store.allMenus = [
      { id: 'menu-1', name: '라떼', categoryId: 'cat-1', price: 5000, isActive: false },
    ];

    const wrapper = mount(MenuManageView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.text()).toContain('비활성');
  });

  it('data-testid가 올바르게 설정된다', () => {
    store.isLoading = false;
    store.categories = [];
    store.allMenus = [];

    const wrapper = mount(MenuManageView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[data-testid="menu-manage-view"]').exists()).toBe(true);
  });
});
