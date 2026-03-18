const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// 민감 데이터 필터링
const sensitiveFields = ['password', 'passwordHash', 'token', 'authorization'];

const filterSensitive = winston.format((info) => {
  if (info.context && typeof info.context === 'object') {
    const filtered = { ...info.context };
    for (const field of sensitiveFields) {
      if (filtered[field]) {
        filtered[field] = '***REDACTED***';
      }
    }
    info.context = filtered;
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    filterSensitive(),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  transports: [
    // 전체 로그 파일 (일별 rotation, 90일 보존)
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
    }),
    // 에러 전용 로그 파일
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
      level: 'error',
    }),
  ],
});

// 개발 환경: 콘솔 출력 추가
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
