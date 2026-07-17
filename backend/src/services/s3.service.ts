/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from '../config'
import { logger } from '../lib/logger'

const log = logger.child('S3')

let _s3mod: any = null
let _client: any = null
let _available = false
let _triedOnce = false

async function loadModule(): Promise<any> {
  if (!_s3mod) {
    _s3mod = await import('@aws-sdk/client-s3' as string)
  }
  return _s3mod
}

async function getClient(): Promise<any> {
  if (!_client) {
    const mod = await loadModule()
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

function isAvailable(): boolean {
  return _available
}

export async function ensureBucket(): Promise<void> {
  const bucket = config.s3.bucket
  if (!config.s3.endpoint) {
    log.warn('S3_ENDPOINT not set — S3 storage disabled')
    return
  }

  // If we already failed once this process, skip (no repeated retries per call)
  if (_triedOnce && !_available) {
    return
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const mod = await loadModule()
      const client = await getClient()

      try {
        await client.send(new mod.HeadBucketCommand({ Bucket: bucket }))
        log.info(`Bucket "${bucket}" exists`)
        _available = true
        _triedOnce = true
        return
      } catch (headErr: any) {
        if (headErr.$metadata?.httpStatusCode === 404 || headErr.$metadata?.httpStatusCode === 403 || headErr.name === 'NotFound' || headErr.name === 'Forbidden') {
          try {
            await client.send(new mod.CreateBucketCommand({ Bucket: bucket }))
            log.info(`Created bucket: ${bucket}`)
            _available = true
            _triedOnce = true
            return
          } catch (createErr: any) {
            if (attempt < 3) {
              log.warn(`CreateBucket attempt ${attempt}/3 failed (retrying in 1s):`, createErr.message)
              await new Promise(r => setTimeout(r, 1000))
              continue
            }
            log.error(`Failed to create bucket "${bucket}" after ${attempt} attempts:`, createErr.message)
            _triedOnce = true
            return
          }
        }
        throw headErr
      }
    } catch (err: any) {
      if (attempt < 3) {
        log.warn(`connect attempt ${attempt}/3 failed (retrying in 1s):`, err.message)
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      log.error(`Not available after ${attempt} attempts — S3 storage disabled:`, err.message)
      _triedOnce = true
      return
    }
  }
}

export async function uploadExport(
  documentId: string,
  format: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  if (!isAvailable()) return null
  try {
    const mod = await loadModule()
    const client = await getClient()
    const key = `exports/${documentId}/${format}-${Date.now()}.${format}`
    await client.send(new mod.PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: { documentId, format },
    }))
    return key
  } catch (err: any) {
    log.warn(`uploadExport failed:`, err.message)
    return null
  }
}

export async function uploadDocument(
  projectId: string,
  documentId: string,
  content: string | Buffer,
): Promise<string | null> {
  if (!isAvailable()) return null
  try {
    const mod = await loadModule()
    const client = await getClient()
    const key = `projects/${projectId}/documents/${documentId}.md`
    const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    await client.send(new mod.PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
      ContentType: 'text/markdown; charset=utf-8',
      Metadata: { projectId, documentId },
    }))
    return key
  } catch (err: any) {
    log.warn(`uploadDocument failed:`, err.message)
    return null
  }
}

export async function uploadDiagram(
  projectId: string,
  diagramId: string,
  svgContent: string,
): Promise<string | null> {
  if (!isAvailable()) return null
  try {
    const mod = await loadModule()
    const client = await getClient()
    const key = `projects/${projectId}/diagrams/${diagramId}.svg`
    await client.send(new mod.PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: Buffer.from(svgContent, 'utf-8'),
      ContentType: 'image/svg+xml; charset=utf-8',
      Metadata: { projectId, diagramId },
    }))
    return key
  } catch (err: any) {
    log.warn(`uploadDiagram failed:`, err.message)
    return null
  }
}

export async function listProjectDocuments(projectId: string): Promise<string[]> {
  if (!isAvailable()) return []
  try {
    const mod = await loadModule()
    const client = await getClient()
    const prefix = `projects/${projectId}/documents/`
    const result = await client.send(new mod.ListObjectsV2Command({
      Bucket: config.s3.bucket,
      Prefix: prefix,
    }))
    return (result.Contents || []).map((obj: any) => obj.Key as string)
  } catch (err: any) {
    log.warn(`listProjectDocuments failed:`, err.message)
    return []
  }
}

export async function listProjectDiagrams(projectId: string): Promise<string[]> {
  if (!isAvailable()) return []
  try {
    const mod = await loadModule()
    const client = await getClient()
    const prefix = `projects/${projectId}/diagrams/`
    const result = await client.send(new mod.ListObjectsV2Command({
      Bucket: config.s3.bucket,
      Prefix: prefix,
    }))
    return (result.Contents || []).map((obj: any) => obj.Key as string)
  } catch (err: any) {
    log.warn(`listProjectDiagrams failed:`, err.message)
    return []
  }
}

export async function deleteProjectStorage(projectId: string): Promise<void> {
  if (!isAvailable()) return
  try {
    const mod = await loadModule()
    const client = await getClient()
    const prefix = `projects/${projectId}/`
    let truncated = true
    let continuationToken: string | undefined

    while (truncated) {
      const listResult = await client.send(new mod.ListObjectsV2Command({
        Bucket: config.s3.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }))
      const objects = (listResult.Contents || []).map((obj: any) => ({ Key: obj.Key }))
      if (objects.length > 0) {
        await client.send(new mod.DeleteObjectsCommand({
          Bucket: config.s3.bucket,
          Delete: { Objects: objects },
        }))
      }
      truncated = listResult.IsTruncated ?? false
      continuationToken = listResult.NextContinuationToken
    }
  } catch (err: any) {
    log.warn(`deleteProjectStorage failed:`, err.message)
  }
}

export async function downloadExport(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!isAvailable()) return null
  try {
    const mod = await loadModule()
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
  } catch (err: any) {
    log.warn(`downloadExport failed:`, err.message)
    return null
  }
}

export function getExportUrl(key: string): string {
  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`
}
