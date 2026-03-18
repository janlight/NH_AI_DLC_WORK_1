import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const routes = [
  // Unit 1: core-auth
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
  // Unit 3: order-sse (추후 추가)
  // Unit 4: table-session (추후 추가)
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

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      const role = to.meta.role;
      return next(role === 'admin' ? '/admin/login' : '/login');
    }
  }

  if (to.meta.requiresCustomerAuth && (!authStore.isAuthenticated || !authStore.isCustomer)) {
    return next('/login');
  }

  if (to.meta.requiresAdminAuth && (!authStore.isAuthenticated || !authStore.isAdmin)) {
    return next('/admin/login');
  }

  next();
});

export default router;
