<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-900">장바구니</h1>
        <button
          v-if="!cartStore.isEmpty"
          data-testid="cart-clear-button"
          class="text-sm text-red-500 hover:text-red-700"
          @click="confirmClear"
        >
          전체 삭제
        </button>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-4">
      <!-- 빈 장바구니 -->
      <div v-if="cartStore.isEmpty" class="text-center py-16" data-testid="cart-empty-message">
        <p class="text-gray-500 mb-4">장바구니가 비어있습니다</p>
        <router-link
          to="/customer/menu"
          class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="cart-go-menu-link"
        >
          메뉴 보기
        </router-link>
      </div>

      <!-- 장바구니 항목 목록 -->
      <ul v-else class="space-y-3">
        <li
          v-for="item in cartStore.items"
          :key="item.menuId"
          class="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3"
          :data-testid="`cart-item-${item.menuId}`"
        >
          <!-- 메뉴 이미지 -->
          <div class="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.menuName"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- 메뉴 정보 -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ item.menuName }}</p>
            <p class="text-sm text-gray-500">{{ formatPrice(item.price) }}원</p>
          </div>

          <!-- 수량 조절 -->
          <div class="flex items-center gap-2">
            <button
              :data-testid="`cart-decrease-${item.menuId}`"
              class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              style="min-width: 44px; min-height: 44px;"
              @click="cartStore.updateQuantity(item.menuId, item.quantity - 1)"
              :aria-label="`${item.menuName} 수량 감소`"
            >
              −
            </button>
            <span class="w-8 text-center font-medium" :data-testid="`cart-quantity-${item.menuId}`">
              {{ item.quantity }}
            </span>
            <button
              :data-testid="`cart-increase-${item.menuId}`"
              class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              style="min-width: 44px; min-height: 44px;"
              @click="cartStore.updateQuantity(item.menuId, item.quantity + 1)"
              :aria-label="`${item.menuName} 수량 증가`"
            >
              +
            </button>
          </div>

          <!-- 소계 -->
          <div class="text-right min-w-[70px]">
            <p class="font-semibold text-gray-900">{{ formatPrice(item.price * item.quantity) }}원</p>
          </div>

          <!-- 삭제 -->
          <button
            :data-testid="`cart-remove-${item.menuId}`"
            class="text-gray-400 hover:text-red-500 p-1"
            style="min-width: 44px; min-height: 44px;"
            @click="cartStore.removeItem(item.menuId)"
            :aria-label="`${item.menuName} 삭제`"
          >
            ✕
          </button>
        </li>
      </ul>
    </main>

    <!-- 하단 고정 바 -->
    <div
      v-if="!cartStore.isEmpty"
      class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
    >
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">총 {{ cartStore.itemCount }}개</p>
          <p class="text-xl font-bold text-gray-900" data-testid="cart-total-amount">
            {{ formatPrice(cartStore.totalAmount) }}원
          </p>
        </div>
        <router-link
          to="/customer/orders?mode=confirm"
          data-testid="cart-order-button"
          class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          주문하기
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../../stores/cartStore';

const cartStore = useCartStore();

function formatPrice(price) {
  return price.toLocaleString('ko-KR');
}

function confirmClear() {
  if (window.confirm('장바구니를 비우시겠습니까?')) {
    cartStore.clearCart();
  }
}
</script>
