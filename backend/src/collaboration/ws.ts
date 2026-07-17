import http from 'http'
import { logger } from '../lib/logger'
import { WebSocketServer, WebSocket } from 'ws'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { verifyToken } from '../services/auth.service'

const log = logger.child('WS')
const messageSync = 0
const messageAwareness = 1
const messageAuth = 2
const messageQueryAwareness = 3

const docs = new Map<string, Y.Doc>()
const awarenesses = new Map<string, awarenessProtocol.Awareness>()

function getYDoc(docName: string): { doc: Y.Doc; awareness: awarenessProtocol.Awareness } {
  let doc = docs.get(docName)
  let awa = awarenesses.get(docName)
  if (!doc) {
    doc = new Y.Doc()
    awa = new awarenessProtocol.Awareness(doc)
    doc.on('update', (update: Uint8Array, origin: any) => {
      broadcastUpdate(docName, update, origin)
    })
    docs.set(docName, doc)
    awarenesses.set(docName, awa)
  }
  return { doc, awareness: awa! }
}

const rooms = new Map<string, Set<WebSocket>>()

function getRoom(docName: string): Set<WebSocket> {
  let room = rooms.get(docName)
  if (!room) {
    room = new Set<WebSocket>()
    rooms.set(docName, room)
  }
  return room
}

function broadcastUpdate(docName: string, update: Uint8Array, origin: any) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)

  const room = rooms.get(docName)
  if (room) {
    for (const conn of room) {
      sendIfOpen(conn, message)
    }
  }
}

function broadcastAwareness(
  docName: string,
  message: Uint8Array,
  exclude: WebSocket | null
) {
  const room = rooms.get(docName)
  if (room) {
    for (const conn of room) {
      if (conn !== exclude) {
        sendIfOpen(conn, message)
      }
    }
  }
}

function sendIfOpen(ws: WebSocket, message: Uint8Array) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message)
  }
}

function messageListener(
  conn: WebSocket,
  doc: Y.Doc,
  awareness: awarenessProtocol.Awareness,
  docName: string
) {
  conn.on('message', (raw: Buffer | ArrayBuffer) => {
    try {
      const data = new Uint8Array(
        raw instanceof ArrayBuffer ? raw : raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
      )

      const decoder = decoding.createDecoder(data)
      const encoder = encoding.createEncoder()
      const messageType = decoding.readVarUint(decoder)

      switch (messageType) {
        case messageSync: {
          encoding.writeVarUint(encoder, messageSync)
          syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
          const reply = encoding.toUint8Array(encoder)
          if (reply.length > 1) {
            sendIfOpen(conn, reply)
          }
          break
        }
        case messageQueryAwareness: {
          encoding.writeVarUint(encoder, messageAwareness)
          encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(
              awareness,
              Array.from(awareness.getStates().keys())
            )
          )
          sendIfOpen(conn, encoding.toUint8Array(encoder))
          break
        }
        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            awareness,
            decoding.readVarUint8Array(decoder),
            conn
          )
          break
        }
        case messageAuth: {
          log.info(`Auth message received for doc ${docName}`)
          break
        }
      }
    } catch (err) {
      log.error('Collaboration message error:', err)
    }
  })
}

export function createCollaborationServer(server: http.Server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '', 'http://localhost')

    if (url.pathname === '/notifications') {
      notificationClients.add(ws)
      ws.on('close', () => notificationClients.delete(ws))
      return
    }

    // JWT auth — token passed as query param (browser WebSocket API)
    const token = url.searchParams.get('token')
    if (!token) {
      log.warn('Connection rejected: missing token')
      ws.close(4001, 'Authentication required')
      return
    }
    try {
      verifyToken(token)
    } catch {
      log.warn('Connection rejected: invalid token')
      ws.close(4001, 'Invalid or expired token')
      return
    }

    const docName = url.pathname.replace('/collab/', '')
    if (!docName) return

    const { doc, awareness } = getYDoc(docName)
    const room = getRoom(docName)
    room.add(ws)

    ws.on('close', () => {
      room.delete(ws)
      if (room.size === 0) {
        rooms.delete(docName)
      }
    })

    messageListener(ws, doc, awareness, docName)
    log.info(`Collaboration: client connected to document ${docName}`)
  })

  log.info('Collaboration WebSocket server ready')
  return wss
}

// Global notification broadcast
const notificationClients = new Set<WebSocket>()

export function broadcastNotification(event: {
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}) {
  const payload = JSON.stringify(event)
  for (const ws of notificationClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  }
}
