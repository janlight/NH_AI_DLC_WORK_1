<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-lg font-bold mb-4">테이블 추가</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">테이블 번호</label>
        <input
          v-model.number="tableNumber"
          data-testid="table-setup-number-input"
          type="number"
          min="1"
          class="w-full border rounded px-3 py-2"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">비밀번호</label>
        <input
          v-model="password"
          data-testid="table-setup-password-input"
          type="password"
          class="w-full border rounded px-3 py-2"
        />
      </div>
      <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" @click="$emit('close')">취소</button>
        <button
          data-testid="table-setup-submit-button"
          class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? '생성 중...' : '생성' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../api/client';

const props = defineProps({ storeId: String });
const emit = defineEmits(['created', 'close']);

const tableNumber = ref(null);
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  if (!tableNumber.value || tableNumber.value < 1) {
    error.value = '테이블 번호는 1 이상이어야 합니다.';
    return;
  }
  if (!password.value) {
    error.value = '비밀번호를 입력해주세요.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await apiClient.post(`/api/stores/${props.storeId}/tables`, {
      tableNumber: tableNumber.value,
      password: password.value,
    });
    emit('created');
  } catch (err) {
    error.value = err.response?.data?.error || '테이블 생성에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>
