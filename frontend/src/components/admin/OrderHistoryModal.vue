<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">과거 주문 내역</h2>
        <button
          data-testid="history-close-button"
          class="text-gray-500 hover:text-gray-700 text-xl"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="flex gap-2 mb-4">
        <input
          v-model="startDate"
          data-testid="history-start-date"
          type="date"
          class="border rounded px-3 py-1"
        />
        <span class="self-center">~</span>
        <input
          v-model="endDate"
          data-testid="history-end-date"
          type="date"
          class="border rounded px-3 py-1"
        />
        <button
          data-testid="history-filter-button"
          class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          @click="loadHistory"
        >
          조회
        </button>
      </div>

      <div v-if="history.length === 0" class="text-center text-gray-500 py-8">
        과거 주문 내역이 없습니다.
      </div>

      <div v-for="item in history" :key="item.id" class="border rounded p-3 mb-3">
        <div class="flex justify-between mb-2">
          <span class="font-semibold">주문 #{{ item.orderNumber }}</span>
          <span class="text-sm text-gray-500">{{ formatDate(item.orderedAt) }}</span>
        </div>
        <ul class="text-sm mb-2">
          <li v-for="(menu, idx) in item.items" :key="idx">
            {{ menu.menuName }} × {{ menu.quantity }} — {{ (menu.price * menu.quantity).toLocaleString() }}원
          </li>
        </ul>
        <div class="flex justify-between text-sm">
          <span>총 {{ item.totalAmount.toLocaleString() }}원</span>
          <span class="text-gray-500">완료: {{ formatDate(item.completedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../../api/client';

const props = defineProps({ storeId: String, tableId: String });
defineEmits(['close']);

const history = ref([]);
const startDate = ref('');
const endDate = ref('');

async function loadHistory() {
  const params = {};
  if (startDate.value) params.startDate = startDate.value;
  if (endDate.value) params.endDate = endDate.value;
  const { data } = await apiClient.get(
    `/api/stores/${props.storeId}/tables/${props.tableId}/order-history`,
    { params }
  );
  history.value = data;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR');
}

onMounted(loadHistory);
</script>
