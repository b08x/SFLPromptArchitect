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
  status?: number;
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
  // Handle case where error is undefined or null
  if (!err) {
    logger.error('Received undefined/null error in error handler');
    return res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'An unexpected error occurred.',
    });
  }
  
  // Enhanced logging with more context
  logger.error({
    message: err.message || 'Unknown error',
    stack: err.stack,
    statusCode: err.statusCode || err.status,
    name: err.name,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Determine status code from various possible properties
  const statusCode = err.statusCode || err.status || 500;
  
  // Determine if we should expose the error message
  let message: string;
  if (err.isOperational || statusCode < 500) {
    // Operational errors and client errors are safe to expose
    message = err.message || 'An error occurred.';
  } else {
    // Server errors should not expose internal details
    message = process.env.NODE_ENV === 'development' 
      ? err.message || 'An unexpected server error occurred.'
      : 'An unexpected error occurred.';
  }

  const errorResponse = {
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.name || 'Error',
    }),
  };

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;