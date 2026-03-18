/**
 * MenuView 컴포넌트 단위 테스트
 * Unit 2: menu-management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MenuView from '../../../src/views/customer/MenuView.vue';
import { useMenuStore } from '../../../src/stores/menuStore';

vi.mock('../../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MenuView', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMenuStore();
    vi.clearAllMocks();
  });

  it('로딩 중일 때 로딩 인디케이터를 표시한다', () => {
    store.isLoading = true;

    const wrapper = mount(MenuView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it('에러 발생 시 에러 메시지와 재시도 버튼을 표시한다', () => {
    store.isLoading = false;
    store.error = '서버 오류';

    const wrapper = mount(MenuView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('서버 오류');
    expect(wrapper.find('[data-testid="menu-view-retry-button"]').exists()).toBe(true);
  });

  it('메뉴가 없을 때 빈 상태 메시지를 표시한다', () => {
    store.isLoading = false;
    store.error = null;
    store.categories = [];

    const wrapper = mount(MenuView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.text()).toContain('등록된 메뉴가 없습니다');
  });

  it('카테고리와 메뉴를 정상적으로 렌더링한다', () => {
    store.isLoading = false;
    store.error = null;
    store.categories = [{ id: 'cat-1', name: '음료', sortOrder: 0 }];
    store.menusByCategory = {
      'cat-1': [{ id: 'menu-1', name: '아메리카노', price: 4500, isActive: true }],
    };

    const wrapper = mount(MenuView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.text()).toContain('음료');
    expect(wrapper.text()).toContain('아메리카노');
  });

  it('data-testid가 올바르게 설정된다', () => {
    store.isLoading = false;
    store.categories = [];

    const wrapper = mount(MenuView, {
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('[data-testid="menu-view"]').exists()).toBe(true);
  });
});
