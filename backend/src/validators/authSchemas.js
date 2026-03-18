const Joi = require('joi');

const tableLoginSchema = Joi.object({
  storeSlug: Joi.string().max(50).pattern(/^[a-z0-9-]+$/).required()
    .messages({ 'string.pattern.base': '매장 식별자는 영문 소문자, 숫자, 하이픈만 허용됩니다' }),
  tableNumber: Joi.number().integer().min(1).required(),
  password: Joi.string().min(1).max(100).required(),
});

const adminLoginSchema = Joi.object({
  storeSlug: Joi.string().max(50).pattern(/^[a-z0-9-]+$/).required()
    .messages({ 'string.pattern.base': '매장 식별자는 영문 소문자, 숫자, 하이픈만 허용됩니다' }),
  username: Joi.string().max(50).required(),
  password: Joi.string().min(1).max(100).required(),
});

module.exports = { tableLoginSchema, adminLoginSchema };
