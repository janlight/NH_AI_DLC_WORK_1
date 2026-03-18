<template>
  <div class="min-h-screen bg-gray-50" data-testid="menu-view">
    <!-- 로딩 -->
    <div v-if="menuStore.isLoading" class="flex items-center justify-center py-20" role="status">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" aria-hidden="true" />
      <span class="sr-only">메뉴를 불러오는 중...</span>
    </div>

    <!-- 에러 -->
    <div v-else-if="menuStore.error" class="text-center py-20 px-4" role="alert">
      <p class="text-red-500 mb-4">{{ menuStore.error }}</p>
      <button
        class="px-6 py-2 bg-orange-500 text-white rounded-lg min-h-[44px]"
        data-testid="menu-view-retry-button"
        @click="loadMenus"
      >
        다시 시도
      </button>
    </div>

    <!-- 메뉴 목록 -->
    <template v-else>
      <!-- 카테고리 탭 -->
      <div class="sticky top-0 bg-white shadow-sm z-10 px-4 pt-4">
        <CategoryTabs
          :categories="menuStore.categories"
          :active-category-id="selectedCategoryId"
          @select="scrollToCategory"
        />
      </div>

      <!-- 카테고리별 메뉴 그리드 -->
      <div class="px-4 py-4 space-y-8">
        <div
          v-for="category in menuStore.categories"
          :key="category.id"
          :ref="(el) => setCategoryRef(category.id, el)"
        >
          <MenuGrid
            :menus="menuStore.menusByCategory[category.id] || []"
            :category-name="category.name"
            @select-menu="openDetail"
          />
        </div>

        <!-- 메뉴 없음 -->
        <div
          v-if="menuStore.categories.length === 0"
          class="text-center py-20 text-gray-400"
        >
          등록된 메뉴가 없습니다.
        </div>
      </div>
    </template>

    <!-- 메뉴 상세 모달 -->
    <MenuDetailModal
      :menu="selectedMenu"
      :visible="!!selectedMenu"
      @close="selectedMenu = null"
      @add-to-cart="handleAddToCart"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMenuStore } from '../../stores/menuStore';
import CategoryTabs from '../../components/menu/CategoryTabs.vue';
import MenuGrid from '../../components/menu/MenuGrid.vue';
import MenuDetailModal from './MenuDetailModal.vue';

const menuStore = useMenuStore();
const selectedCategoryId = ref(null);
const selectedMenu = ref(null);
const categoryRefs = ref({});

// TODO: storeId는 인증 정보에서 가져옴 (Unit 1 연동)
const storeId = localStorage.getItem('storeId') || '';

function setCategoryRef(categoryId, el) {
  if (el) categoryRefs.value[categoryId] = el;
}

function scrollToCategory(categoryId) {
  selectedCategoryId.value = categoryId;
  const el = categoryRefs.value[categoryId];
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openDetail(menu) {
  selectedMenu.value = menu;
}

function handleAddToCart(menu, quantity) {
  // TODO: cartStore 연동 (Unit 3 책임)
  selectedMenu.value = null;
}

async function loadMenus() {
  if (storeId) {
    await menuStore.fetchMenus(storeId);
    if (menuStore.categories.length > 0) {
      selectedCategoryId.value = menuStore.categories[0].id;
    }
  }
}

onMounted(loadMenus);
</script>
