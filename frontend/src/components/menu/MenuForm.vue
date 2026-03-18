<template>
  <div class="bg-white p-6 rounded-lg shadow-sm" data-testid="menu-form">
    <h3 class="text-lg font-bold mb-4">{{ menu ? '메뉴 수정' : '메뉴 추가' }}</h3>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 카테고리 선택 -->
      <div>
        <label for="menu-category" class="block text-sm font-medium text-gray-700 mb-1">
          카테고리 <span class="text-red-500">*</span>
        </label>
        <select
          id="menu-category"
          v-model="form.categoryId"
          class="w-full border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          data-testid="menu-form-category-select"
          required
        >
          <option value="" disabled>카테고리를 선택해주세요</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        <p v-if="errors.categoryId" class="text-red-500 text-xs mt-1">{{ errors.categoryId }}</p>
      </div>

      <!-- 메뉴명 -->
      <div>
        <label for="menu-name" class="block text-sm font-medium text-gray-700 mb-1">
          메뉴명 <span class="text-red-500">*</span>
        </label>
        <input
          id="menu-name"
          v-model="form.name"
          type="text"
          maxlength="100"
          class="w-full border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          placeholder="메뉴명 입력"
          data-testid="menu-form-name-input"
          required
        />
        <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
      </div>

      <!-- 가격 -->
      <div>
        <label for="menu-price" class="block text-sm font-medium text-gray-700 mb-1">
          가격 (원) <span class="text-red-500">*</span>
        </label>
        <input
          id="menu-price"
          v-model.number="form.price"
          type="number"
          min="100"
          max="500000"
          step="100"
          class="w-full border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          placeholder="가격 입력"
          data-testid="menu-form-price-input"
          required
        />
        <p v-if="errors.price" class="text-red-500 text-xs mt-1">{{ errors.price }}</p>
      </div>

      <!-- 설명 -->
      <div>
        <label for="menu-description" class="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          id="menu-description"
          v-model="form.description"
          maxlength="500"
          rows="3"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="메뉴 설명 (선택)"
          data-testid="menu-form-description-input"
        />
      </div>

      <!-- 이미지 -->
      <ImageUploader
        :current-image-url="menu?.imageUrl"
        @select="(file) => (imageFile = file)"
        @remove="imageFile = null"
      />

      <!-- 버튼 -->
      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          class="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium min-h-[44px] hover:bg-orange-600"
          data-testid="menu-form-submit-button"
        >
          {{ menu ? '수정' : '등록' }}
        </button>
        <button
          type="button"
          class="flex-1 bg-gray-200 py-2 rounded-lg font-medium min-h-[44px] hover:bg-gray-300"
          data-testid="menu-form-cancel-button"
          @click="$emit('cancel')"
        >
          취소
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watchEffect } from 'vue';
import ImageUploader from './ImageUploader.vue';

const props = defineProps({
  menu: { type: Object, default: null },
  categories: { type: Array, required: true },
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({
  categoryId: '',
  name: '',
  price: null,
  description: '',
});

const errors = reactive({
  categoryId: '',
  name: '',
  price: '',
});

const imageFile = ref(null);

// 수정 모드: 기존 데이터 채우기
watchEffect(() => {
  if (props.menu) {
    form.categoryId = props.menu.categoryId || '';
    form.name = props.menu.name || '';
    form.price = props.menu.price || null;
    form.description = props.menu.description || '';
  }
});

function validate() {
  let valid = true;
  errors.categoryId = '';
  errors.name = '';
  errors.price = '';

  if (!form.categoryId) {
    errors.categoryId = '카테고리를 선택해주세요.';
    valid = false;
  }
  if (!form.name.trim()) {
    errors.name = '메뉴명을 입력해주세요.';
    valid = false;
  }
  if (!form.price || form.price < 100 || form.price > 500000) {
    errors.price = '가격은 100원 이상 500,000원 이하여야 합니다.';
    valid = false;
  }
  return valid;
}

function handleSubmit() {
  if (!validate()) return;
  emit('submit', { ...form, imageFile: imageFile.value });
}
</script>
