import { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { AppError } from './error'

export function validate(schema: ZodSchema, coerceEmpty = true) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const body = coerceEmpty && req.body === undefined ? {} : req.body
    const result = schema.safeParse(body)
    if (!result.success) {
      const first = result.error.issues[0]
      const message = first ? `${first.path.join('.')}: ${first.message}` : 'Invalid request body'
      return next(new AppError(400, 'validation_error', message))
    }
    req.body = result.data
    next()
  }
}
