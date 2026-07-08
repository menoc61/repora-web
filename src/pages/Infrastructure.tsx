import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

interface LogEntry {
  type: string
  msg: string
  color: string
}

interface Service {
  name: string
  status: string
  color: string
  meta: string
}

const LOG_ENTRIES: LogEntry[] = [
  { type: 'INFO', msg: 'Ollama server starting on 127.0.0.1:11434', color: 'text-blue-400' },
  { type: 'INFO', msg: 'Detected GPU: NVIDIA GeForce RTX 4090 (24GB VRAM)', color: 'text-blue-400' },
  { type: 'INFO', msg: "Loading model 'llama3:70b' into memory...", color: 'text-blue-400' },
  { type: 'SUCCESS', msg: 'Model loaded. Ready for inference requests.', color: 'text-status-final' },
  { type: 'WARN', msg: 'Heavy concurrent requests detected. Queue size: 12', color: 'text-status-review' },
  { type: 'INFO', msg: 'Allocating additional VRAM buffers...', color: 'text-blue-400' },
  { type: 'STDOUT', msg: "Executing query on SQLite: SELECT * FROM vector_store WHERE doc_id = 'REP-099'", color: 'text-white/80' },
  { type: 'DEBUG', msg: 'Latency: 42ms. Output tokens: 512. Total tokens: 1.2k', color: 'text-status-final' },
]

const SIM_LOG: LogEntry[] = [
  { type: 'INFO', msg: 'Incoming WebSocket connection from 192.168.1.14', color: 'text-blue-400' },
  { type: 'DEBUG', msg: 'Embedding created for document block #4412', color: 'text-status-final' },
  { type: 'SUCCESS', msg: 'Backup routine completed in 2.4s', color: 'text-status-final' },
  { type: 'WARN', msg: 'Unusual traffic pattern detected on port 11434', color: 'text-status-review' },
  { type: 'INFO', msg: 'Flushing vector cache to persistent storage', color: 'text-blue-400' },
]

const SERVICES: Service[] = [
  { name: 'Ollama Inference Engine', status: 'check_circle', color: 'text-status-final', meta: 'PID: 4429' },
  { name: 'Yjs Collaboration Server', status: 'check_circle', color: 'text-status-final', meta: 'PID: 5122' },
  { name: 'Search Engine (Elastic)', status: 'warning', color: 'text-status-review', meta: 'Re-indexing' },
  { name: 'PDF Export Engine', status: 'check_circle', color: 'text-status-final', meta: 'PID: 3310' },
]

const LOAD_BARS: number[] = [30, 45, 55, 40, 70, 85, 65, 95, 50, 40, 60, 75, 35, 50, 80, 65, 45, 55, 70, 40, 60, 85, 50, 75, 65, 45, 80, 55, 70, 40, 60, 85, 50, 75, 65, 45, 80, 55, 70, 40, 60, 85, 50, 75, 65, 45, 80, 55, 70, 40, 60, 85, 50, 75, 65, 45, 80, 55, 70, 40]

