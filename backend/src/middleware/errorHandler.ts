import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected error occurred.';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};

export default errorHandler;
