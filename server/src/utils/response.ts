import { Response } from 'express';
import { ApiResponseMeta, ApiSuccessResponse, ApiErrorResponse } from '../types/api';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponseMeta
): Response => {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {})
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR',
  message = 'An unexpected error occurred',
  details?: unknown
): Response => {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {})
    }
  };
  return res.status(statusCode).json(payload);
};
