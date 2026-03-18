<template>
  <nav
    class="flex overflow-x-auto gap-2 pb-2 scrollbar-hide"
    role="tablist"
    aria-label="카테고리 탭"
    data-testid="category-tabs"
  >
    <button
      v-for="category in categories"
      :key="category.id"
      role="tab"
      :aria-selected="activeCategoryId === category.id"
      :class="[
        'px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium min-h-[44px] transition-colors',
        activeCategoryId === category.id
          ? 'bg-orange-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ]"
      :data-testid="`category-tab-${category.id}`"
      @click="$emit('select', category.id)"
    >
      {{ category.name }}
    </button>
  </nav>
</template>

<script setup>
defineProps({
  categories: { type: Array, required: true },
  activeCategoryId: { type: String, default: null },
});

defineEmits(['select']);
</script>
