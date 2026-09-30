import { prisma } from './prisma';
import { logger } from './logger';

async function testConnection() {
  try {
    // Attempt a raw query to verify PostgreSQL connectivity
    await prisma.$queryRaw`SELECT 1 as connected;`;
    logger.info('Database connection successfully established with Supabase PostgreSQL');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    const errMsg = err?.message || 'Unknown database error';

    if (errMsg.includes('password authentication failed') || errMsg.includes('[YOUR-PASSWORD]')) {
      logger.error({ code: 'AUTH_FAILED' }, 'Database authentication failed: Placeholder or invalid password');
    } else {
      logger.error({ code: err?.code || 'CONNECTION_FAILED' }, 'Database connection could not be established');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
