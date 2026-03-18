/**
 * MenuService - 카테고리 CRUD + 메뉴 CRUD + ETag 헬퍼
 * Unit 2: menu-management
 *
 * 모든 메서드에 storeId 파라미터 (멀티 테넌트 격리)
 * 관련 스토리: US-02-01, US-02-02, US-08-01, US-08-02, US-08-03
 */
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ============================================
// ETag 헬퍼
// ============================================

/**
 * 매장 메뉴 데이터의 ETag 생성 (MAX(updatedAt) 기반)
 */
async function getMenusETag(storeId) {
  const [menuMax, categoryMax] = await Promise.all([
    prisma.menu.findFirst({
      where: { storeId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.category.findFirst({
      where: { storeId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  const menuTs = menuMax?.updatedAt?.getTime() || 0;
  const categoryTs = categoryMax?.updatedAt?.getTime() || 0;
  const maxTs = Math.max(menuTs, categoryTs);

  return maxTs > 0 ? `"ts-${maxTs}"` : null;
}

/**
 * 단일 메뉴의 ETag 생성
 */
function getMenuDetailETag(menu) {
  return `"ts-${menu.updatedAt.getTime()}"`;
}

// ============================================
// 카테고리 관리
// ============================================

async function getCategoriesByStore(storeId) {
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { menus: { where: { isActive: true } } },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    menuCount: cat._count.menus,
    _count: undefined,
  }));
}

async function createCategory(storeId, input) {
  const name = input.name.trim();

  // 동일 매장 내 카테고리명 중복 검사 (case-insensitive)
  const existing = await prisma.category.findFirst({
    where: {
      storeId,
      name: { equals: name, mode: 'insensitive' },
    },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE_NAME', '이미 존재하는 카테고리명입니다.');
  }

  // sortOrder 결정
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || sortOrder === null) {
    const maxSort = await prisma.category.aggregate({
      where: { storeId },
      _max: { sortOrder: true },
    });
    sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  const category = await prisma.category.create({
    data: { storeId, name, sortOrder },
  });

  logger.info('Category created', { storeId, categoryId: category.id, name });
  return category;
}

async function updateCategory(storeId, categoryId, input) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
  });
  if (!category) {
    throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.');
  }

  const data = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    const existing = await prisma.category.findFirst({
      where: {
        storeId,
        name: { equals: name, mode: 'insensitive' },
        id: { not: categoryId },
      },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE_NAME', '이미 존재하는 카테고리명입니다.');
    }
    data.name = name;
  }

  if (input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  logger.info('Category updated', { storeId, categoryId });
  return updated;
}

async function deleteCategory(storeId, categoryId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
  });
  if (!category) {
    throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.');
  }

  const activeMenuCount = await prisma.menu.count({
    where: { categoryId, isActive: true },
  });
  if (activeMenuCount > 0) {
    throw new AppError(400, 'CATEGORY_HAS_MENUS', '해당 카테고리에 활성 메뉴가 있어 삭제할 수 없습니다.');
  }

  await prisma.category.delete({ where: { id: categoryId } });
  logger.info('Category deleted', { storeId, categoryId });
}

async function updateCategoryOrder(storeId, categoryOrders) {
  // 모든 categoryId가 해당 매장 소속인지 검증
  const ids = categoryOrders.map((o) => o.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: ids }, storeId },
    select: { id: true },
  });
  if (categories.length !== ids.length) {
    throw new AppError(400, 'VALIDATION_ERROR', '유효하지 않은 카테고리가 포함되어 있습니다.');
  }

  await prisma.$transaction(
    categoryOrders.map((o) =>
      prisma.category.update({
        where: { id: o.categoryId },
        data: { sortOrder: o.sortOrder },
      })
    )
  );

  logger.info('Category order updated', { storeId, count: categoryOrders.length });
}

// ============================================
// 메뉴 관리
// ============================================

