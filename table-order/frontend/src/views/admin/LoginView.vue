<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-2">매장 관리</h1>
      <p class="text-center text-gray-500 mb-6 text-sm">관리자 로그인</p>

      <form @submit.prevent="handleLogin" data-testid="admin-login-form">
        <div class="mb-4">
          <label for="storeSlug" class="block text-sm font-medium text-gray-700 mb-1">
            매장 식별자
          </label>
          <input
            id="storeSlug"
            v-model="storeSlug"
            type="text"
            placeholder="예: sample-store"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            data-testid="admin-login-store-slug"
            required
          />
        </div>

        <div class="mb-4">
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
            사용자명
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="사용자명 입력"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            data-testid="admin-login-username"
            required
          />
        </div>

        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="비밀번호 입력"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
            data-testid="admin-login-password"
            required
          />
        </div>

        <div
          v-if="errorMessage"
          role="alert"
          aria-live="polite"
          class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          data-testid="admin-login-error"
        >
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          data-testid="admin-login-submit"
        >
          {{ isLoading ? '로그인 중...' : '관리자 로그인' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <router-link
          to="/login"
          class="text-sm text-gray-500 hover:text-gray-700"
          data-testid="admin-login-customer-link"
        >
          고객 로그인으로 이동
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';

const router = useRouter();
const authStore = useAuthStore();

const storeSlug = ref('');
const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  const token = localStorage.getItem('admin_auth_token');
  if (token) {
    const success = await authStore.checkAuth();
    if (success && authStore.isAdmin) {
      router.push(`/admin/${authStore.user.storeId}/dashboard`);
    }
  }
});

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await authStore.adminLogin(storeSlug.value, username.value, password.value);
    router.push(`/admin/${storeSlug.value}/dashboard`);
  } catch (err) {
    const status = err.response?.status;
    if (status === 429) {
      const retryAfter = err.response?.data?.error?.details?.retryAfter;
      const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 15;
      errorMessage.value = `로그인 시도 제한 초과. ${minutes}분 후 다시 시도해주세요.`;
    } else {
      errorMessage.value = err.response?.data?.error?.message || '로그인에 실패했습니다.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
