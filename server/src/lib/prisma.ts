import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClientInstance: PrismaClient | undefined;
}

export const prisma =
  global.__prismaClientInstance ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' }
          ]
        : [{ emit: 'event', level: 'error' }]
  });

if (env.NODE_ENV !== 'production') {
  global.__prismaClientInstance = prisma;
}

// Attach event listeners for logging
if (env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, durationMs: e.duration }, 'Prisma Query');
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('error', (e: { message: string }) => {
  const sanitizedMessage = (e.message || '').replace(
    /(postgres(?:ql)?:\/\/)([^:@\s]+):([^@\s]+)@/gi,
    '$1$2:***@'
  );
  logger.error({ error: sanitizedMessage }, 'Prisma Database Error');
});
