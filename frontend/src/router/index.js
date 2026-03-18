import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const routes = [
  {
    path: '/login',
    name: 'CustomerLogin',
    component: () => import('../views/customer/LoginView.vue'),
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/LoginView.vue'),
  },
  // Unit 2: menu-management
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
  // Unit 3, Unit 4 라우트는 이후 merge에서 추가
  {
    path: '/',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 고객 인증 필요 라우트
  if (to.meta.requiresCustomerAuth && (!authStore.isAuthenticated || !authStore.isCustomer)) {
    return next('/login');
  }

  // 관리자 인증 필요 라우트
  if (to.meta.requiresAdminAuth && (!authStore.isAuthenticated || !authStore.isAdmin)) {
    return next('/admin/login');
  }

  next();
});

export default router;
