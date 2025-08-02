"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../config/logger"));
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
const errorHandler = (err, req, res, next) => {
    logger_1.default.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'An unexpected error occurred.';
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
};
exports.default = errorHandler;
