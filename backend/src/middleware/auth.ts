import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../services/auth.service'
import { AppError } from './error'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'unauthorized', 'Missing or invalid token'))
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'forbidden', 'Insufficient permissions'))
    }
    next()
  }
}
