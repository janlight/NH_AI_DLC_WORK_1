<template>
  <section :data-testid="`menu-grid-${categoryName}`">
    <h2 class="text-lg font-bold text-gray-900 mb-3">{{ categoryName }}</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <MenuCard
        v-for="menu in menus"
        :key="menu.id"
        :menu="menu"
        @click="$emit('selectMenu', menu)"
      />
    </div>
  </section>
</template>

<script setup>
import MenuCard from './MenuCard.vue';

defineProps({
  menus: { type: Array, required: true },
  categoryName: { type: String, required: true },
});

defineEmits(['selectMenu']);
</script>
