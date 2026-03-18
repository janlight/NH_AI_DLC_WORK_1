/**
 * MenuValidator 단위 테스트
 * Unit 2: menu-management
 */
const { validationResult } = require('express-validator');
const validators = require('../../src/validators/menuValidator');

// express-validator 테스트 헬퍼
async function runValidation(validationChain, req) {
  // handleValidation은 마지막 요소이므로 제외
  const chains = validationChain.filter((v) => typeof v === 'object' || typeof v.run === 'function');
  for (const chain of chains) {
    if (typeof chain.run === 'function') {
      await chain.run(req);
    }
  }
  return validationResult(req);
}

function mockReq(overrides = {}) {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

describe('MenuValidator', () => {
  describe('validateCreateCategory', () => {
    it('유효한 입력을 통과시킨다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { name: '음료', sortOrder: 0 },
      });

      const result = await runValidation(validators.validateCreateCategory, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('카테고리명이 비어있으면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { name: '' },
      });

      const result = await runValidation(validators.validateCreateCategory, req);
      expect(result.isEmpty()).toBe(false);
    });

    it('카테고리명이 50자를 초과하면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { name: 'a'.repeat(51) },
      });

      const result = await runValidation(validators.validateCreateCategory, req);
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateCreateMenu', () => {
    const validBody = {
      name: '아메리카노',
      price: 4500,
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('유효한 입력을 통과시킨다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: validBody,
      });

      const result = await runValidation(validators.validateCreateMenu, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('가격이 100 미만이면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { ...validBody, price: 50 },
      });

      const result = await runValidation(validators.validateCreateMenu, req);
      expect(result.isEmpty()).toBe(false);
    });

    it('가격이 500,000을 초과하면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { ...validBody, price: 600000 },
      });

      const result = await runValidation(validators.validateCreateMenu, req);
      expect(result.isEmpty()).toBe(false);
    });

    it('메뉴명이 비어있으면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { ...validBody, name: '' },
      });

      const result = await runValidation(validators.validateCreateMenu, req);
      expect(result.isEmpty()).toBe(false);
    });

    it('설명이 500자를 초과하면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { ...validBody, description: 'a'.repeat(501) },
      });

      const result = await runValidation(validators.validateCreateMenu, req);
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateStoreId', () => {
    it('유효한 UUID를 통과시킨다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
      });

      const result = await runValidation(validators.validateStoreId, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('잘못된 UUID 형식이면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: 'invalid-uuid' },
      });

      const result = await runValidation(validators.validateStoreId, req);
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateMenuOrder', () => {
    it('유효한 메뉴 순서 배열을 통과시킨다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: {
          menuOrders: [
            { menuId: '550e8400-e29b-41d4-a716-446655440001', sortOrder: 0 },
            { menuId: '550e8400-e29b-41d4-a716-446655440002', sortOrder: 1 },
          ],
        },
      });

      const result = await runValidation(validators.validateMenuOrder, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('빈 배열이면 에러를 반환한다', async () => {
      const req = mockReq({
        params: { storeId: '550e8400-e29b-41d4-a716-446655440000' },
        body: { menuOrders: [] },
      });

      const result = await runValidation(validators.validateMenuOrder, req);
      expect(result.isEmpty()).toBe(false);
    });
  });
});
