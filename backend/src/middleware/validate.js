const { ValidationError } = require('../errors/AppError');

/**
 * Joi 스키마 검증 미들웨어
 * @param {import('joi').Schema} schema - Joi 스키마
 * @param {string} source - 검증 대상 ('body' | 'params' | 'query')
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const data = req[source];
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(new ValidationError('입력 검증 실패', details));
  }

  req[source] = value;
  next();
};

module.exports = validate;
