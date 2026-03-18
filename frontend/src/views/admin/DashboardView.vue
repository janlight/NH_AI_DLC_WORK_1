<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">주문 대시보드</h1>
        <!-- SSE 연결 상태 -->
        <div class="flex items-center gap-2" data-testid="dashboard-sse-status">
          <span
            class="w-3 h-3 rounded-full"
            :class="{
              'bg-green-500': sseStatus === 'connected',
              'bg-yellow-500 animate-pulse': sseStatus === 'reconnecting',
              'bg-red-500': sseStatus === 'disconnected'
            }"
          ></span>
          <span class="text-sm text-gray-600">
            {{ sseStatusLabel }}
          </span>
          <button
            v-if="sseStatus === 'disconnected'"
            data-testid="dashboard-reconnect-button"
            class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            @click="manualReconnect"
          >
            다시 연결
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- 로딩 -->
      <div v-if="orderStore.loading && orderStore.storeOrders.length === 0" class="text-center py-16">
        <p class="text-gray-500">주문 데이터를 불러오는 중...</p>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="orderStore.storeOrders.length === 0" class="text-center py-16">
        <p class="text-gray-500">현재 활성 주문이 없습니다</p>
      </div>

      <!-- 테이블 그리드 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="table in orderStore.storeOrders"
          :key="table.tableId"
          class="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          :class="{ 'ring-2 ring-blue-500 animate-pulse': highlightedTables.has(table.tableId) }"
          :data-testid="`dashboard-table-${table.tableId}`"
          @click="selectTable(table)"
        >
          <!-- 테이블 헤더 -->
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-lg text-gray-900">
              테이블 {{ table.tableNumber }}
            </h3>
            <span class="text-sm text-gray-500">{{ table.orderCount }}건</span>
          </div>

          <!-- 총 주문액 -->
          <p class="text-2xl font-bold text-blue-600 mb-3" :data-testid="`dashboard-total-${table.tableId}`">
            {{ formatPrice(table.totalAmount) }}원
          </p>

          <!-- 최신 3개 주문 미리보기 -->
          <ul class="space-y-2">
            <li
              v-for="order in table.recentOrders"
              :key="order.id"
              class="flex justify-between items-center text-sm"
              :data-testid="`dashboard-order-${order.id}`"
            >
              <span class="text-gray-700">{{ order.orderNumber }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="statusBadgeClass(order.status)"
              >
                {{ statusLabel(order.status) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <!-- 주문 상세 모달 -->
    <div
      v-if="showOrderDetail && selectedTable"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="dashboard-order-detail-modal"
      @click.self="showOrderDetail = false"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">테이블 {{ selectedTable.tableNumber }} 주문</h2>
            <button
              data-testid="dashboard-modal-close"
              class="text-gray-400 hover:text-gray-600 p-1"
              style="min-width: 44px; min-height: 44px;"
              @click="showOrderDetail = false"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <ul class="space-y-4">
            <li
              v-for="order in selectedTable.recentOrders"
              :key="order.id"
              class="border rounded-lg p-4"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ order.orderNumber }}</span>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="statusBadgeClass(order.status)"
                >
                  {{ statusLabel(order.status) }}
                </span>
              </div>

              <!-- 메뉴 목록 -->
              <ul v-if="order.items" class="text-sm text-gray-700 mb-3">
                <li v-for="item in order.items" :key="item.id" class="flex justify-between py-1">
                  <span>{{ item.menuName }} x{{ item.quantity }}</span>
                  <span>{{ formatPrice(item.subtotal) }}원</span>
                </li>
              </ul>

              <div class="flex justify-between items-center border-t pt-2">
                <span class="font-semibold">{{ formatPrice(order.totalAmount) }}원</span>
                <div class="flex gap-2">
                  <!-- 상태 변경 버튼 -->
                  <button
                    v-if="order.status === 'PENDING'"
                    :data-testid="`dashboard-prepare-${order.id}`"
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    style="min-height: 44px;"
                    @click="changeStatus(order.id, 'PREPARING')"
                  >
                    준비 시작
                  </button>
                  <button
                    v-if="order.status === 'PREPARING'"
                    :data-testid="`dashboard-complete-${order.id}`"
                    class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    style="min-height: 44px;"
                    @click="changeStatus(order.id, 'COMPLETED')"
                  >
                    완료
                  </button>
                  <!-- 삭제 버튼 -->
                  <button
                    :data-testid="`dashboard-delete-${order.id}`"
                    class="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                    style="min-height: 44px;"
                    @click="confirmDelete(order)"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 팝업 -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="dashboard-delete-confirm"
    >
      <div class="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
        <p class="text-lg font-medium mb-2">주문 삭제</p>
        <p class="text-gray-500 mb-6">
          {{ deleteTarget?.orderNumber }} 주문을 삭제하시겠습니까?
        </p>
        <div class="flex gap-3">
          <button
            data-testid="dashboard-delete-cancel"
            class="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            @click="showDeleteConfirm = false"
          >
            취소
          </button>
          <button
            data-testid="dashboard-delete-confirm-button"
            class="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            @click="executeDelete"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useOrderStore } from '../../stores/orderStore';
import { useSSE } from '../../composables/useSSE';

// TODO: storeId를 authStore 또는 route params에서 가져오기
const storeId = ref('');

const orderStore = useOrderStore();

const selectedTable = ref(null);
const showOrderDetail = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref(null);
const highlightedTables = ref(new Set());

// SSE 연결
const { status: sseStatus, connect: sseConnect, manualReconnect: sseManualReconnect } = useSSE(storeId.value, {
  onNewOrder(data) {
    orderStore.handleNewOrder(data);
    // 3초간 테이블 하이라이트
    highlightedTables.value.add(data.tableId);
    setTimeout(() => highlightedTables.value.delete(data.tableId), 3000);
  },
  onOrderStatus(data) {
    orderStore.handleOrderStatus(data);
  },
  onOrderDeleted(data) {
    orderStore.handleOrderDeleted(data);
  },
  onTableCompleted(data) {
    orderStore.handleTableCompleted(data);
  }
});

const sseStatusLabel = computed(() => {
  const labels = { connected: '연결됨', reconnecting: '재연결 중...', disconnected: '연결 끊김' };
  return labels[sseStatus.value] || '';
});

function formatPrice(price) {
  return price.toLocaleString('ko-KR');
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

function selectTable(table) {
  selectedTable.value = table;
  showOrderDetail.value = true;
}

async function changeStatus(orderId, status) {
  try {
    await orderStore.updateStatus(storeId.value, orderId, status);
  } catch {
    // 에러는 orderStore.error에 설정됨
  }
}

function confirmDelete(order) {
  deleteTarget.value = order;
  showDeleteConfirm.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  try {
    await orderStore.removeOrder(storeId.value, deleteTarget.value.id);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  } catch {
    // 에러 처리
  }
}

function manualReconnect() {
  sseManualReconnect();
}

onMounted(() => {
  // TODO: storeId를 authStore에서 가져온 후 초기 데이터 로드 및 SSE 연결
  // orderStore.fetchStoreOrders(storeId.value);
  // sseConnect();
});
</script>
