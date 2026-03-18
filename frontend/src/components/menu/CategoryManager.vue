<template>
  <div data-testid="category-manager">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold">카테고리 관리</h3>
      <button
        class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm min-h-[44px]"
        data-testid="category-manager-add-button"
        @click="showForm = true; editingCategory = null; formName = ''"
      >
        + 카테고리 추가
      </button>
    </div>

    <!-- 카테고리 목록 -->
    <ul class="space-y-2">
      <li
        v-for="(category, index) in categories"
        :key="category.id"
        class="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
        :data-testid="`category-item-${category.id}`"
      >
        <span class="font-medium">{{ category.name }}</span>
        <div class="flex gap-2">
          <button
            class="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :disabled="index === 0"
            aria-label="위로 이동"
            data-testid="category-move-up-button"
            @click="moveCategory(index, -1)"
          >↑</button>
          <button
            class="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :disabled="index === categories.length - 1"
            aria-label="아래로 이동"
            data-testid="category-move-down-button"
            @click="moveCategory(index, 1)"
          >↓</button>
          <button
            class="text-blue-500 hover:text-blue-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="수정"
            data-testid="category-edit-button"
            @click="startEdit(category)"
          >✏️</button>
          <button
            class="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="삭제"
            data-testid="category-delete-button"
            @click="$emit('delete', category.id)"
          >🗑️</button>
        </div>
      </li>
    </ul>

    <!-- 카테고리 추가/수정 폼 -->
    <div v-if="showForm" class="mt-4 bg-white p-4 rounded-lg shadow-sm">
      <label for="category-name" class="block text-sm font-medium text-gray-700 mb-1">
        카테고리명
      </label>
      <div class="flex gap-2">
        <input
          id="category-name"
          v-model="formName"
          type="text"
          maxlength="50"
          class="flex-1 border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          placeholder="카테고리명 입력"
          data-testid="category-form-name-input"
        />
        <button
          class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm min-h-[44px]"
          data-testid="category-form-submit-button"
          @click="submitForm"
        >
          {{ editingCategory ? '수정' : '추가' }}
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-lg text-sm min-h-[44px]"
          data-testid="category-form-cancel-button"
          @click="showForm = false"
        >
          취소
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  categories: { type: Array, required: true },
});

const emit = defineEmits(['create', 'update', 'delete', 'reorder']);

const showForm = ref(false);
const editingCategory = ref(null);
const formName = ref('');

function startEdit(category) {
  editingCategory.value = category;
  formName.value = category.name;
  showForm.value = true;
}

function submitForm() {
  if (!formName.value.trim()) return;
  if (editingCategory.value) {
    emit('update', editingCategory.value.id, { name: formName.value.trim() });
  } else {
    emit('create', { name: formName.value.trim() });
  }
  showForm.value = false;
  formName.value = '';
  editingCategory.value = null;
}

function moveCategory(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= props.categories.length) return;

  const orders = props.categories.map((cat, i) => ({
    categoryId: cat.id,
    sortOrder: i === index ? newIndex : i === newIndex ? index : i,
  }));
  emit('reorder', orders);
}
</script>
