<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-lg mx-auto px-4 py-3">
        <div class="flex gap-4">
          <button
            data-testid="order-tab-confirm"
            class="flex-1 py-2 text-center rounded-lg font-medium"
            :class="mode === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'"
            @click="mode = 'confirm'"
          >
            주문 확인
          </button>
          <button
            data-testid="order-tab-history"
            class="flex-1 py-2 text-center rounded-lg font-medium"
            :class="mode === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'"
            @click="mode = 'history'; loadOrders()"
          >
            주문 내역
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-4">
      <!-- 주문 확인 모드 -->
      <div v-if="mode === 'confirm'" data-testid="order-confirm-section">
        <div v-if="cartStore.isEmpty" class="text-center py-16">
          <p class="text-gray-500">장바구니가 비어있습니다</p>
          <router-link to="/customer/cart" class="text-blue-600 mt-2 inline-block">
            장바구니로 돌아가기
          </router-link>
        </div>

        <div v-else>
          <!-- 주문 내역 요약 -->
          <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 class="font-semibold text-gray-900 mb-3">주문 내역</h2>
            <ul class="divide-y">
              <li
                v-for="item in cartStore.items"
                :key="item.menuId"
                class="py-2 flex justify-between"
              >
                <div>
                  <span class="text-gray-900">{{ item.menuName }}</span>
                  <span class="text-gray-500 ml-2">x{{ item.quantity }}</span>
                </div>
                <span class="font-medium">{{ formatPrice(item.price * item.quantity) }}원</span>
              </li>
            </ul>
            <div class="border-t mt-3 pt-3 flex justify-between">
              <span class="font-semibold text-lg">총 금액</span>
              <span class="font-bold text-lg text-blue-600" data-testid="order-confirm-total">
                {{ formatPrice(cartStore.totalAmount) }}원
              </span>
            </div>
          </div>

          <!-- 주문 확정 버튼 -->
          <button
            data-testid="order-submit-button"
            class="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            :disabled="orderStore.loading"
            @click="submitOrder"
          >
            {{ orderStore.loading ? '주문 처리 중...' : '주문 확정' }}
          </button>

          <!-- 에러 메시지 -->
          <p v-if="orderStore.error" class="mt-3 text-red-500 text-center" data-testid="order-error">
            {{ orderStore.error.message }}
          </p>
        </div>
      </div>

      <!-- 주문 내역 모드 -->
      <div v-if="mode === 'history'" data-testid="order-history-section">
        <div v-if="orderStore.loading" class="text-center py-16">
          <p class="text-gray-500">주문 내역을 불러오는 중...</p>
        </div>

        <div v-else-if="orderStore.orders.length === 0" class="text-center py-16">
          <p class="text-gray-500">주문 내역이 없습니다</p>
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="order in orderStore.orders"
            :key="order.id"
            class="bg-white rounded-lg shadow-sm p-4"
            :data-testid="`order-card-${order.id}`"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium text-gray-900">{{ order.orderNumber }}</span>
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="statusBadgeClass(order.status)"
                :data-testid="`order-status-${order.id}`"
              >
                {{ statusLabel(order.status) }}
              </span>
            </div>
            <div class="text-sm text-gray-500 mb-2">
              {{ formatDateTime(order.createdAt) }}
            </div>
            <ul class="text-sm text-gray-700">
              <li v-for="item in order.items" :key="item.id" class="flex justify-between">
                <span>{{ item.menuName }} x{{ item.quantity }}</span>
                <span>{{ formatPrice(item.subtotal) }}원</span>
              </li>
            </ul>
            <div class="border-t mt-2 pt-2 flex justify-end">
              <span class="font-semibold">{{ formatPrice(order.totalAmount) }}원</span>
            </div>
          </li>
        </ul>
      </div>
    </main>

    <!-- 주문 성공 모달 -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="order-success-modal"
    >
      <div class="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">주문 완료</h2>
        <p class="text-2xl font-bold text-blue-600 mb-4" data-testid="order-success-number">
          {{ orderResult?.orderNumber }}
        </p>
        <p class="text-gray-500 mb-6">
          {{ redirectCountdown }}초 후 메뉴 화면으로 이동합니다
        </p>
        <button
          data-testid="order-success-go-menu"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          @click="goToMenu"
        >
          바로 이동
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useOrderStore } from '../../stores/orderStore';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const mode = ref(route.query.mode || 'confirm');
const showSuccessModal = ref(false);
const orderResult = ref(null);
const redirectCountdown = ref(5);
let countdownTimer = null;

function formatPrice(price) {
  return price.toLocaleString('ko-KR');
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR');
}

function statusLabel(status) {
  const labels = { PENDING: '대기중', PREPARING: '준비중', COMPLETED: '완료' };
  return labels[status] || status;
}

function statusBadgeClass(status) {
  const classes = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PREPARING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

async function submitOrder() {
  try {
    const items = cartStore.items.map((i) => ({ menuId: i.menuId, quantity: i.quantity }));
    const result = await orderStore.createOrder(cartStore.storeId, cartStore.tableId, items);
    orderResult.value = result;
    showSuccessModal.value = true;
    startCountdown();
  } catch {
    // 에러는 orderStore.error에 설정됨
  }
}

function startCountdown() {
  redirectCountdown.value = 5;
  countdownTimer = setInterval(() => {
    redirectCountdown.value -= 1;
    if (redirectCountdown.value <= 0) {
      goToMenu();
    }
  }, 1000);
}

function goToMenu() {
  if (countdownTimer) clearInterval(countdownTimer);
  showSuccessModal.value = false;
  router.push('/customer/menu');
}

function loadOrders() {
  orderStore.fetchTableOrders(cartStore.storeId, cartStore.tableId);
}

onMounted(() => {
  if (mode.value === 'history') {
    loadOrders();
  }
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>
