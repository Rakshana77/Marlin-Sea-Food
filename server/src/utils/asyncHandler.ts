import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express request handler so any thrown errors
 * or rejected promises are automatically passed to next()
 * and caught by the centralized error handler middleware.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
