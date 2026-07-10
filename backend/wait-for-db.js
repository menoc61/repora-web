import net from 'node:net'

const url = process.env.DATABASE_URL || 'postgres://repora:repora@db:5432/repora'
const match = url.match(/@([^:]+):(\d+)/)
if (!match) { console.error('Cannot parse host:port from', url); process.exit(1) }

const host = match[1]
const port = parseInt(match[2], 10)

function check() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, host, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', (err) => reject(err))
    socket.setTimeout(3000, () => {
      socket.destroy()
      reject(new Error(`timeout connecting to ${host}:${port}`))
    })
  })
}

check().then(() => { console.log('ok'); process.exit(0) }).catch((e) => { console.error(e.message); process.exit(1) })
