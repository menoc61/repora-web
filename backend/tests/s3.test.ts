import { describe, it, expect, vi, beforeEach } from 'vitest'

const putCalls: any[] = []
const getCalls: any[] = []
const headCalls: any[] = []
const createCalls: any[] = []
let shouldHeadFail = false
let shouldPutFail = false

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    public config: any
    static instances: any[] = []
    constructor(cfg: any) {
      this.config = cfg
      S3Client.instances.push(this)
    }
    send(cmd: any) {
      if (cmd instanceof HeadBucketCommand) {
        headCalls.push(cmd.input)
        if (shouldHeadFail) {
          const e: any = new Error('NotFound')
          e.name = 'NotFound'
          return Promise.reject(e)
        }
        return Promise.resolve({})
      }
      if (cmd instanceof CreateBucketCommand) {
        createCalls.push(cmd.input)
        return Promise.resolve({})
      }
      if (cmd instanceof PutObjectCommand) {
        putCalls.push(cmd.input)
        if (shouldPutFail) return Promise.reject(new Error('put failed'))
        return Promise.resolve({})
      }
      if (cmd instanceof GetObjectCommand) {
        getCalls.push(cmd.input)
        return Promise.resolve({
          Body: (async function* () {
            yield new Uint8Array([1, 2, 3])
          })(),
          ContentType: 'application/pdf',
        })
      }
      return Promise.resolve({})
    }
  }
  class HeadBucketCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  class CreateBucketCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  class PutObjectCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  class GetObjectCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  return { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand }
})

async function loadS3() {
  vi.resetModules()
  const s3 = await import('@aws-sdk/client-s3')
  const svc = await import('../src/services/s3.service')
  const { config } = await import('../src/config')
  return { s3, svc, config }
}

describe('s3.service', () => {
  beforeEach(() => {
    putCalls.length = 0
    getCalls.length = 0
    headCalls.length = 0
    createCalls.length = 0
    shouldHeadFail = false
    shouldPutFail = false
  })

  it('uploadExport sends PutObject with bucket + generated key', async () => {
    const { svc, config } = await loadS3()
    await svc.ensureBucket()
    const key = await svc.uploadExport('doc-1', 'pdf', Buffer.from('hello'), 'application/pdf')
    expect(putCalls.length).toBe(1)
    expect(putCalls[0].Bucket).toBe(config.s3.bucket)
    expect(putCalls[0].Key).toMatch(/^exports\/doc-1\/pdf-\d+\.pdf$/)
    expect(putCalls[0].Body).toBeInstanceOf(Buffer)
    expect(key).toBe(putCalls[0].Key)
  })

  it('downloadExport returns buffer + content type', async () => {
    const { svc, config } = await loadS3()
    await svc.ensureBucket()
    const res = await svc.downloadExport('exports/doc-1/pdf-x.pdf')
    expect(res).not.toBeNull()
    expect(getCalls.length).toBe(1)
    expect(getCalls[0].Bucket).toBe(config.s3.bucket)
    expect(getCalls[0].Key).toBe('exports/doc-1/pdf-x.pdf')
    expect(res!.contentType).toBe('application/pdf')
    expect(res!.buffer).toBeInstanceOf(Buffer)
    expect(res!.buffer.length).toBe(3)
  })

  it('getExportUrl builds the endpoint URL', async () => {
    const { svc, config } = await loadS3()
    const url = svc.getExportUrl('exports/doc-1/pdf-x.pdf')
    expect(url).toBe(`${config.s3.endpoint}/${config.s3.bucket}/exports/doc-1/pdf-x.pdf`)
  })

  it('ensureBucket creates the bucket when head fails', async () => {
    const { svc } = await loadS3()
    shouldHeadFail = true
    await svc.ensureBucket()
    expect(headCalls.length).toBe(1)
    expect(createCalls.length).toBe(1)
  })

  it('uploadExport returns null when S3 is unavailable', async () => {
    const { svc } = await loadS3()
    shouldPutFail = true
    await svc.ensureBucket()
    const result = await svc.uploadExport('doc-1', 'pdf', Buffer.from('x'), 'application/pdf')
    expect(result).toBeNull()
  })

  it('uploadExport returns null when ensureBucket was never called', async () => {
    const { svc } = await loadS3()
    const result = await svc.uploadExport('doc-1', 'pdf', Buffer.from('x'), 'application/pdf')
    expect(result).toBeNull()
  })

  it('listProjectDocuments returns empty array when S3 unavailable', async () => {
    const { svc } = await loadS3()
    const result = await svc.listProjectDocuments('proj-1')
    expect(result).toEqual([])
  })

  it('listProjectDiagrams returns empty array when S3 unavailable', async () => {
    const { svc } = await loadS3()
    const result = await svc.listProjectDiagrams('proj-1')
    expect(result).toEqual([])
  })

  it('deleteProjectStorage does not throw when S3 unavailable', async () => {
    const { svc } = await loadS3()
    await expect(svc.deleteProjectStorage('proj-1')).resolves.toBeUndefined()
  })

  it('downloadExport returns null when S3 unavailable', async () => {
    const { svc } = await loadS3()
    const result = await svc.downloadExport('exports/doc-1/pdf-x.pdf')
    expect(result).toBeNull()
  })
})
