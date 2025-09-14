import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error class
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new CustomError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new CustomError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new CustomError(message, 401);
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const message = (err as any).errors.map((e: any) => e.message).join(', ');
    error = new CustomError(message, 400);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Invalid reference to related resource';
    error = new CustomError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Unhandled promise rejection handler
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack,
      promise: promise,
      timestamp: new Date().toISOString()
    });
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
};
