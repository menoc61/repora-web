import http from 'http'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/error'
import { authRouter } from './routes/auth'
import { assistantRouter } from './routes/assistant'
import { projectRouter } from './routes/projects'
import { documentRouter } from './routes/documents'
import { diagramRouter } from './routes/diagrams'
import { adminRouter } from './routes/admin'
import { exportRouter } from './routes/export'
import { validationRouter } from './routes/validation'
import { modelsRouter } from './routes/models'
import { templateRouter } from './routes/templates'
import { collaborationRouter } from './routes/collaboration'
import { sharingRouter } from './routes/sharing'
import { infrastructureRouter } from './routes/infrastructure'
import { agentRouter } from './routes/agents'
import { commentRouter } from './routes/comments'
import { requirementRouter } from './routes/requirements'
import { createCollaborationServer } from './collaboration/ws'
import { discoverOllamaModel } from './ai/hermes'
import { db } from './db'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/projects', projectRouter)
app.use('/projects', diagramRouter)
app.use('/models', modelsRouter)
app.use('/documents', documentRouter)
app.use('/admin', adminRouter)
app.use('/export', exportRouter)
app.use('/validate', validationRouter)
app.use('/templates', templateRouter)
app.use('/collaboration', collaborationRouter)
app.use('/sharing', sharingRouter)
app.use('/infrastructure', infrastructureRouter)
app.use('/assistant', assistantRouter)
app.use('/agents', agentRouter)
app.use('/comments', commentRouter)
app.use('/requirements', requirementRouter)

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

discoverOllamaModel().then((model) => {
  console.log(`[Hermes] Default model: ${model} (provider: ollama)`)
  console.log(`Ollama model detected: ${model}`)
})

const server = http.createServer(app)
createCollaborationServer(server)
server.listen(config.port, () => {
  console.log(`Repora backend listening on :${config.port}`)
})

export default app
