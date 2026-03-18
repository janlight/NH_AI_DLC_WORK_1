require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// === Security Middleware ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// === Body Parsing ===
app.use(express.json({ limit: '10mb' }));

// === Request ID ===
app.use(requestId);

// === HTTP Request Logging ===
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim(), { context: { type: 'http' } }) },
}));

// === Routes ===
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `${req.method} ${req.path} 경로를 찾을 수 없습니다` },
  });
});

// === Global Error Handler ===
app.use(errorHandler);

// === Unhandled Rejection Handler ===
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { context: { reason: reason?.message || reason } });
});

// === Start Server ===
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`, {
      context: { port: PORT, env: process.env.NODE_ENV || 'development' },
    });
  });
}

module.exports = app;
