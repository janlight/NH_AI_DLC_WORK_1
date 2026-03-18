/**
 * Menu Routes 단위 테스트
 * Unit 2: menu-management
 */
const express = require('express');
const request = require('supertest');

// Mock dependencies before requiring router
jest.mock('../../src/services/menuService');
jest.mock('../../src/services/fileUploadService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));
jest.mock('express-rate-limit', () => {
  return () => (req, res, next) => next();
});

const menuService = require('../../src/services/menuService');
const menuRouter = require('../../src/routes/menu');
const AppError = require('../../src/utils/AppError');

// 테스트용 Express 앱
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/stores/:storeId', menuRouter);
  // 에러 핸들러
  app.use((err, req, res, next) => {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ code: err.code, message: err.message });
    }
    res.status(500).json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
  });
  return app;
}

const storeId = '550e8400-e29b-41d4-a716-446655440000';
const categoryId = '550e8400-e29b-41d4-a716-446655440001';
const menuId = '550e8400-e29b-41d4-a716-446655440002';

describe('Menu Routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 카테고리 API
  // ============================================
  describe('GET /api/stores/:storeId/categories', () => {
    it('200 - 카테고리 목록을 반환한다', async () => {
      menuService.getMenusETag.mockResolvedValue(null);
      menuService.getCategoriesByStore.mockResolvedValue([
        { id: categoryId, name: '음료', sortOrder: 0, menuCount: 3 },
      ]);

      const res = await request(app)
        .get(`/api/stores/${storeId}/categories`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('음료');
    });

    it('304 - ETag가 일치하면 Not Modified를 반환한다', async () => {
      menuService.getMenusETag.mockResolvedValue('"ts-1710000000000"');

      await request(app)
        .get(`/api/stores/${storeId}/categories`)
        .set('If-None-Match', '"ts-1710000000000"')
        .expect(304);
    });
  });

  describe('POST /api/stores/:storeId/categories', () => {
    it('201 - 카테고리를 생성한다', async () => {
      menuService.createCategory.mockResolvedValue({
        id: categoryId, name: '디저트', sortOrder: 0,
      });

      const res = await request(app)
        .post(`/api/stores/${storeId}/categories`)
        .send({ name: '디저트' })
        .expect(201);

      expect(res.body.data.name).toBe('디저트');
    });

    it('400 - 카테고리명이 비어있으면 검증 에러를 반환한다', async () => {
      await request(app)
        .post(`/api/stores/${storeId}/categories`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('PUT /api/stores/:storeId/categories/:categoryId', () => {
    it('200 - 카테고리를 수정한다', async () => {
      menuService.updateCategory.mockResolvedValue({
        id: categoryId, name: '음료수',
      });

      const res = await request(app)
        .put(`/api/stores/${storeId}/categories/${categoryId}`)
        .send({ name: '음료수' })
        .expect(200);

      expect(res.body.data.name).toBe('음료수');
    });
  });

  describe('DELETE /api/stores/:storeId/categories/:categoryId', () => {
    it('204 - 카테고리를 삭제한다', async () => {
      menuService.deleteCategory.mockResolvedValue(undefined);

      await request(app)
        .delete(`/api/stores/${storeId}/categories/${categoryId}`)
        .expect(204);
    });

    it('400 - 활성 메뉴가 있으면 에러를 반환한다', async () => {
      menuService.deleteCategory.mockRejectedValue(
        new AppError(400, 'CATEGORY_HAS_MENUS', '해당 카테고리에 활성 메뉴가 있어 삭제할 수 없습니다.')
      );

      await request(app)
        .delete(`/api/stores/${storeId}/categories/${categoryId}`)
        .expect(400);
    });
  });

  // ============================================
  // 메뉴 API
  // ============================================
  describe('GET /api/stores/:storeId/menus', () => {
    it('200 - 고객용 메뉴 목록을 반환한다', async () => {
      menuService.getMenusETag.mockResolvedValue(null);
      menuService.getMenusByStore.mockResolvedValue({
        categories: [{ category: { id: categoryId, name: '음료' }, menus: [] }],
      });

      const res = await request(app)
        .get(`/api/stores/${storeId}/menus`)
        .expect(200);

      expect(res.body.data.categories).toHaveLength(1);
    });

    it('200 - 관리자용 메뉴 목록을 반환한다', async () => {
      menuService.getMenusETag.mockResolvedValue(null);
      menuService.getMenusByStoreAdmin.mockResolvedValue({
        categories: [{ category: { id: categoryId, name: '음료' }, menus: [] }],
      });

      const res = await request(app)
        .get(`/api/stores/${storeId}/menus?admin=true`)
        .expect(200);

      expect(res.body.data.categories).toBeDefined();
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('GET /api/stores/:storeId/menus/:menuId', () => {
    it('200 - 메뉴 상세를 반환한다', async () => {
      menuService.getMenuDetail
        .mockResolvedValueOnce({ id: menuId, name: '아메리카노', updatedAt: new Date() }) // ETag용
        .mockResolvedValueOnce({ id: menuId, name: '아메리카노', price: 4500 }); // 실제 응답용
      menuService.getMenuDetailETag.mockReturnValue('"ts-123"');

      const res = await request(app)
        .get(`/api/stores/${storeId}/menus/${menuId}`)
        .expect(200);

      expect(res.body.data.name).toBe('아메리카노');
    });

    it('404 - 존재하지 않는 메뉴면 에러를 반환한다', async () => {
      menuService.getMenuDetail.mockRejectedValue(
        new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.')
      );

      await request(app)
        .get(`/api/stores/${storeId}/menus/${menuId}`)
        .expect(404);
    });
  });

  describe('POST /api/stores/:storeId/menus', () => {
    it('201 - 메뉴를 생성한다', async () => {
      menuService.createMenu.mockResolvedValue({
        id: menuId, name: '아메리카노', price: 4500,
      });

      const res = await request(app)
        .post(`/api/stores/${storeId}/menus`)
        .send({ name: '아메리카노', price: 4500, categoryId })
        .expect(201);

      expect(res.body.data.name).toBe('아메리카노');
    });

    it('400 - 가격이 범위를 벗어나면 검증 에러를 반환한다', async () => {
      await request(app)
        .post(`/api/stores/${storeId}/menus`)
        .send({ name: '테스트', price: 50, categoryId })
        .expect(400);
    });
  });

  describe('PUT /api/stores/:storeId/menus/:menuId', () => {
    it('200 - 메뉴를 수정한다', async () => {
      menuService.updateMenu.mockResolvedValue({
        id: menuId, name: '아이스 아메리카노', price: 5000,
      });

      const res = await request(app)
        .put(`/api/stores/${storeId}/menus/${menuId}`)
        .send({ name: '아이스 아메리카노', price: 5000 })
        .expect(200);

      expect(res.body.data.name).toBe('아이스 아메리카노');
    });
  });

  describe('DELETE /api/stores/:storeId/menus/:menuId', () => {
    it('204 - 메뉴를 soft delete한다', async () => {
      menuService.deleteMenu.mockResolvedValue(undefined);

      await request(app)
        .delete(`/api/stores/${storeId}/menus/${menuId}`)
        .expect(204);
    });
  });

  describe('PUT /api/stores/:storeId/menus/order', () => {
    it('200 - 메뉴 순서를 변경한다', async () => {
      menuService.updateMenuOrder.mockResolvedValue(undefined);

      await request(app)
        .put(`/api/stores/${storeId}/menus/order`)
        .send({
          menuOrders: [
            { menuId: '550e8400-e29b-41d4-a716-446655440010', sortOrder: 0 },
            { menuId: '550e8400-e29b-41d4-a716-446655440011', sortOrder: 1 },
          ],
        })
        .expect(200);
    });
  });
});
