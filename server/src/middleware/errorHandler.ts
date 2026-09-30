import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/response';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Operational AppError
  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message, details: err.details }, 'Operational Error');
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle malformed JSON request body
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    sendError(res, 400, 'MALFORMED_JSON', 'Malformed JSON payload in request body');
    return;
  }

  // Handle CORS origin error
  if (err.message && err.message.startsWith('CORS origin not allowed')) {
    sendError(res, 403, 'CORS_ERROR', err.message);
    return;
  }

  // Unhandled / Internal Server Errors
  logger.error(
    {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined
    },
    'Unhandled Server Error'
  );

  const isProduction = env.NODE_ENV === 'production';
  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    isProduction ? 'An unexpected internal server error occurred' : err.message,
    isProduction ? undefined : { stack: err.stack }
  );
};
