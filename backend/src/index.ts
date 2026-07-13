import http from 'http'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config'
import { errorHandler } from './middleware/error'
import { authRouter } from './routes/auth'
import { assistantRouter } from './routes/assistant'
import { projectRouter } from './routes/projects'
import { documentRouter } from './routes/documents'
import { diagramRouter } from './routes/diagrams'
import { adminRouter } from './routes/admin'
import { validationRouter } from './routes/validation'
import { modelsRouter } from './routes/models'
import { templateRouter } from './routes/templates'
import { collaborationRouter } from './routes/collaboration'
import { sharingRouter } from './routes/sharing'
import { infrastructureRouter } from './routes/infrastructure'
import { agentRouter } from './routes/agents'
import { commentRouter } from './routes/comments'
import { requirementRouter } from './routes/requirements'
import { aiRouter } from './routes/ai'
import { createCollaborationServer } from './collaboration/ws'
import { discoverOllamaModel, probeToolSupport } from './ai/hermes'
import { ensureBucket } from './services/s3.service'
import { db } from './db'

// Global safety net: a single failing model probe or provider call must never
// crash the whole backend (e.g. a retired cloud model rejecting a background promise).
process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled rejection (ignored):', (reason as Error)?.message ?? reason)
})
process.on('uncaughtException', (err) => {
  console.warn('[Process] Uncaught exception (ignored):', err?.message ?? err)
})

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json())

// Serve uploaded diagrams as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/auth', authRouter)
app.use('/projects', projectRouter)
app.use('/projects', diagramRouter)
app.use('/models', modelsRouter)
app.use('/documents', documentRouter)
app.use('/admin', adminRouter)
app.use('/validate', validationRouter)
app.use('/templates', templateRouter)
app.use('/collaboration', collaborationRouter)
app.use('/sharing', sharingRouter)
app.use('/infrastructure', infrastructureRouter)
app.use('/assistant', assistantRouter)
app.use('/agents', agentRouter)
app.use('/comments', commentRouter)
app.use('/requirements', requirementRouter)
app.use('/ai', aiRouter)

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

discoverOllamaModel().then(async (model) => {
  console.log(`[Hermes] Default model: ${model} (provider: ollama)`)
  console.log(`Ollama model detected: ${model}`)
  // Probe only the default model at startup. Probing every model hammers flaky
  // cloud endpoints (retired/forbidden models) and can destabilize boot; the rest
  // are probed lazily on first use, with a name-heuristic fallback in between.
  try {
    await probeToolSupport('ollama', model)
  } catch (err) {
    console.warn('[Hermes] Default model probe failed:', (err as Error).message)
  }
}).catch((err) => {
  console.warn('[Hermes] Model discovery failed:', (err as Error).message)
})

ensureBucket().then(() => {
  console.log('[S3] Export bucket ready')
}).catch((err) => {
  console.warn('[S3] Bucket check failed:', (err as Error).message)
})

const server = http.createServer(app)
createCollaborationServer(server)
server.listen(config.port, () => {
  console.log(`Repora backend listening on :${config.port}`)
})

export default app
