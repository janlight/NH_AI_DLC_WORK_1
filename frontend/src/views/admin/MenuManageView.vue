<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6" data-testid="menu-manage-view">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">메뉴 관리</h1>

    <!-- 로딩 -->
    <div v-if="menuStore.isLoading" class="flex items-center justify-center py-20" role="status">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" aria-hidden="true" />
      <span class="sr-only">데이터를 불러오는 중...</span>
    </div>

    <template v-else>
      <!-- 카테고리 관리 -->
      <CategoryManager
        :categories="menuStore.categories"
        @create="handleCreateCategory"
        @update="handleUpdateCategory"
        @delete="handleDeleteCategory"
        @reorder="handleReorderCategories"
      />

      <hr class="my-6 border-gray-200" />

      <!-- 카테고리 필터 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <label for="category-filter" class="text-sm font-medium text-gray-700">카테고리 필터:</label>
          <select
            id="category-filter"
            v-model="selectedCategoryId"
            class="border rounded-lg px-3 py-2 text-sm min-h-[44px]"
            data-testid="menu-manage-category-filter"
          >
            <option :value="null">전체</option>
            <option v-for="cat in menuStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm min-h-[44px]"
            data-testid="menu-manage-add-button"
            @click="openMenuForm(null)"
          >
            + 메뉴 추가
          </button>
          <button
            class="px-4 py-2 bg-gray-200 rounded-lg text-sm min-h-[44px]"
            data-testid="menu-manage-order-button"
            @click="showOrderManager = !showOrderManager"
          >
            순서 관리
          </button>
        </div>
      </div>

      <!-- 순서 관리 -->
      <MenuOrderManager
        v-if="showOrderManager"
        :menus="filteredMenus"
        @reorder="handleReorderMenus"
      />

      <!-- 메뉴 목록 테이블 -->
      <div v-if="!showOrderManager" class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table class="w-full text-sm" data-testid="menu-manage-table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-600">이미지</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">메뉴명</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">카테고리</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600">가격</th>
              <th class="px-4 py-3 text-center font-medium text-gray-600">상태</th>
              <th class="px-4 py-3 text-center font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="menu in filteredMenus"
              :key="menu.id"
              :class="{ 'opacity-50': !menu.isActive }"
              :data-testid="`menu-row-${menu.id}`"
            >
              <td class="px-4 py-3">
                <div class="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                  <img v-if="menu.imageUrl" :src="menu.imageUrl" :alt="menu.name" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-4 py-3 font-medium">{{ menu.name }}</td>
              <td class="px-4 py-3 text-gray-500">{{ getCategoryName(menu.categoryId) }}</td>
              <td class="px-4 py-3 text-right">{{ menu.price.toLocaleString() }}원</td>
              <td class="px-4 py-3 text-center">
                <span :class="menu.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'" class="px-2 py-1 rounded text-xs">
                  {{ menu.isActive ? '활성' : '비활성' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <button
                    class="text-blue-500 hover:text-blue-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="수정"
                    data-testid="menu-edit-button"
                    @click="openMenuForm(menu)"
                  >✏️</button>
                  <button
                    v-if="menu.isActive"
                    class="text-red-500 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="삭제"
                    data-testid="menu-delete-button"
                    @click="handleDeleteMenu(menu.id)"
                  >🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredMenus.length === 0" class="text-center py-10 text-gray-400">
          등록된 메뉴가 없습니다.
        </div>
      </div>

      <!-- 메뉴 추가/수정 폼 (모달) -->
      <Teleport to="body">
        <div v-if="isFormVisible" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="isFormVisible = false" aria-hidden="true" />
          <div class="relative w-full max-w-md mx-4">
            <MenuForm
              :menu="editingMenu"
              :categories="menuStore.categories"
              @submit="handleMenuSubmit"
              @cancel="isFormVisible = false"
            />
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMenuStore } from '../../stores/menuStore';
import CategoryManager from '../../components/menu/CategoryManager.vue';
import MenuForm from '../../components/menu/MenuForm.vue';
import MenuOrderManager from '../../components/menu/MenuOrderManager.vue';

const menuStore = useMenuStore();
const selectedCategoryId = ref(null);
const editingMenu = ref(null);
const isFormVisible = ref(false);
const showOrderManager = ref(false);

// TODO: storeId는 인증 정보에서 가져옴 (Unit 1 연동)
const storeId = localStorage.getItem('storeId') || '';

const filteredMenus = computed(() => {
  if (selectedCategoryId.value) {
    return menuStore.menusByCategory[selectedCategoryId.value] || [];
  }
  return menuStore.allMenus;
});

function getCategoryName(categoryId) {
  const cat = menuStore.getCategoryById(categoryId);
  return cat?.name || '';
}

function openMenuForm(menu) {
  editingMenu.value = menu;
  isFormVisible.value = true;
}

// 카테고리 핸들러
async function handleCreateCategory(input) {
  try {
    await menuStore.createCategory(storeId, input);
  } catch (err) {
    alert(err.response?.data?.message || '카테고리 생성에 실패했습니다.');
  }
}

async function handleUpdateCategory(categoryId, input) {
  try {
    await menuStore.updateCategory(storeId, categoryId, input);
  } catch (err) {
    alert(err.response?.data?.message || '카테고리 수정에 실패했습니다.');
  }
}

async function handleDeleteCategory(categoryId) {
  if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
  try {
    await menuStore.deleteCategory(storeId, categoryId);
  } catch (err) {
    alert(err.response?.data?.message || '카테고리 삭제에 실패했습니다.');
  }
}

async function handleReorderCategories(orders) {
  try {
    await menuStore.updateCategoryOrder(storeId, orders);
  } catch (err) {
    alert(err.response?.data?.message || '순서 변경에 실패했습니다.');
  }
}

// 메뉴 핸들러
async function handleMenuSubmit(formData) {
  try {
    const { imageFile, ...menuData } = formData;

    if (editingMenu.value) {
      const updated = await menuStore.updateMenu(storeId, editingMenu.value.id, menuData);
      if (imageFile) {
        await menuStore.uploadImage(storeId, updated.id, imageFile);
      }
    } else {
      const created = await menuStore.createMenu(storeId, menuData);
      if (imageFile) {
        await menuStore.uploadImage(storeId, created.id, imageFile);
      }
    }

    isFormVisible.value = false;
    await menuStore.fetchMenusAdmin(storeId);
  } catch (err) {
    alert(err.response?.data?.message || '메뉴 저장에 실패했습니다.');
  }
}

async function handleDeleteMenu(menuId) {
  if (!confirm('이 메뉴를 삭제하시겠습니까?')) return;
  try {
    await menuStore.deleteMenu(storeId, menuId);
  } catch (err) {
    alert(err.response?.data?.message || '메뉴 삭제에 실패했습니다.');
  }
}

async function handleReorderMenus(orders) {
  try {
    await menuStore.updateMenuOrder(storeId, orders);
  } catch (err) {
    alert(err.response?.data?.message || '순서 변경에 실패했습니다.');
  }
}

onMounted(async () => {
  if (storeId) {
    await menuStore.fetchMenusAdmin(storeId);
  }
});
</script>
