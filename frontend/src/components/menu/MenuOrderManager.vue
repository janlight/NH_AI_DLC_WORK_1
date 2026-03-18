<template>
  <div data-testid="menu-order-manager">
    <h3 class="text-lg font-bold mb-3">메뉴 순서 관리</h3>

    <ul class="space-y-2">
      <li
        v-for="(menu, index) in sortedMenus"
        :key="menu.id"
        class="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
        :data-testid="`menu-order-item-${menu.id}`"
      >
        <div class="flex items-center gap-3">
          <span class="text-gray-400 text-sm w-6 text-center">{{ index + 1 }}</span>
          <span class="font-medium text-sm">{{ menu.name }}</span>
          <span v-if="!menu.isActive" class="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded">비활성</span>
        </div>
        <div class="flex gap-1">
          <button
            class="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :disabled="index === 0"
            aria-label="위로 이동"
            data-testid="menu-order-move-up-button"
            @click="move(index, -1)"
          >↑</button>
          <button
            class="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :disabled="index === sortedMenus.length - 1"
            aria-label="아래로 이동"
            data-testid="menu-order-move-down-button"
            @click="move(index, 1)"
          >↓</button>
        </div>
      </li>
    </ul>

    <button
      v-if="hasChanges"
      class="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg font-medium min-h-[44px]"
      data-testid="menu-order-save-button"
      @click="saveOrder"
    >
      순서 저장
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  menus: { type: Array, required: true },
});

const emit = defineEmits(['reorder']);

const localMenus = ref([]);
const hasChanges = ref(false);

const sortedMenus = computed(() => [...localMenus.value].sort((a, b) => a.sortOrder - b.sortOrder));

watch(
  () => props.menus,
  (newMenus) => {
    localMenus.value = newMenus.map((m) => ({ ...m }));
    hasChanges.value = false;
  },
  { immediate: true }
);

function move(index, direction) {
  const sorted = sortedMenus.value;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= sorted.length) return;

  const currentMenu = sorted[index];
  const targetMenu = sorted[newIndex];

  // sortOrder 교환
  const tempOrder = currentMenu.sortOrder;
  const cm = localMenus.value.find((m) => m.id === currentMenu.id);
  const tm = localMenus.value.find((m) => m.id === targetMenu.id);
  if (cm) cm.sortOrder = targetMenu.sortOrder;
  if (tm) tm.sortOrder = tempOrder;

  hasChanges.value = true;
}

function saveOrder() {
  const orders = localMenus.value.map((m) => ({
    menuId: m.id,
    sortOrder: m.sortOrder,
  }));
  emit('reorder', orders);
  hasChanges.value = false;
}
</script>
