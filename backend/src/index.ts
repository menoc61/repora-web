import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/error'
import { authRouter } from './routes/auth'
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
import { discoverOllamaModel } from './ai/hermes'
import { db } from './db'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/projects', projectRouter)
app.use('/models', modelsRouter)
app.use('/documents', documentRouter)
app.use('/diagrams', diagramRouter)
app.use('/admin', adminRouter)
app.use('/export', exportRouter)
app.use('/validate', validationRouter)
app.use('/templates', templateRouter)
app.use('/collaboration', collaborationRouter)
app.use('/sharing', sharingRouter)
app.use('/infrastructure', infrastructureRouter)

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

discoverOllamaModel().then((model) => {
  console.log(`Ollama model detected: ${model}`)
})

app.listen(config.port, () => {
  console.log(`Repora backend listening on :${config.port}`)
})

export default app
