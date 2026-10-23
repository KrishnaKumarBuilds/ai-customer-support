import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
