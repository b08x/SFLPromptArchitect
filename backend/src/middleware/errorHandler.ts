import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * @interface AppError
 * @extends Error
 * @description Custom error interface to include an optional statusCode and isOperational flag.
 * @property {number} [statusCode] - The HTTP status code to be sent in the response.
 * @property {boolean} [isOperational] - A flag to indicate if the error is operational (i.e., a known, handled error).
 */
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * @function errorHandler
 * @description Express middleware for centralized error handling.
 * It logs the error and sends a standardized JSON error response to the client.
 * For operational errors, it sends the specific error message. For other errors, it sends a generic message.
 *
 * @param {AppError} err - The error object. Can be a standard Error or a custom AppError.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
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