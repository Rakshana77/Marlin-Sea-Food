import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import http from 'http';

const server = http.createServer(app);

const startServer = (): void => {
  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        healthCheckUrl: `http://localhost:${env.PORT}/api/health`
      },
      '🚀 Marlin Sea Food ERP Backend Server started successfully'
    );
  });
};

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await prisma.$disconnect();
      logger.info('Prisma database connections closed');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database disconnect');
      process.exit(1);
    }
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Rejection detected');
  process.exit(1);
});

startServer();
