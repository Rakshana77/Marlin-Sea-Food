import pino from 'pino';
import { env } from '../config/env';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'jwt',
      'secret',
      'DATABASE_URL',
      'DIRECT_URL'
    ],
    censor: '[REDACTED]'
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});
