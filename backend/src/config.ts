import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://repora:repora@localhost:5434/repora',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  llamaCppUrl: process.env.LLAMA_CPP_URL || 'http://localhost:8080/v1',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5-coder:latest',
  plantumlUrl: process.env.PLANTUML_SERVER_URL || 'https://www.plantuml.com/plantuml',
  byokUrl: process.env.BYOK_BASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'repora-exports',
    region: process.env.S3_REGION || 'us-east-1',
  },
}
