/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from '../config'

let _client: any = null

async function getClient(): Promise<any> {
  if (!_client) {
    // Dynamic import — package is installed in Docker, not locally
    const mod = await import('@aws-sdk/client-s3' as string)
    const S3Client = mod.S3Client
    _client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: true,
    })
  }
  return _client
}

export async function ensureBucket(): Promise<void> {
  try {
    const mod = await import('@aws-sdk/client-s3' as string)
    const client = await getClient()
    const bucket = config.s3.bucket
    try {
      await client.send(new mod.HeadBucketCommand({ Bucket: bucket }))
    } catch {
      try {
        await client.send(new mod.CreateBucketCommand({ Bucket: bucket }))
        console.log(`[S3] Created bucket: ${bucket}`)
      } catch (err) {
        console.warn(`[S3] Failed to create bucket "${bucket}":`, (err as Error).message)
      }
    }
  } catch {
    console.warn('[S3] @aws-sdk/client-s3 not available — S3 storage disabled')
  }
}

export async function uploadExport(
  documentId: string,
  format: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const mod = await import('@aws-sdk/client-s3' as string)
  const client = await getClient()
  const key = `exports/${documentId}/${format}-${Date.now()}.${format === 'md' ? 'md' : format}`

  await client.send(new mod.PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: { documentId, format },
  }))

  return key
}

export async function downloadExport(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const mod = await import('@aws-sdk/client-s3' as string)
  const client = await getClient()
  const result = await client.send(new mod.GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  }))

  const chunks: Uint8Array[] = []
  const stream = result.Body as AsyncIterable<Uint8Array>
  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: result.ContentType || 'application/octet-stream',
  }
}

export function getExportUrl(key: string): string {
  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`
}
