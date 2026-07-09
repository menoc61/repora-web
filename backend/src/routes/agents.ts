import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import { runAgent } from '../ai/hermes'
import type { HermesEvent } from '../ai/hermes'

export const agentRouter = Router()

agentRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const agents = await db.select().from(schema.agentConfigs)
    res.json(agents.map(a => ({
      name: a.agentName,
      provider: a.provider,
      modelId: a.modelId,
      temperature: a.temperature,
      topP: a.topP,
      maxTokens: a.maxTokens,
      enabled: a.enabled,
    })))
  } catch (err) { next(err) }
})

agentRouter.post('/:name/test', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const { message } = req.body
    if (!message) throw new AppError(400, 'missing_fields', 'message is required')

    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)

    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)
    if (!agentConfig.enabled) throw new AppError(400, 'agent_disabled', `Agent "${name}" is disabled`)

    const tokens: string[] = []
    const gen = runAgent(name, message, {})
    for await (const event of gen) {
      const evt = event as HermesEvent
      if (evt.type === 'token') {
        tokens.push(evt.token)
      }
    }

    const reply = tokens.join('')
    res.json({ agent: name, reply })
  } catch (err) { next(err) }
})

agentRouter.post('/:name/enable', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)
    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)

    const enabled = req.body.enabled !== undefined ? req.body.enabled : !agentConfig.enabled
    const [updated] = await db.update(schema.agentConfigs)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(schema.agentConfigs.id, agentConfig.id))
      .returning()

    res.json({
      name: updated.agentName,
      provider: updated.provider,
      modelId: updated.modelId,
      enabled: updated.enabled,
    })
  } catch (err) { next(err) }
})

agentRouter.get('/:name/export', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)
    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)

    res.json({
      name: agentConfig.agentName,
      provider: agentConfig.provider,
      modelId: agentConfig.modelId,
      temperature: agentConfig.temperature,
      topP: agentConfig.topP,
      maxTokens: agentConfig.maxTokens,
      enabled: agentConfig.enabled,
      updatedAt: agentConfig.updatedAt?.toISOString() ?? new Date().toISOString(),
    })
  } catch (err) { next(err) }
})

agentRouter.get('/:name/tools', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)
    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)

    const meta = agentConfig.metadata as Record<string, unknown> | null
    const tools = (meta?.tools as Array<{ name: string; config: Record<string, unknown> }>) ?? []

    res.json({ agent: name, tools })
  } catch (err) { next(err) }
})

agentRouter.post('/:name/tools', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const { toolName, config: toolConfig } = req.body

    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)
    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)

    const meta = (agentConfig.metadata as Record<string, unknown>) ?? {}
    const tools = (meta.tools as Array<{ name: string; config: Record<string, unknown> }>) ?? []
    const existing = tools.findIndex((t) => t.name === toolName)
    if (existing >= 0) {
      tools[existing] = { name: toolName, config: toolConfig ?? {} }
    } else {
      tools.push({ name: toolName, config: toolConfig ?? {} })
    }
    meta.tools = tools

    await db.update(schema.agentConfigs)
      .set({ metadata: meta, updatedAt: new Date() })
      .where(eq(schema.agentConfigs.id, agentConfig.id))

    res.json({
      agent: name,
      tool: toolName,
      config: toolConfig,
      status: 'connected',
    })
  } catch (err) { next(err) }
})

agentRouter.delete('/:name/tools/:toolName', requireAuth, async (req, res, next) => {
  try {
    const name = req.params.name as string
    const toolName = req.params.toolName as string

    const [agentConfig] = await db.select().from(schema.agentConfigs)
      .where(eq(schema.agentConfigs.agentName, name))
      .limit(1)
    if (!agentConfig) throw new AppError(404, 'not_found', `Agent "${name}" not found`)

    const meta = (agentConfig.metadata as Record<string, unknown>) ?? {}
    const tools = (meta.tools as Array<{ name: string; config: Record<string, unknown> }>) ?? []
    meta.tools = tools.filter((t) => t.name !== toolName)

    await db.update(schema.agentConfigs)
      .set({ metadata: meta, updatedAt: new Date() })
      .where(eq(schema.agentConfigs.id, agentConfig.id))

    res.json({ agent: name, tool: toolName, status: 'disconnected' })
  } catch (err) { next(err) }
})
