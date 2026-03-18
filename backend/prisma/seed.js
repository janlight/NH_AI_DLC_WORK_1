const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  // 매장 생성
  const store = await prisma.store.upsert({
    where: { slug: 'sample-store' },
    update: {},
    create: {
      name: '샘플매장',
      slug: 'sample-store',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
    },
  });
  console.log(`Store created: ${store.name} (${store.slug})`);

  // 관리자 계정 생성
  const adminPasswordHash = await bcrypt.hash('admin1234', SALT_ROUNDS);
  const admin = await prisma.admin.upsert({
    where: { storeId_username: { storeId: store.id, username: 'admin' } },
    update: {},
    create: {
      storeId: store.id,
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'OWNER',
    },
  });
  console.log(`Admin created: ${admin.username} (${admin.role})`);

  // 카테고리 생성
  const categories = ['메인메뉴', '사이드', '음료', '디저트'];
  const createdCategories = [];
  for (let i = 0; i < categories.length; i++) {
    const cat = await prisma.category.upsert({
      where: { storeId_name: { storeId: store.id, name: categories[i] } },
      update: {},
      create: { storeId: store.id, name: categories[i], sortOrder: i },
    });
    createdCategories.push(cat);
  }
  console.log(`Categories created: ${categories.join(', ')}`);

  // 샘플 메뉴 생성
  const menus = [
    { categoryIdx: 0, name: '불고기', price: 15000, description: '달콤한 양념 불고기' },
    { categoryIdx: 0, name: '김치찌개', price: 9000, description: '돼지고기 김치찌개' },
    { categoryIdx: 0, name: '비빔밥', price: 10000, description: '야채 비빔밥' },
    { categoryIdx: 1, name: '계란말이', price: 7000, description: '부드러운 계란말이' },
    { categoryIdx: 1, name: '감자튀김', price: 6000, description: '바삭한 감자튀김' },
    { categoryIdx: 2, name: '콜라', price: 2000, description: '코카콜라 355ml' },
    { categoryIdx: 2, name: '사이다', price: 2000, description: '칠성사이다 355ml' },
    { categoryIdx: 3, name: '아이스크림', price: 4000, description: '바닐라 아이스크림' },
    { categoryIdx: 3, name: '떡', price: 5000, description: '꿀떡' },
  ];

  for (let i = 0; i < menus.length; i++) {
    const m = menus[i];
    await prisma.menu.create({
      data: {
        storeId: store.id,
        categoryId: createdCategories[m.categoryIdx].id,
        name: m.name,
        price: m.price,
        description: m.description,
        sortOrder: i,
      },
    });
  }
  console.log(`Menus created: ${menus.length} items`);

  // 테이블 생성 (1~5번)
  const tablePassword = await bcrypt.hash('1234', SALT_ROUNDS);
  for (let num = 1; num <= 5; num++) {
    await prisma.table.upsert({
      where: { storeId_tableNumber: { storeId: store.id, tableNumber: num } },
      update: {},
      create: {
        storeId: store.id,
        tableNumber: num,
        passwordHash: tablePassword,
      },
    });
  }
  console.log('Tables created: 1~5');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
