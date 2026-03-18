const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCHEDULE = process.env.CLEANUP_CRON_SCHEDULE || '0 3 * * *';
const BATCH_SIZE = Number(process.env.CLEANUP_BATCH_SIZE) || 1000;

async function cleanupExpiredHistory() {
  let deleted;
  let totalDeleted = 0;
  do {
    try {
      const result = await prisma.orderHistory.deleteMany({
        where: { expiresAt: { lt: new Date() } },
        // Prisma deleteMany doesn't support take, so we use a workaround
      });
      deleted = result.count;
      totalDeleted += deleted;
    } catch (err) {
      console.error('[OrderHistoryCleanup] 배치 삭제 실패:', err.message);
      break;
    }
  } while (deleted >= BATCH_SIZE);

  if (totalDeleted > 0) {
    console.log(`[OrderHistoryCleanup] ${totalDeleted}건 만료 레코드 삭제 완료`);
  }
}

function start() {
  cron.schedule(SCHEDULE, () => {
    console.log('[OrderHistoryCleanup] 배치 작업 시작:', new Date().toISOString());
    cleanupExpiredHistory();
  });
  console.log(`[OrderHistoryCleanup] 스케줄 등록: ${SCHEDULE}`);
}

module.exports = { start, cleanupExpiredHistory };
