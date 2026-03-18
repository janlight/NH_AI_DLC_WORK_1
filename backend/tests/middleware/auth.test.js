const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars!!';

const { authMiddleware, roleMiddleware } = require('../../src/middleware/auth');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, params: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next with UnauthorizedError if no auth header', () => {
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should call next with UnauthorizedError if not Bearer format', () => {
    req.headers.authorization = 'Basic abc123';
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should set req.user and call next for valid token', () => {
    const token = jwt.sign({ storeId: 'store-1', role: 'customer' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.storeId).toBe('store-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ForbiddenError for storeId mismatch', () => {
    const token = jwt.sign({ storeId: 'store-1', role: 'customer' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    req.params.storeId = 'store-2';

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should call next with UnauthorizedError for expired token', () => {
    const token = jwt.sign({ storeId: 'store-1' }, process.env.JWT_SECRET, { expiresIn: '0s' });
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: '토큰이 만료되었습니다' })
    );
  });
});

describe('roleMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { role: 'customer' } };
    res = {};
    next = jest.fn();
  });

  it('should call next if role is allowed', () => {
    roleMiddleware(['customer'])(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ForbiddenError if role not allowed', () => {
    roleMiddleware(['OWNER', 'MANAGER'])(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should call next with UnauthorizedError if no user', () => {
    req.user = null;
    roleMiddleware(['customer'])(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
