<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">테이블 관리</h1>
      <button
        data-testid="table-add-button"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="showSetup = true"
      >
        테이블 추가
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="table in tables"
        :key="table.id"
        :data-testid="`table-card-${table.tableNumber}`"
        class="border rounded-lg p-4 shadow-sm"
      >
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold text-lg">테이블 {{ table.tableNumber }}</span>
          <span class="text-sm text-gray-500">
            {{ table.currentSessionId ? '이용중' : '비어있음' }}
          </span>
        </div>
        <p class="text-xl font-semibold mb-3">{{ table.currentTotal.toLocaleString() }}원</p>
        <p class="text-sm text-gray-500 mb-3">주문 {{ table.orderCount }}건</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-if="table.currentSessionId"
            data-testid="table-complete-button"
            class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            @click="confirmComplete(table)"
          >
            이용 완료
          </button>
          <button
            data-testid="table-history-button"
            class="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
            @click="showHistory(table)"
          >
            과거 내역
          </button>
        </div>
      </div>
    </div>

    <TableSetupModal
      v-if="showSetup"
      :store-id="storeId"
      @created="onTableCreated"
      @close="showSetup = false"
    />
    <TableCompleteConfirm
      v-if="completeTarget"
      :table-id="completeTarget.id"
      :table-number="completeTarget.tableNumber"
      :store-id="storeId"
      @completed="onCompleted"
      @close="completeTarget = null"
    />
    <OrderHistoryModal
      v-if="historyTarget"
      :store-id="storeId"
      :table-id="historyTarget.id"
      @close="historyTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../../api/client';
import TableSetupModal from '../../components/admin/TableSetupModal.vue';
import TableCompleteConfirm from '../../components/admin/TableCompleteConfirm.vue';
import OrderHistoryModal from '../../components/admin/OrderHistoryModal.vue';

const route = useRoute();
const storeId = route.params.storeId;
const tables = ref([]);
const showSetup = ref(false);
const completeTarget = ref(null);
const historyTarget = ref(null);

async function loadTables() {
  const { data } = await apiClient.get(`/api/stores/${storeId}/tables`);
  tables.value = data;
}

function confirmComplete(table) {
  completeTarget.value = table;
}

function showHistory(table) {
  historyTarget.value = table;
}

function onTableCreated() {
  showSetup.value = false;
  loadTables();
}

function onCompleted() {
  completeTarget.value = null;
  loadTables();
}

onMounted(loadTables);
</script>
