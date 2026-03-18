/**
 * Menu Routes - 카테고리 API + 메뉴 API + 이미지 업로드
 * Unit 2: menu-management
 *
 * 관련 스토리: US-02-01, US-02-02, US-08-01, US-08-02, US-08-03
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const menuService = require('../services/menuService');
const fileUploadService = require('../services/fileUploadService');
const { cacheMiddleware, noCache } = require('../middleware/cache');
const validators = require('../validators/menuValidator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });

// ============================================
// Multer 설정 (이미지 업로드)
// ============================================
const upload = multer({
  dest: path.join(fileUploadService.UPLOAD_DIR, 'tmp'),
  limits: { fileSize: fileUploadService.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (fileUploadService.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.'));
    }
  },
});

// ============================================
// Rate Limiting (이미지 업로드용)
// ============================================
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // express-rate-limit가 없으면 패스스루 미들웨어
  rateLimit = () => (req, res, next) => next();
}

const uploadRateLimit = rateLimit({
  windowMs: 60000,
  max: 20,
  keyGenerator: (req) => req.params.storeId,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: '이미지 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
});

// ============================================
// ETag 생성 함수
// ============================================
const menuListETag = async (req) => {
  return menuService.getMenusETag(req.params.storeId);
};

const menuDetailETag = async (req) => {
  try {
    const menu = await menuService.getMenuDetail(req.params.storeId, req.params.menuId, true);
    return menuService.getMenuDetailETag(menu);
  } catch {
    return null;
  }
};

// ============================================
// 비동기 에러 래퍼
// ============================================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// 카테고리 API
// ============================================

// GET /api/stores/:storeId/categories - 카테고리 목록 조회
router.get(
  '/categories',
  ...validators.validateStoreId,
  cacheMiddleware({ maxAge: 60, generateETag: menuListETag }),
  asyncHandler(async (req, res) => {
    const categories = await menuService.getCategoriesByStore(req.params.storeId);
    res.json({ data: categories });
  })
);

// POST /api/stores/:storeId/categories - 카테고리 생성 (관리자)
router.post(
  '/categories',
  noCache,
  validators.validateCreateCategory,
  asyncHandler(async (req, res) => {
    const category = await menuService.createCategory(req.params.storeId, req.body);
    res.status(201).json({ data: category });
  })
);

// PUT /api/stores/:storeId/categories/:categoryId - 카테고리 수정 (관리자)
router.put(
  '/categories/:categoryId',
  noCache,
  validators.validateUpdateCategory,
  asyncHandler(async (req, res) => {
    const category = await menuService.updateCategory(
      req.params.storeId,
      req.params.categoryId,
      req.body
    );
    res.json({ data: category });
  })
);

// DELETE /api/stores/:storeId/categories/:categoryId - 카테고리 삭제 (관리자)
router.delete(
  '/categories/:categoryId',
  noCache,
  ...validators.validateStoreId,
  ...validators.validateCategoryId,
  asyncHandler(async (req, res) => {
    await menuService.deleteCategory(req.params.storeId, req.params.categoryId);
    res.status(204).end();
  })
);

// PUT /api/stores/:storeId/categories/order - 카테고리 순서 변경 (관리자)
router.put(
  '/categories/order',
  noCache,
  validators.validateCategoryOrder,
  asyncHandler(async (req, res) => {
    await menuService.updateCategoryOrder(req.params.storeId, req.body.categoryOrders);
    res.json({ message: '카테고리 순서가 변경되었습니다.' });
  })
);

// ============================================
// 메뉴 API
// ============================================

// GET /api/stores/:storeId/menus - 메뉴 목록 조회
router.get(
  '/menus',
  ...validators.validateStoreId,
  cacheMiddleware({ maxAge: 60, generateETag: menuListETag }),
  asyncHandler(async (req, res) => {
    const isAdmin = req.query.admin === 'true';
    let result;

    if (isAdmin) {
      // 관리자: 캐시 비활성화
      res.set('Cache-Control', 'no-store');
      result = await menuService.getMenusByStoreAdmin(req.params.storeId, req.query.categoryId);
    } else {
      result = await menuService.getMenusByStore(req.params.storeId);
    }

    res.json({ data: result });
  })
);

// GET /api/stores/:storeId/menus/:menuId - 메뉴 상세 조회
router.get(
  '/menus/:menuId',
  ...validators.validateStoreId,
  ...validators.validateMenuId,
  cacheMiddleware({ maxAge: 60, generateETag: menuDetailETag }),
  asyncHandler(async (req, res) => {
    const isAdmin = req.query.admin === 'true';
    const menu = await menuService.getMenuDetail(req.params.storeId, req.params.menuId, isAdmin);
    res.json({ data: menu });
  })
);

// POST /api/stores/:storeId/menus - 메뉴 생성 (관리자)
router.post(
  '/menus',
  noCache,
  validators.validateCreateMenu,
  asyncHandler(async (req, res) => {
    const menu = await menuService.createMenu(req.params.storeId, req.body);
    res.status(201).json({ data: menu });
  })
);

// PUT /api/stores/:storeId/menus/:menuId - 메뉴 수정 (관리자)
router.put(
  '/menus/:menuId',
  noCache,
  validators.validateUpdateMenu,
  asyncHandler(async (req, res) => {
    const menu = await menuService.updateMenu(req.params.storeId, req.params.menuId, req.body);
    res.json({ data: menu });
  })
);

// DELETE /api/stores/:storeId/menus/:menuId - 메뉴 삭제 (관리자, soft delete)
router.delete(
  '/menus/:menuId',
  noCache,
  ...validators.validateStoreId,
  ...validators.validateMenuId,
  asyncHandler(async (req, res) => {
    await menuService.deleteMenu(req.params.storeId, req.params.menuId);
    res.status(204).end();
  })
);

// PUT /api/stores/:storeId/menus/order - 메뉴 순서 변경 (관리자)
router.put(
  '/menus/order',
  noCache,
  validators.validateMenuOrder,
  asyncHandler(async (req, res) => {
    await menuService.updateMenuOrder(req.params.storeId, req.body.menuOrders);
    res.json({ message: '메뉴 순서가 변경되었습니다.' });
  })
);

// POST /api/stores/:storeId/menus/:menuId/image - 이미지 업로드 (관리자)
router.post(
  '/menus/:menuId/image',
  noCache,
  ...validators.validateStoreId,
  ...validators.validateMenuId,
  uploadRateLimit,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const result = await fileUploadService.saveImage(
      req.params.storeId,
      req.params.menuId,
      req.file
    );
    res.json({ data: result });
  })
);

module.exports = router;
