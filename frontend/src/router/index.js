/**
 * Vue Router 설정
 * Unit 1 기본 구조 + Unit 2 메뉴 라우트 추가
 */
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  // ============================================
  // Unit 1: core-auth (stub - 팀원 1 담당)
  // ============================================
  // { path: '/login', name: 'CustomerLogin', component: () => import('../views/customer/LoginView.vue') },
  // { path: '/admin/login', name: 'AdminLogin', component: () => import('../views/admin/LoginView.vue') },

  // ============================================
  // Unit 2: menu-management
  // ============================================
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('../views/customer/MenuView.vue'),
    meta: { requiresAuth: true, role: 'customer' },
  },
  {
    path: '/admin/menus',
    name: 'MenuManage',
    component: () => import('../views/admin/MenuManageView.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// TODO: Navigation guard (Unit 1에서 구현)
// router.beforeEach((to, from, next) => { ... });

export default router;
