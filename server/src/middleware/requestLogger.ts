import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      ip: ip || req.socket.remoteAddress
    };

    if (statusCode >= 500) {
      logger.error(logData, 'HTTP Request Error');
    } else if (statusCode >= 400) {
      logger.warn(logData, 'HTTP Request Warning');
    } else {
      logger.info(logData, 'HTTP Request Success');
    }
  });

  next();
};
