/**
 * Order 입력 검증 함수
 * 패턴: Inline Validation (라우트 핸들러에서 직접 호출)
 */

const VALID_STATUSES = ['PENDING', 'PREPARING', 'COMPLETED'];

/**
 * 주문 생성 요청 검증
 * @param {object} body - req.body
 * @returns {Array} 에러 배열 (비어있으면 유효)
 */
function validateCreateOrder(body) {
  const errors = [];

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ code: 'EMPTY_CART', message: '주문 항목이 비어있습니다' });
    return errors;
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];

    if (!item.menuId || typeof item.menuId !== 'string') {
      errors.push({ code: 'INVALID_MENU_ID', message: `항목 ${i + 1}: 유효하지 않은 메뉴 ID` });
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push({ code: 'INVALID_QUANTITY', message: `항목 ${i + 1}: 수량은 1 이상 정수여야 합니다` });
    }
  }

  return errors;
}

/**
 * 주문 상태 변경 요청 검증
 * @param {object} body - req.body
 * @returns {Array} 에러 배열
 */
function validateStatusUpdate(body) {
  const errors = [];

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    errors.push({ code: 'INVALID_STATUS', message: `유효하지 않은 주문 상태: ${body.status}` });
  }

  return errors;
}

module.exports = {
  validateCreateOrder,
  validateStatusUpdate,
  VALID_STATUSES
};
