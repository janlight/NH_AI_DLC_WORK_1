/**
 * HTTP Cache Middleware - Cache-Control + ETag
 * Unit 2: menu-management (PERF-01)
 *
 * 고객 GET 요청: public, max-age=60 + ETag
 * 관리자 API: no-store
 */

/**
 * 캐시 미들웨어 팩토리
 * @param {Object} options
 * @param {number} options.maxAge - Cache-Control max-age (초), 기본 60
 * @param {boolean} options.isPublic - public/private, 기본 true
 * @param {Function} options.generateETag - ETag 생성 함수 (req) => Promise<string|null>
 */
function cacheMiddleware(options = {}) {
  const { maxAge = 60, isPublic = true, generateETag } = options;

  return async (req, res, next) => {
    // GET 요청만 캐시 적용
    if (req.method !== 'GET') {
      res.set('Cache-Control', 'no-store');
      return next();
    }

    try {
      // ETag 생성
      if (generateETag) {
        const etag = await generateETag(req);

        if (etag) {
          // If-None-Match 비교
          const ifNoneMatch = req.get('If-None-Match');
          if (ifNoneMatch && ifNoneMatch === etag) {
            return res.status(304).end();
          }

          res.set('ETag', etag);
        }
      }

      // Cache-Control 헤더 설정
      const visibility = isPublic ? 'public' : 'private';
      res.set('Cache-Control', `${visibility}, max-age=${maxAge}`);

      next();
    } catch (err) {
      // 캐시 에러는 무시하고 요청 계속 처리
      next();
    }
  };
}

/**
 * 캐시 비활성화 미들웨어 (관리자 API용)
 */
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

module.exports = { cacheMiddleware, noCache };