async function getMenusByStore(storeId) {
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' },
    include: {
      menus: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return {
    categories: categories.map((cat) => ({
      category: { id: cat.id, name: cat.name, sortOrder: cat.sortOrder },
      menus: cat.menus,
    })),
  };
}

async function getMenusByStoreAdmin(storeId, categoryId) {
  const where = { storeId };
  if (categoryId) {
    where.id = categoryId;
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      menus: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return {
    categories: categories.map((cat) => ({
      category: { id: cat.id, name: cat.name, sortOrder: cat.sortOrder },
      menus: cat.menus,
    })),
  };
}

async function getMenuDetail(storeId, menuId, isAdmin = false) {
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, storeId },
    include: { category: true },
  });

  if (!menu) {
    throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.');
  }

  if (!isAdmin && !menu.isActive) {
    throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.');
  }

  return menu;
}

async function createMenu(storeId, input) {
  const name = input.name.trim();

  // 카테고리 유효성 검증
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, storeId },
  });
  if (!category) {
    throw new AppError(400, 'VALIDATION_ERROR', '유효하지 않은 카테고리입니다.');
  }

  // 동일 카테고리 내 활성 메뉴명 중복 검사
  const existing = await prisma.menu.findFirst({
    where: {
      storeId,
      categoryId: input.categoryId,
      name: { equals: name, mode: 'insensitive' },
      isActive: true,
    },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE_NAME', '동일 카테고리에 같은 이름의 메뉴가 존재합니다.');
  }

  // sortOrder 결정
  const maxSort = await prisma.menu.aggregate({
    where: { categoryId: input.categoryId, storeId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const menu = await prisma.menu.create({
    data: {
      storeId,
      categoryId: input.categoryId,
      name,
      price: input.price,
      description: input.description || null,
      sortOrder,
    },
  });

  logger.info('Menu created', { storeId, menuId: menu.id, name });
  return menu;
}

async function updateMenu(storeId, menuId, input) {
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, storeId },
  });
  if (!menu) {
    throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.');
  }

  const data = {};
  const targetCategoryId = input.categoryId || menu.categoryId;
  const targetName = input.name ? input.name.trim() : menu.name;

  // 카테고리 변경 시 유효성 검증
  if (input.categoryId && input.categoryId !== menu.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, storeId },
    });
    if (!category) {
      throw new AppError(400, 'VALIDATION_ERROR', '유효하지 않은 카테고리입니다.');
    }
    data.categoryId = input.categoryId;
  }

  // 이름 변경 또는 카테고리 변경 시 중복 검사
  if (input.name || (input.categoryId && input.categoryId !== menu.categoryId)) {
    const existing = await prisma.menu.findFirst({
      where: {
        storeId,
        categoryId: targetCategoryId,
        name: { equals: targetName, mode: 'insensitive' },
        isActive: true,
        id: { not: menuId },
      },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE_NAME', '동일 카테고리에 같은 이름의 메뉴가 존재합니다.');
    }
  }

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.price !== undefined) data.price = input.price;
  if (input.description !== undefined) data.description = input.description;

  const updated = await prisma.menu.update({
    where: { id: menuId },
    data,
  });

  logger.info('Menu updated', { storeId, menuId });
  return updated;
}

async function deleteMenu(storeId, menuId) {
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, storeId },
  });
  if (!menu) {
    throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.');
  }
  if (!menu.isActive) {
    throw new AppError(400, 'ALREADY_DELETED', '이미 삭제된 메뉴입니다.');
  }

  await prisma.menu.update({
    where: { id: menuId },
    data: { isActive: false },
  });

  logger.info('Menu soft deleted', { storeId, menuId });
}

async function updateMenuOrder(storeId, menuOrders) {
  const ids = menuOrders.map((o) => o.menuId);
  const menus = await prisma.menu.findMany({
    where: { id: { in: ids }, storeId },
    select: { id: true },
  });
  if (menus.length !== ids.length) {
    throw new AppError(400, 'VALIDATION_ERROR', '유효하지 않은 메뉴가 포함되어 있습니다.');
  }

  await prisma.$transaction(
    menuOrders.map((o) =>
      prisma.menu.update({
        where: { id: o.menuId },
        data: { sortOrder: o.sortOrder },
      })
    )
  );

  logger.info('Menu order updated', { storeId, count: menuOrders.length });
}

module.exports = {
  getMenusETag,
  getMenuDetailETag,
  getCategoriesByStore,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getMenusByStore,
  getMenusByStoreAdmin,
  getMenuDetail,
  createMenu,
  updateMenu,
  deleteMenu,
  updateMenuOrder,
};
