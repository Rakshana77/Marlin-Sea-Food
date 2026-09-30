import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

/**
 * Standard API rate limiter for general routes
 * 300 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again after 15 minutes.'
    );
  }
});

/**
 * Strict rate limiter for authentication routes
 * 10 requests per 15 minutes per IP to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many login attempts. Please try again after 15 minutes.'
    );
  }
});
