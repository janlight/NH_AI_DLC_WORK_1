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
  // 다른 Unit에서 추가할 라우트 자리
  // { path: '/:storeSlug/menu', ... }  [Unit 2]
  // { path: '/:storeSlug/cart', ... }  [Unit 3]
  // { path: '/:storeSlug/orders', ... }  [Unit 3]
  // { path: '/admin/:storeSlug/dashboard', ... }  [Unit 3]
  // { path: '/admin/:storeSlug/menus', ... }  [Unit 2]
  // { path: '/admin/:storeSlug/tables', ... }  [Unit 4]
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
