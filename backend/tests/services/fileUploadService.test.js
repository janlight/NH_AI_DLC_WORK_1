/**
 * FileUploadService 단위 테스트
 * Unit 2: menu-management
 */
const fs = require('fs');
const path = require('path');
const fileUploadService = require('../../src/services/fileUploadService');
const AppError = require('../../src/utils/AppError');

jest.mock('fs');
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    menu: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('FileUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateMagicBytes', () => {
    it('유효한 JPEG magic bytes를 통과시킨다', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
      expect(fileUploadService.validateMagicBytes(buffer, 'image/jpeg')).toBe(true);
    });

    it('유효한 PNG magic bytes를 통과시킨다', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]);
      expect(fileUploadService.validateMagicBytes(buffer, 'image/png')).toBe(true);
    });

    it('잘못된 magic bytes를 거부한다', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(fileUploadService.validateMagicBytes(buffer, 'image/jpeg')).toBe(false);
    });

    it('지원하지 않는 MIME 타입을 거부한다', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff]);
      expect(fileUploadService.validateMagicBytes(buffer, 'image/gif')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('파일이 없으면 에러를 던진다', () => {
      expect(() => fileUploadService.validateFile(null)).toThrow(AppError);
      expect(() => fileUploadService.validateFile(null)).toThrow('파일이 첨부되지 않았습니다.');
    });

    it('파일 크기가 5MB를 초과하면 에러를 던진다', () => {
      const file = { size: 6000000, mimetype: 'image/jpeg', path: '/tmp/test.jpg' };
      expect(() => fileUploadService.validateFile(file)).toThrow('이미지 파일 크기는 5MB 이하여야 합니다.');
    });

    it('허용되지 않은 MIME 타입이면 에러를 던진다', () => {
      const file = { size: 1000, mimetype: 'image/gif', path: '/tmp/test.gif' };
      expect(() => fileUploadService.validateFile(file)).toThrow('JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
    });

    it('magic bytes가 일치하지 않으면 파일을 삭제하고 에러를 던진다', () => {
      const file = { size: 1000, mimetype: 'image/jpeg', path: '/tmp/test.jpg' };
      fs.readFileSync.mockReturnValue(Buffer.from([0x00, 0x00, 0x00]));
      fs.unlinkSync.mockReturnValue(undefined);

      expect(() => fileUploadService.validateFile(file)).toThrow('JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test.jpg');
    });
  });

  describe('ensureDirectory', () => {
    it('디렉토리가 없으면 생성한다', () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockReturnValue(undefined);

      fileUploadService.ensureDirectory('/uploads/store-1/menus');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/uploads/store-1/menus', { recursive: true });
    });

    it('디렉토리가 이미 있으면 생성하지 않는다', () => {
      fs.existsSync.mockReturnValue(true);

      fileUploadService.ensureDirectory('/uploads/store-1/menus');

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('saveImage', () => {
    const storeId = 'store-001';
    const menuId = 'menu-001';
    const mockFile = {
      size: 1000,
      mimetype: 'image/jpeg',
      path: '/tmp/upload_123',
    };

    it('이미지를 저장하고 imageUrl을 반환한다', async () => {
      prisma.menu.findFirst.mockResolvedValue({ id: menuId, storeId, imageUrl: null });
      fs.readFileSync.mockReturnValue(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockReturnValue(undefined);
      fs.renameSync.mockReturnValue(undefined);
      prisma.menu.update.mockResolvedValue({});

      const result = await fileUploadService.saveImage(storeId, menuId, mockFile);

      expect(result.imageUrl).toMatch(/^\/uploads\/store-001\/menus\/menu-001_\d+\.jpg$/);
      expect(prisma.menu.update).toHaveBeenCalled();
    });

    it('메뉴가 존재하지 않으면 404 에러를 던진다', async () => {
      prisma.menu.findFirst.mockResolvedValue(null);
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockReturnValue(undefined);

      await expect(
        fileUploadService.saveImage(storeId, 'menu-999', mockFile)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteImage', () => {
    it('이미지 파일을 삭제한다', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockReturnValue(undefined);

      await fileUploadService.deleteImage('/uploads/store-001/menus/menu-001_123.jpg');

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('imageUrl이 null이면 아무것도 하지 않는다', async () => {
      await fileUploadService.deleteImage(null);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
