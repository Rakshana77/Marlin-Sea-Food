import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyToken, JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Authentication required. Missing Bearer token.', 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw AppError.unauthorized('Authentication token missing', 'UNAUTHORIZED');
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw AppError.unauthorized('Invalid or expired authentication session', 'UNAUTHORIZED');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    // Role aliases: SUPER_ADMIN has full access like ADMIN; BILLING_STAFF has worker access
    const isAllowed =
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes('ADMIN') && userRole === 'SUPER_ADMIN') ||
      (normalizedAllowed.includes('WORKER') && userRole === 'BILLING_STAFF');

    if (!isAllowed) {
      throw AppError.forbidden("You don't have permission to perform this action.", 'FORBIDDEN');
    }

    next();
  };
}
