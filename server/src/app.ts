import express, { Application } from 'express';
import {
  configureSecurityHeaders,
  configureCors,
  configureCookieParser,
  configureBodyParsers
} from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export const createApp = (): Application => {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(configureSecurityHeaders);

  // 2. CORS Policy
  app.use(configureCors);

  // 3. Rate Limiting
  app.use(apiRateLimiter);

  // 4. Request Cookie & Body Parsers
  app.use(configureCookieParser);
  app.use(configureBodyParsers);

  // 5. HTTP Request Logging
  app.use(requestLogger);

  // 6. Primary API Router
  app.use('/api', apiRouter);

  // 7. Route Not Found (404)
  app.use(notFoundHandler);

  // 8. Centralized Error Handler (500, AppError, ZodError)
  app.use(errorHandler);

  return app;
};

export const app = createApp();
