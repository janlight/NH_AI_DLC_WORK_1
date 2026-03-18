/**
 * MenuService 단위 테스트
 * Unit 2: menu-management
 */
const { PrismaClient } = require('@prisma/client');
const menuService = require('../../src/services/menuService');
const AppError = require('../../src/utils/AppError');

// Prisma Client mock
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    menu: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const prisma = new PrismaClient();

describe('MenuService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const storeId = 'store-001';

  // ============================================
  // ETag 헬퍼
  // ============================================
  describe('getMenusETag', () => {
    it('메뉴와 카테고리의 MAX(updatedAt)으로 ETag를 생성한다', async () => {
      const menuDate = new Date('2026-03-18T10:00:00Z');
      const categoryDate = new Date('2026-03-18T11:00:00Z');
      prisma.menu.findFirst.mockResolvedValue({ updatedAt: menuDate });
      prisma.category.findFirst.mockResolvedValue({ updatedAt: categoryDate });

      const etag = await menuService.getMenusETag(storeId);

      expect(etag).toBe(`"ts-${categoryDate.getTime()}"`);
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      prisma.menu.findFirst.mockResolvedValue(null);
      prisma.category.findFirst.mockResolvedValue(null);

      const etag = await menuService.getMenusETag(storeId);

      expect(etag).toBeNull();
    });
  });

  // ============================================
  // 카테고리 관리
  // ============================================
  describe('getCategoriesByStore', () => {
    it('매장별 카테고리 목록을 sortOrder 순으로 반환한다', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: '음료', sortOrder: 0, _count: { menus: 3 } },
        { id: 'cat-2', name: '식사', sortOrder: 1, _count: { menus: 5 } },
      ]);

      const result = await menuService.getCategoriesByStore(storeId);

      expect(result).toHaveLength(2);
      expect(result[0].menuCount).toBe(3);
      expect(result[0]._count).toBeUndefined();
    });
  });

  describe('createCategory', () => {
    it('새 카테고리를 생성한다', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      prisma.category.create.mockResolvedValue({
        id: 'cat-new', storeId, name: '디저트', sortOrder: 3,
      });

      const result = await menuService.createCategory(storeId, { name: '디저트' });

      expect(result.name).toBe('디저트');
      expect(result.sortOrder).toBe(3);
    });

    it('중복 카테고리명이면 409 에러를 던진다', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: '음료' });

      await expect(
        menuService.createCategory(storeId, { name: '음료' })
      ).rejects.toThrow(AppError);

      await expect(
        menuService.createCategory(storeId, { name: '음료' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_NAME' });
    });

    it('sortOrder를 명시하면 해당 값을 사용한다', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({
        id: 'cat-new', storeId, name: '사이드', sortOrder: 5,
      });

      const result = await menuService.createCategory(storeId, { name: '사이드', sortOrder: 5 });

      expect(result.sortOrder).toBe(5);
    });
  });

  describe('updateCategory', () => {
    it('카테고리를 수정한다', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ id: 'cat-1', storeId, name: '음료' }) // 존재 확인
        .mockResolvedValueOnce(null); // 중복 검사
      prisma.category.update.mockResolvedValue({ id: 'cat-1', name: '음료수' });

      const result = await menuService.updateCategory(storeId, 'cat-1', { name: '음료수' });

      expect(result.name).toBe('음료수');
    });

    it('존재하지 않는 카테고리면 404 에러를 던진다', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        menuService.updateCategory(storeId, 'cat-999', { name: '없음' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteCategory', () => {
    it('활성 메뉴가 없으면 카테고리를 삭제한다', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', storeId });
      prisma.menu.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({});

      await expect(menuService.deleteCategory(storeId, 'cat-1')).resolves.toBeUndefined();
    });

    it('활성 메뉴가 있으면 400 에러를 던진다', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', storeId });
      prisma.menu.count.mockResolvedValue(3);

      await expect(
        menuService.deleteCategory(storeId, 'cat-1')
      ).rejects.toMatchObject({ statusCode: 400, code: 'CATEGORY_HAS_MENUS' });
    });
  });

  describe('updateCategoryOrder', () => {
    it('카테고리 순서를 일괄 업데이트한다', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'cat-1' }, { id: 'cat-2' }]);
      prisma.$transaction.mockResolvedValue([]);

      const orders = [
        { categoryId: 'cat-1', sortOrder: 1 },
        { categoryId: 'cat-2', sortOrder: 0 },
      ];

      await expect(menuService.updateCategoryOrder(storeId, orders)).resolves.toBeUndefined();
    });

    it('다른 매장의 카테고리가 포함되면 400 에러를 던진다', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'cat-1' }]); // 1개만 반환

      const orders = [
        { categoryId: 'cat-1', sortOrder: 0 },
        { categoryId: 'cat-other', sortOrder: 1 },
      ];

      await expect(
        menuService.updateCategoryOrder(storeId, orders)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================
  // 메뉴 관리
  // ============================================
  describe('getMenusByStore', () => {
    it('카테고리별 활성 메뉴를 그룹으로 반환한다', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1', name: '음료', sortOrder: 0,
          menus: [{ id: 'menu-1', name: '아메리카노', isActive: true }],
        },
      ]);

      const result = await menuService.getMenusByStore(storeId);

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].menus).toHaveLength(1);
    });
  });

  describe('getMenusByStoreAdmin', () => {
    it('관리자용으로 모든 메뉴(비활성 포함)를 반환한다', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1', name: '음료', sortOrder: 0,
          menus: [
            { id: 'menu-1', name: '아메리카노', isActive: true },
            { id: 'menu-2', name: '라떼', isActive: false },
          ],
        },
      ]);

      const result = await menuService.getMenusByStoreAdmin(storeId);

      expect(result.categories[0].menus).toHaveLength(2);
    });
  });

  describe('getMenuDetail', () => {
    it('메뉴 상세 정보를 반환한다', async () => {
      prisma.menu.findFirst.mockResolvedValue({
        id: 'menu-1', name: '아메리카노', isActive: true,
        category: { id: 'cat-1', name: '음료' },
      });

      const result = await menuService.getMenuDetail(storeId, 'menu-1');

      expect(result.name).toBe('아메리카노');
    });

    it('비활성 메뉴를 고객이 조회하면 404 에러를 던진다', async () => {
      prisma.menu.findFirst.mockResolvedValue({
        id: 'menu-1', name: '라떼', isActive: false,
      });

      await expect(
        menuService.getMenuDetail(storeId, 'menu-1', false)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('비활성 메뉴를 관리자가 조회하면 정상 반환한다', async () => {
      prisma.menu.findFirst.mockResolvedValue({
        id: 'menu-1', name: '라떼', isActive: false,
      });

      const result = await menuService.getMenuDetail(storeId, 'menu-1', true);

      expect(result.name).toBe('라떼');
    });
  });

  describe('createMenu', () => {
    it('새 메뉴를 생성한다', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', storeId });
      prisma.menu.findFirst.mockResolvedValue(null);
      prisma.menu.aggregate.mockResolvedValue({ _max: { sortOrder: 1 } });
      prisma.menu.create.mockResolvedValue({
        id: 'menu-new', name: '아메리카노', price: 4500, sortOrder: 2,
      });

      const result = await menuService.createMenu(storeId, {
        categoryId: 'cat-1', name: '아메리카노', price: 4500,
      });

      expect(result.name).toBe('아메리카노');
      expect(result.sortOrder).toBe(2);
    });

    it('유효하지 않은 카테고리면 400 에러를 던진다', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        menuService.createMenu(storeId, { categoryId: 'cat-999', name: '테스트', price: 1000 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('동일 카테고리 내 중복 메뉴명이면 409 에러를 던진다', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', storeId });
      prisma.menu.findFirst.mockResolvedValue({ id: 'menu-1', name: '아메리카노' });

      await expect(
        menuService.createMenu(storeId, { categoryId: 'cat-1', name: '아메리카노', price: 4500 })
      ).rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_NAME' });
    });
  });

  describe('updateMenu', () => {
    it('메뉴를 수정한다', async () => {
      prisma.menu.findFirst
        .mockResolvedValueOnce({ id: 'menu-1', storeId, categoryId: 'cat-1', name: '아메리카노' })
        .mockResolvedValueOnce(null); // 중복 검사
      prisma.menu.update.mockResolvedValue({ id: 'menu-1', name: '아이스 아메리카노', price: 5000 });

      const result = await menuService.updateMenu(storeId, 'menu-1', {
        name: '아이스 아메리카노', price: 5000,
      });

      expect(result.name).toBe('아이스 아메리카노');
    });

    it('존재하지 않는 메뉴면 404 에러를 던진다', async () => {
      prisma.menu.findFirst.mockResolvedValue(null);

      await expect(
        menuService.updateMenu(storeId, 'menu-999', { name: '없음' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteMenu', () => {
    it('메뉴를 soft delete한다 (isActive=false)', async () => {
      prisma.menu.findFirst.mockResolvedValue({ id: 'menu-1', storeId, isActive: true });
      prisma.menu.update.mockResolvedValue({});

      await expect(menuService.deleteMenu(storeId, 'menu-1')).resolves.toBeUndefined();
      expect(prisma.menu.update).toHaveBeenCalledWith({
        where: { id: 'menu-1' },
        data: { isActive: false },
      });
    });

    it('이미 삭제된 메뉴면 400 에러를 던진다', async () => {
      prisma.menu.findFirst.mockResolvedValue({ id: 'menu-1', storeId, isActive: false });

      await expect(
        menuService.deleteMenu(storeId, 'menu-1')
      ).rejects.toMatchObject({ statusCode: 400, code: 'ALREADY_DELETED' });
    });
  });

  describe('updateMenuOrder', () => {
    it('메뉴 순서를 일괄 업데이트한다', async () => {
      prisma.menu.findMany.mockResolvedValue([{ id: 'menu-1' }, { id: 'menu-2' }]);
      prisma.$transaction.mockResolvedValue([]);

      const orders = [
        { menuId: 'menu-1', sortOrder: 1 },
        { menuId: 'menu-2', sortOrder: 0 },
      ];

      await expect(menuService.updateMenuOrder(storeId, orders)).resolves.toBeUndefined();
    });
  });
});
