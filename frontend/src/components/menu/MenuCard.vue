<template>
  <button
    class="bg-white rounded-lg shadow-sm overflow-hidden text-left w-full min-h-[44px] hover:shadow-md transition-shadow"
    :data-testid="`menu-card-${menu.id}`"
    @click="$emit('click', menu)"
  >
    <div class="aspect-square bg-gray-100 relative">
      <img
        v-if="menu.imageUrl"
        :src="menu.imageUrl"
        :alt="menu.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-gray-400"
        aria-hidden="true"
      >
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div class="p-3">
      <h3 class="font-medium text-gray-900 text-sm truncate">{{ menu.name }}</h3>
      <p class="text-orange-600 font-bold text-sm mt-1">
        {{ menu.price.toLocaleString() }}원
      </p>
    </div>
  </button>
</template>

<script setup>
defineProps({
  menu: { type: Object, required: true },
});

defineEmits(['click']);
</script>
