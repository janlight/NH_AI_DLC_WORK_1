<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-lg font-bold mb-4">이용 완료</h2>
      <p class="mb-4">테이블 <strong>{{ tableNumber }}</strong>번의 이용을 완료하시겠습니까?</p>
      <p class="text-sm text-gray-500 mb-4">현재 주문이 과거 내역으로 이동되고 테이블이 초기화됩니다.</p>
      <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" @click="$emit('close')">취소</button>
        <button
          data-testid="table-complete-confirm-button"
          class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          :disabled="loading"
          @click="confirm"
        >
          {{ loading ? '처리 중...' : '이용 완료' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../api/client';
import { conflictRetry } from '../../utils/conflictRetry';

const props = defineProps({ storeId: String, tableId: String, tableNumber: Number });
const emit = defineEmits(['completed', 'close']);

const error = ref('');
const loading = ref(false);

async function confirm() {
  loading.value = true;
  error.value = '';
  try {
    await conflictRetry(() =>
      apiClient.post(`/api/stores/${props.storeId}/tables/${props.tableId}/complete`)
    );
    emit('completed');
  } catch (err) {
    if (err.response?.status === 409) {
      error.value = err.response.data.message;
    } else {
      error.value = err.response?.data?.error || '이용 완료 처리에 실패했습니다.';
    }
  } finally {
    loading.value = false;
  }
}
</script>
