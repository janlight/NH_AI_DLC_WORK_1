<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-lg font-bold mb-4">주문 삭제</h2>
      <p class="mb-4">주문 <strong>{{ orderNumber }}</strong>을(를) 삭제하시겠습니까?</p>
      <p class="text-sm text-red-500 mb-4">이 작업은 되돌릴 수 없습니다.</p>
      <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" @click="$emit('close')">취소</button>
        <button
          data-testid="order-delete-confirm-button"
          class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          :disabled="loading"
          @click="confirm"
        >
          {{ loading ? '삭제 중...' : '삭제' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../api/client';

const props = defineProps({ storeId: String, orderId: String, orderNumber: String });
const emit = defineEmits(['deleted', 'close']);

const error = ref('');
const loading = ref(false);

async function confirm() {
  loading.value = true;
  error.value = '';
  try {
    await apiClient.delete(`/api/stores/${props.storeId}/tables/orders/${props.orderId}`);
    emit('deleted');
  } catch (err) {
    error.value = err.response?.data?.error || '주문 삭제에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>