export default function Infrastructure() {
  const [logs, setLogs] = useState<LogEntry[]>(LOG_ENTRIES)
  const logRef = useRef<HTMLDivElement>(null)
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const entry = SIM_LOG[logIndex % SIM_LOG.length]
      setLogs((prev) => [...prev, { ...entry, msg: `${entry.msg} [${new Date().toLocaleTimeString()}]` }])
      setLogIndex((i) => i + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [logIndex])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-16 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center bg-surface-container rounded-lg px-3 py-1.5 w-64 border border-outline-variant focus-within:border-secondary transition-colors">
            <Icon name="search" className="text-on-surface-variant text-[20px]" />
            <Input className="border-none bg-transparent focus-visible:ring-0 p-0 text-body-sm w-full" placeholder="Search infrastructure..." />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Workspace', 'Library', 'Agents'].map((t) => (
              <a key={t} className={`font-label-md text-label-md transition-colors ${t === 'Agents' ? 'text-primary border-b-2 border-secondary pb-1' : 'text-on-surface-variant hover:text-secondary'}`} href="#">{t}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md font-bold active:opacity-80 transition-opacity">Deploy Agent</Button>
          <button className="text-on-surface-variant hover:text-secondary p-1"><Icon name="notifications" /></button>
          <button className="text-on-surface-variant hover:text-secondary p-1"><Icon name="account_circle" /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 bg-surface-studio">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-12 flex items-center justify-between bg-white p-6 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-status-final animate-pulse" />
              <div>
                <h2 className="font-headline-md text-headline-md leading-tight">Instance Node: Repora-Alpha-01</h2>
                <p className="text-on-surface-variant text-body-sm">Operational • Uptime: 14d 2h 44m • Location: US-East-Self-Host</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface-variant">V 2.4.0-STABLE</span>
              <span className="px-3 py-1 bg-ai-glow text-secondary rounded-full text-label-sm font-label-sm">LOCAL-HOSTED</span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Ollama Status</p>
                <h3 className="font-headline-md text-headline-md mt-1">Llama-3-70B</h3>
              </div>
              <Icon name="smart_toy" className="text-secondary text-3xl" />
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-body-sm font-medium">GPU Utilization (RTX 4090)</span>
                  <span className="text-label-sm font-label-sm text-secondary">82%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: '82%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-body-sm font-medium">VRAM Allocation</span>
                  <span className="text-label-sm font-label-sm text-status-review">21.4 / 24 GB</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-status-review h-full rounded-full transition-all duration-1000" style={{ width: '89%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-status-final">
              <Icon name="check_circle" className="text-sm" fill />
              <span className="text-label-sm font-label-sm">Inference Active</span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Local Persistence</p>
                <h3 className="font-headline-md text-headline-md mt-1">SQLite Vector DB</h3>
              </div>
              <Icon name="database" className="text-on-surface-variant text-3xl" />
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="364.4" strokeDashoffset="127.5" className="text-secondary transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-headline-md font-bold">65%</span>
                  <span className="text-[10px] font-label-sm text-on-surface-variant">CAPACITY</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-4">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">Total Size</p>
                <p className="font-bold text-body-md">1.2 TB</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">I/O Wait</p>
                <p className="font-bold text-body-md">0.04ms</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md">Services</h3>
              <Button variant="link" className="text-secondary text-body-sm font-medium hover:underline p-0 h-auto">Restart All</Button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {SERVICES.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-studio">
                  <div className="flex items-center gap-3">
                    <Icon name={s.status} className={s.color} />
                    <span className="font-medium text-body-sm">{s.name}</span>
                  </div>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">{s.meta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 bg-on-surface p-6 rounded-xl border border-on-surface shadow-2xl h-[400px] flex flex-col font-label-sm text-label-sm">
            <div className="flex items-center justify-between mb-4 border-b border-on-surface-variant pb-2">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-white opacity-60">system@repora-alpha-01: /var/log/ollama</span>
              </div>
              <div className="flex gap-4">
                <span className="text-status-final">LIVE FEED</span>
                <span className="text-white opacity-40">UTF-8</span>
              </div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto pr-2 space-y-1 text-green-400 font-mono custom-scrollbar">
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-white opacity-30">[{new Date().toISOString().replace('T', ' ').split('.')[0]}]</span>
                  <span className={entry.color}>{entry.type}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t border-on-surface-variant flex gap-2">
              <span className="text-status-final">$</span>
              <Input className="border-none bg-transparent p-0 focus-visible:ring-0 text-white w-full font-mono outline-none" placeholder="Enter diagnostic command..." />
            </div>
          </div>

          <div className="col-span-12 bg-white p-6 rounded-xl border border-outline-variant">
            <h3 className="font-headline-md text-headline-md mb-6">Active System Load (24h)</h3>
            <div className="flex gap-1 h-24 items-end">
              {LOAD_BARS.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 ${h > 80 ? 'bg-error' : h > 60 ? 'bg-status-review' : 'bg-secondary'} opacity-40 hover:opacity-100 transition-opacity rounded-t-sm`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-label-sm text-on-surface-variant uppercase">
              <span>24 Hours Ago</span>
              <span>12 Hours Ago</span>
              <span>Just Now</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
