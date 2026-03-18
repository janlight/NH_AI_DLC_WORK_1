/**
 * FileUploadService - 이미지 파일 저장/삭제/검증
 * Unit 2: menu-management (US-08-01)
 *
 * SECURITY: magic bytes 검증, 파일명 sanitization, 경로 격리
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880; // 5MB
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png').split(',');

// Magic bytes for file type verification
const MAGIC_BYTES = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
};

/**
 * magic bytes로 실제 파일 타입 검증
 */
function validateMagicBytes(buffer, mimetype) {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;

  return signatures.some((sig) =>
    buffer.slice(0, sig.length).equals(sig)
  );
}

/**
 * 파일 검증 (크기, MIME 타입, magic bytes)
 */
function validateFile(file) {
  if (!file) {
    throw new AppError(400, 'VALIDATION_ERROR', '파일이 첨부되지 않았습니다.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, 'FILE_TOO_LARGE', '이미지 파일 크기는 5MB 이하여야 합니다.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
  }

  // magic bytes 검증 (확장자 위조 방지)
  const buffer = fs.readFileSync(file.path);
  if (!validateMagicBytes(buffer, file.mimetype)) {
    // 위조된 파일 삭제
    fs.unlinkSync(file.path);
    throw new AppError(400, 'INVALID_FILE_TYPE', 'JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
  }
}

/**
 * 디렉토리 존재 확인/생성
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 이미지 저장 및 Menu.imageUrl 업데이트
 */
async function saveImage(storeId, menuId, file) {
  // 메뉴 존재 확인
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, storeId },
  });
  if (!menu) {
    // 임시 파일 정리
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다.');
  }

  // 파일 검증
  validateFile(file);

  // 저장 경로 생성
  const storeDir = path.join(UPLOAD_DIR, storeId, 'menus');
  ensureDirectory(storeDir);

  // 파일명 생성: {menuId}_{timestamp}.{ext}
  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const filename = `${menuId}_${Date.now()}.${ext}`;
  const destPath = path.join(storeDir, filename);

  // 기존 이미지 삭제
  if (menu.imageUrl) {
    await deleteImage(menu.imageUrl);
  }

  // 파일 이동 (multer temp → 최종 경로)
  fs.renameSync(file.path, destPath);

  // 상대 경로로 DB 업데이트
  const imageUrl = `/uploads/${storeId}/menus/${filename}`;
  await prisma.menu.update({
    where: { id: menuId },
    data: { imageUrl },
  });

  logger.info('Image uploaded', { storeId, menuId, filename });
  return { imageUrl };
}

/**
 * 이미지 파일 삭제 (non-blocking, warn 로깅)
 */
async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  try {
    const filePath = path.join(UPLOAD_DIR, '..', imageUrl);
    const resolvedPath = path.resolve(filePath);

    // 경로 탈출 방지
    const uploadsRoot = path.resolve(UPLOAD_DIR);
    if (!resolvedPath.startsWith(uploadsRoot)) {
      logger.warn('Path traversal attempt blocked', { imageUrl });
      return;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      logger.info('Image deleted', { imageUrl });
    }
  } catch (err) {
    logger.warn('Failed to delete image file', { imageUrl, error: err.message });
  }
}

module.exports = {
  validateFile,
  validateMagicBytes,
  ensureDirectory,
  saveImage,
  deleteImage,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
