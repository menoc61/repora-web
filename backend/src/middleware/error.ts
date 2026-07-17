import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

const log = logger.child('Error')
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    })
    return
  }
  log.error('Unhandled error:', err)
  res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error' },
  })
}
