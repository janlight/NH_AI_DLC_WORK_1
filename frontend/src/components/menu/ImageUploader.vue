<template>
  <div data-testid="image-uploader">
    <label class="block text-sm font-medium text-gray-700 mb-1">이미지</label>

    <!-- 미리보기 -->
    <div v-if="previewUrl" class="relative w-32 h-32 mb-2">
      <img :src="previewUrl" alt="메뉴 이미지 미리보기" class="w-full h-full object-cover rounded-lg" />
      <button
        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[44px] min-h-[44px]"
        data-testid="image-uploader-remove-button"
        aria-label="이미지 제거"
        @click="removeImage"
      >
        ✕
      </button>
    </div>

    <!-- 파일 선택 -->
    <div v-else>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png"
        class="hidden"
        data-testid="image-uploader-file-input"
        @change="handleFileSelect"
      />
      <button
        class="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 text-sm min-h-[44px]"
        data-testid="image-uploader-select-button"
        @click="$refs.fileInput.click()"
      >
        📷 이미지 선택 (JPG/PNG, 5MB 이하)
      </button>
    </div>

    <p v-if="error" class="text-red-500 text-xs mt-1" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentImageUrl: { type: String, default: null },
});

const emit = defineEmits(['select', 'remove']);

const selectedFile = ref(null);
const error = ref('');

const previewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  return props.currentImageUrl;
});

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  error.value = '';

  // 클라이언트 검증
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    error.value = 'JPG 또는 PNG 형식만 가능합니다.';
    return;
  }
  if (file.size > 5242880) {
    error.value = '5MB 이하의 이미지만 업로드 가능합니다.';
    return;
  }

  selectedFile.value = file;
  emit('select', file);
}

function removeImage() {
  selectedFile.value = null;
  error.value = '';
  emit('remove');
}
</script>
