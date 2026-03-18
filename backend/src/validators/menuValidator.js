/**
 * Menu Validator - express-validator 검증 체인
 * Unit 2: menu-management (SECURITY-05 준수)
 */
const { body, param, validationResult } = require('express-validator');

/**
 * 검증 결과 처리 미들웨어
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// UUID 형식 검증 정규식
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateStoreId = [
  param('storeId')
    .matches(UUID_REGEX)
    .withMessage('유효하지 않은 매장 ID 형식입니다.'),
];

const validateMenuId = [
  param('menuId')
    .matches(UUID_REGEX)
    .withMessage('유효하지 않은 메뉴 ID 형식입니다.'),
];

const validateCategoryId = [
  param('categoryId')
    .matches(UUID_REGEX)
    .withMessage('유효하지 않은 카테고리 ID 형식입니다.'),
];

const validateCreateCategory = [
  ...validateStoreId,
  body('name')
    .trim()
    .notEmpty().withMessage('카테고리명을 입력해주세요.')
    .isLength({ max: 50 }).withMessage('카테고리명은 50자 이하여야 합니다.'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('정렬 순서는 0 이상의 정수여야 합니다.'),
  handleValidation,
];

const validateUpdateCategory = [
  ...validateStoreId,
  ...validateCategoryId,
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('카테고리명은 비어있을 수 없습니다.')
    .isLength({ max: 50 }).withMessage('카테고리명은 50자 이하여야 합니다.'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('정렬 순서는 0 이상의 정수여야 합니다.'),
  handleValidation,
];

const validateCategoryOrder = [
  ...validateStoreId,
  body('categoryOrders')
    .isArray({ min: 1 }).withMessage('카테고리 순서 배열이 필요합니다.'),
  body('categoryOrders.*.categoryId')
    .matches(UUID_REGEX).withMessage('유효하지 않은 카테고리 ID 형식입니다.'),
  body('categoryOrders.*.sortOrder')
    .isInt({ min: 0 }).withMessage('정렬 순서는 0 이상의 정수여야 합니다.'),
  handleValidation,
];

const validateCreateMenu = [
  ...validateStoreId,
  body('name')
    .trim()
    .notEmpty().withMessage('메뉴명을 입력해주세요.')
    .isLength({ max: 100 }).withMessage('메뉴명은 100자 이하여야 합니다.'),
  body('price')
    .isInt({ min: 100, max: 500000 }).withMessage('가격은 100원 이상 500,000원 이하여야 합니다.'),
  body('categoryId')
    .matches(UUID_REGEX).withMessage('유효하지 않은 카테고리 ID 형식입니다.'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('설명은 500자 이하여야 합니다.'),
  handleValidation,
];

const validateUpdateMenu = [
  ...validateStoreId,
  ...validateMenuId,
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('메뉴명은 비어있을 수 없습니다.')
    .isLength({ max: 100 }).withMessage('메뉴명은 100자 이하여야 합니다.'),
  body('price')
    .optional()
    .isInt({ min: 100, max: 500000 }).withMessage('가격은 100원 이상 500,000원 이하여야 합니다.'),
  body('categoryId')
    .optional()
    .matches(UUID_REGEX).withMessage('유효하지 않은 카테고리 ID 형식입니다.'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('설명은 500자 이하여야 합니다.'),
  handleValidation,
];

const validateMenuOrder = [
  ...validateStoreId,
  body('menuOrders')
    .isArray({ min: 1 }).withMessage('메뉴 순서 배열이 필요합니다.'),
  body('menuOrders.*.menuId')
    .matches(UUID_REGEX).withMessage('유효하지 않은 메뉴 ID 형식입니다.'),
  body('menuOrders.*.sortOrder')
    .isInt({ min: 0 }).withMessage('정렬 순서는 0 이상의 정수여야 합니다.'),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateStoreId,
  validateMenuId,
  validateCategoryId,
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryOrder,
  validateCreateMenu,
  validateUpdateMenu,
  validateMenuOrder,
};
