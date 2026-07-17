import { Router, Request, Response } from 'express'
import { logger } from '../lib/logger'
import { requireAuth, requireRole } from '../middleware/auth'
import { logAudit } from '../services/audit.service'
import { db } from '../db'
import { sql } from 'drizzle-orm'
import os from 'os'
import { config } from '../config'

const log = logger.child('Infrastructure')
export const infrastructureRouter = Router()

async function checkDb(): Promise<{ status: string; latencyMs?: number }> {
  try {
    const start = Date.now()
    await db.execute(sql`SELECT 1`)
    return { status: 'up', latencyMs: Date.now() - start }
  } catch {
    return { status: 'down' }
  }
}

async function checkOllama(): Promise<{ status: string }> {
  try {
    const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)
    if (response.ok) return { status: 'up' }
    return { status: 'down' }
  } catch {
    return { status: 'down' }
  }
}

function detectGpu(): string | null {
  try {
    const platform = os.platform()
    if (platform === 'win32') {
      return 'nvidia' // conservative; could shell out to nvidia-smi
    }
    if (platform === 'linux') {
      try {
        const { execSync } = require('child_process')
        execSync('nvidia-smi', { timeout: 2000, stdio: 'ignore' })
        return 'nvidia'
      } catch {
        return null
      }
    }
    return null
  } catch {
    return null
  }
}

infrastructureRouter.get('/health', async (req: Request, res: Response) => {
  const [dbHealth, ollamaHealth] = await Promise.all([checkDb(), checkOllama()])

  const clientIp = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  res.json({
    status: dbHealth.status === 'up' ? 'healthy' : 'degraded',
    services: {
      api: { status: 'up' },
      database: dbHealth,
      llama: ollamaHealth,
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus().length,
      memoryTotalMb: Math.round(os.totalmem() / (1024 * 1024)),
      memoryFreeMb: Math.round(os.freemem() / (1024 * 1024)),
      gpu: detectGpu(),
    },
    client: {
      ip: clientIp,
      userAgent,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

infrastructureRouter.post('/restart', requireAuth, requireRole('super_admin'), async (req: Request, res: Response, next) => {
  try {
    const timestamp = new Date().toISOString()
    await logAudit({ userId: req.user!.userId, action: 'infrastructure.restart_attempted', target: 'system', metadata: { timestamp } })
    res.json({
      ok: true,
      message: 'Restart logged. Docker-managed services require external orchestration for actual restart.',
      timestamp,
    })
  } catch (err) { next(err) }
})
