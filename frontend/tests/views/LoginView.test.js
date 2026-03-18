import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import CustomerLoginView from '../../src/views/customer/LoginView.vue';
import AdminLoginView from '../../src/views/admin/LoginView.vue';

// apiClient mock
vi.mock('../../src/api/client.js', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function createMockRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: { template: '<div />' } },
      { path: '/admin/login', component: { template: '<div />' } },
      { path: '/:storeSlug/menu', component: { template: '<div />' } },
      { path: '/admin/:storeSlug/dashboard', component: { template: '<div />' } },
    ],
  });
}

describe('Customer LoginView', () => {
  let router;

  beforeEach(() => {
    setActivePinia(createPinia());
    router = createMockRouter();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('로그인 폼이 렌더링됨', () => {
    const wrapper = mount(CustomerLoginView, {
      global: { plugins: [router] },
    });

    expect(wrapper.find('[data-testid="customer-login-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="customer-login-store-slug"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="customer-login-table-number"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="customer-login-password"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="customer-login-submit"]').exists()).toBe(true);
  });

  it('관리자 로그인 링크가 존재함', () => {
    const wrapper = mount(CustomerLoginView, {
      global: { plugins: [router] },
    });

    expect(wrapper.find('[data-testid="customer-login-admin-link"]').exists()).toBe(true);
  });

  it('모든 입력 필드에 label이 연결됨', () => {
    const wrapper = mount(CustomerLoginView, {
      global: { plugins: [router] },
    });

    const labels = wrapper.findAll('label');
    expect(labels.length).toBeGreaterThanOrEqual(3);
    labels.forEach((label) => {
      const forAttr = label.attributes('for');
      expect(forAttr).toBeTruthy();
      expect(wrapper.find(`#${forAttr}`).exists()).toBe(true);
    });
  });

  it('submit 버튼 최소 높이 44px', () => {
    const wrapper = mount(CustomerLoginView, {
      global: { plugins: [router] },
    });

    const button = wrapper.find('[data-testid="customer-login-submit"]');
    expect(button.classes()).toContain('min-h-[44px]');
  });
});

describe('Admin LoginView', () => {
  let router;

  beforeEach(() => {
    setActivePinia(createPinia());
    router = createMockRouter();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('관리자 로그인 폼이 렌더링됨', () => {
    const wrapper = mount(AdminLoginView, {
      global: { plugins: [router] },
    });

    expect(wrapper.find('[data-testid="admin-login-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-login-store-slug"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-login-username"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-login-password"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-login-submit"]').exists()).toBe(true);
  });

  it('고객 로그인 링크가 존재함', () => {
    const wrapper = mount(AdminLoginView, {
      global: { plugins: [router] },
    });

    expect(wrapper.find('[data-testid="admin-login-customer-link"]').exists()).toBe(true);
  });

  it('모든 입력 필드에 label이 연결됨', () => {
    const wrapper = mount(AdminLoginView, {
      global: { plugins: [router] },
    });

    const labels = wrapper.findAll('label');
    expect(labels.length).toBeGreaterThanOrEqual(3);
    labels.forEach((label) => {
      const forAttr = label.attributes('for');
      expect(forAttr).toBeTruthy();
      expect(wrapper.find(`#${forAttr}`).exists()).toBe(true);
    });
  });
});
