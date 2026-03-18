<template>
  <Teleport to="body">
    <div
      v-if="visible && menu"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-testid="menu-detail-modal"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="$emit('close')"
        aria-hidden="true"
      />

      <!-- Modal -->
      <div
        class="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        :aria-label="`${menu.name} 상세 정보`"
      >
        <!-- 이미지 -->
        <div class="aspect-video bg-gray-100 relative">
          <img
            v-if="menu.imageUrl"
            :src="menu.imageUrl"
            :alt="menu.name"
            class="w-full h-full object-cover"
          />
          <button
            class="absolute top-3 right-3 bg-white/80 rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            data-testid="menu-detail-close-button"
            aria-label="닫기"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- 정보 -->
        <div class="p-5">
          <h2 class="text-xl font-bold text-gray-900">{{ menu.name }}</h2>
          <p class="text-2xl font-bold text-orange-600 mt-2">
            {{ menu.price.toLocaleString() }}원
          </p>
          <p v-if="menu.description" class="text-gray-600 mt-3 text-sm leading-relaxed">
            {{ menu.description }}
          </p>

          <!-- 수량 선택 -->
          <div class="flex items-center justify-center gap-4 mt-6">
            <button
              class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg min-w-[44px] min-h-[44px]"
              data-testid="menu-detail-decrease-button"
              aria-label="수량 감소"
              :disabled="quantity <= 1"
              @click="quantity > 1 && quantity--"
            >
              −
            </button>
            <span class="text-xl font-bold w-8 text-center" aria-live="polite">{{ quantity }}</span>
            <button
              class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg min-w-[44px] min-h-[44px]"
              data-testid="menu-detail-increase-button"
              aria-label="수량 증가"
              @click="quantity++"
            >
              +
            </button>
          </div>

          <!-- 장바구니 추가 -->
          <button
            class="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg font-bold text-lg min-h-[44px] hover:bg-orange-600 transition-colors"
            data-testid="menu-detail-add-to-cart-button"
            @click="$emit('addToCart', menu, quantity); quantity = 1"
          >
            {{ (menu.price * quantity).toLocaleString() }}원 담기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  menu: { type: Object, default: null },
  visible: { type: Boolean, default: false },
});

defineEmits(['close', 'addToCart']);

const quantity = ref(1);
</script>
