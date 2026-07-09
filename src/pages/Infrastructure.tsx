import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useHealth, useInfraHealth, useRestartServices, useLogs } from '../hooks/useQueries'

interface LogEntry {
  type: string
  msg: string
  color: string
}

interface InfraService {
  name: string
  status: string
  pid?: number
  extra?: string
}

interface InfraHealthResponse {
  status?: string
  services?: {
    api?: { status?: string }
    database?: { status?: string; latencyMs?: number }
    llama?: { status?: string }
  }
  system?: {
    hostname?: string
    platform?: string
    cpus?: number
    memoryTotalMb?: number
    memoryFreeMb?: number
    gpu?: string | null
  }
  uptime?: number
  timestamp?: string
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}j`)
  if (h > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(' ')
}

function logColor(type: string): string {
  const t = type.toUpperCase()
  if (t === 'INFO') return 'text-blue-400'
  if (t === 'SUCCESS' || t === 'OK') return 'text-status-final'
  if (t === 'WARN' || t === 'WARNING') return 'text-status-review'
  if (t === 'ERROR' || t === 'FATAL') return 'text-red-400'
  if (t === 'DEBUG') return 'text-status-final'
  if (t === 'STDOUT') return 'text-white/80'
  if (t === 'CMD') return 'text-yellow-400'
  return 'text-blue-400'
}

function serviceIcon(status: string): string {
  const s = status.toLowerCase()
  if (['running', 'ok', 'healthy', 'active', 'online'].includes(s)) return 'check_circle'
  if (['warning', 'reindexing', 'degraded', 'starting'].includes(s)) return 'warning'
  if (['stopped', 'error', 'dead', 'offline'].includes(s)) return 'cancel'
  return 'help'
}

function serviceIconColor(status: string): string {
  const s = status.toLowerCase()
  if (['running', 'ok', 'healthy', 'active', 'online'].includes(s)) return 'text-status-final'
  if (['warning', 'reindexing', 'degraded', 'starting'].includes(s)) return 'text-status-review'
  if (['stopped', 'error', 'dead', 'offline'].includes(s)) return 'text-red-400'
  return 'text-on-surface-variant'
}

export default function Infrastructure() {
  const { data: health, isLoading: healthLoading, error: healthError } = useHealth()
  const { data: infraHealth, isLoading: infraLoading, error: infraError } = useInfraHealth()
  const { data: apiLogs, isLoading: logsLoading, error: logsError } = useLogs()
  const restartServices = useRestartServices()
  const enableAgent = useEnableAgent()
  const navigate = useNavigate()

  const [userCmds, setUserCmds] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [diagInput, setDiagInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  const typedInfra = infraHealth as InfraHealthResponse | undefined

  const status = healthLoading
    ? 'CHARGEMENT...'
    : healthError
      ? 'INDISPONIBLE'
      : health?.status === 'ok'
        ? 'OPERATIONNEL'
        : 'INCONNU'

  const displayLogs = useMemo(() => {
    const mapped: LogEntry[] = (apiLogs ?? []).map((l) => ({
      type: l.action.toUpperCase(),
      msg: l.target,
      color: logColor(l.action),
    }))
    return [...mapped, ...userCmds]
  }, [apiLogs, userCmds])

  // Map backend services object to array for display
  const servicesObj = typedInfra?.services
  const services: InfraService[] = servicesObj
    ? [
        { name: 'API Repora', status: servicesObj.api?.status ?? 'unknown' },
        { name: 'Base de donnees', status: servicesObj.database?.status ?? 'unknown', extra: servicesObj.database?.latencyMs != null ? `${servicesObj.database.latencyMs}ms` : undefined },
        { name: 'LLM (Ollama)', status: servicesObj.llama?.status ?? 'unknown' },
      ]
    : []

  const instanceHostname = typedInfra?.system?.hostname ?? 'Repora-Alpha-01'
  const instancePlatform = typedInfra?.system?.platform ?? '—'
  const instanceCpus = typedInfra?.system?.cpus ?? 0
  const memoryTotalMb = typedInfra?.system?.memoryTotalMb ?? 0
  const memoryFreeMb = typedInfra?.system?.memoryFreeMb ?? 0
  const memoryPct = memoryTotalMb > 0 ? Math.round(((memoryTotalMb - memoryFreeMb) / memoryTotalMb) * 100) : 0
  const instanceVersion = '—'
  const instanceLocation = '—'
  const instanceMode = 'HEBERGE-LOCAL'
  const instanceUptime = typedInfra?.uptime != null ? formatUptime(typedInfra.uptime) : '—'

  const hasGpu = typedInfra?.system?.gpu != null
  const gpuName = typedInfra?.system?.gpu ?? '—'
  const gpuActive = hasGpu
  const gpuUtil = 0
  const gpuVramUsed = 0
  const gpuVramTotal = 0
  const gpuVramPct = 0
  const storagePct = memoryPct
  const storageName = 'Stockage local'
  const storageTotal = `${Math.round(memoryTotalMb / 1024)} GB`
  const loadHistory: number[] = []
  const filteredServices = services.filter((s) =>
    searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  )

  const handleDeployAgent = () => {
    enableAgent.mutate('Orchestrateur')
  }

  const handleRestartAll = () => {
    restartServices.mutate()
  }

  const handleDiagCommand = () => {
    if (!diagInput.trim()) return
    if (diagInput.trim() === 'cls' || diagInput.trim() === 'clear') {
      setUserCmds([])
    } else {
      setUserCmds((prev) => [...prev, { type: 'CMD', msg: diagInput.trim(), color: 'text-yellow-400' }])
    }
    setDiagInput('')
  }

  const strokeDash = 2 * Math.PI * 58
  const strokeOffset = strokeDash * (1 - storagePct / 100)

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-16 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center bg-surface-container rounded-lg px-3 py-1.5 w-64 border border-outline-variant focus-within:border-secondary transition-colors">
            <Icon name="search" className="text-on-surface-variant text-[20px]" />
            <Input
              className="border-none bg-transparent focus-visible:ring-0 p-0 text-body-sm w-full"
              placeholder="Rechercher infrastructure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/workspace" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Espace de travail</Link>
            <Link to="/library" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Bibliotheque</Link>
            <Link to="/agents" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Agents</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md font-bold active:opacity-80 transition-opacity" onClick={handleDeployAgent} disabled={enableAgent.isPending}>
            {enableAgent.isPending ? 'Deploiement...' : 'Deployer un agent'}
          </Button>
          <Link to="/settings" className="text-on-surface-variant hover:text-secondary p-1">
            <Icon name="settings" />
          </Link>
          <button className="text-on-surface-variant hover:text-secondary p-1" onClick={() => alert('Fonctionnalite a venir')}><Icon name="notifications" /></button>
          <button className="text-on-surface-variant hover:text-secondary p-1" onClick={() => navigate({ to: '/settings' })}><Icon name="account_circle" /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 bg-surface-studio">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-12 flex items-center justify-between bg-white p-6 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${healthLoading ? 'bg-yellow-500 animate-pulse' : healthError ? 'bg-red-500' : health?.status === 'ok' ? 'bg-status-final animate-pulse' : 'bg-status-review'}`} />
              <div>
                <h2 className="font-headline-md text-headline-md leading-tight">
                  {infraLoading
                    ? 'Chargement...'
                    : infraError
                      ? 'Instance indisponible'
                      : `Noeud d'instance : ${instanceHostname}`}
                </h2>
                <p className="text-on-surface-variant text-body-sm">
                  {status} &bull; Disponibilite : {instanceUptime} &bull; Localisation : {instanceLocation}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface-variant">
                V {instanceVersion}
              </span>
              <span className="px-3 py-1 bg-ai-glow text-secondary rounded-full text-label-sm font-label-sm">
                {instanceMode}
              </span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Statut GPU</p>
                <h3 className="font-headline-md text-headline-md mt-1">{hasGpu ? gpuName : 'Aucun GPU detecte'}</h3>
              </div>
              <Icon name="smart_toy" className="text-secondary text-3xl" />
            </div>
            {infraLoading ? (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
                Chargement...
              </div>
            ) : !hasGpu ? (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
                Donnees GPU indisponibles
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-body-sm font-medium">Utilisation GPU</span>
                    <span className="text-label-sm font-label-sm text-secondary">{gpuUtil}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${gpuUtil}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-body-sm font-medium">Allocation VRAM</span>
                    <span className="text-label-sm font-label-sm text-status-review">
                      {gpuVramUsed} / {gpuVramTotal} GB
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-status-review h-full rounded-full transition-all duration-1000" style={{ width: `${gpuVramPct}%` }} />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Icon
                name={gpuActive ? 'check_circle' : 'cancel'}
                className={`text-sm ${gpuActive ? 'text-status-final' : 'text-on-surface-variant'}`}
                fill
              />
              <span className="text-label-sm font-label-sm">
                {gpuActive ? 'Inference active' : 'Inference inactive'}
              </span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Persistance locale</p>
                <h3 className="font-headline-md text-headline-md mt-1">{storageName}</h3>
              </div>
              <Icon name="database" className="text-on-surface-variant text-3xl" />
            </div>
            {infraLoading ? (
              <div className="flex flex-col items-center justify-center py-4 text-on-surface-variant text-body-sm">
                Chargement...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={strokeDash} strokeDashoffset={strokeOffset} className="text-secondary transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-headline-md font-bold">{storagePct}%</span>
                    <span className="text-[10px] font-label-sm text-on-surface-variant">CAPACITE</span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-4">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">Taille totale</p>
                <p className="font-bold text-body-md">{storageTotal}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">Attente E/S</p>
                <p className="font-bold text-body-md">{storageIowait}</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md">Services</h3>
              <Button variant="link" className="text-secondary text-body-sm font-medium hover:underline p-0 h-auto" onClick={handleRestartAll} disabled={restartServices.isPending}>
                {restartServices.isPending ? 'Redemarrage...' : 'Tout redemarrer'}
              </Button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {infraLoading ? (
                <div className="flex items-center justify-center h-full text-on-surface-variant text-body-sm">
                  Chargement...
                </div>
              ) : infraError ? (
                <div className="flex items-center justify-center h-full text-red-400 text-body-sm">
                  Erreur de chargement des services
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="flex items-center justify-center h-full text-on-surface-variant text-body-sm">
                  Aucun service trouve
                </div>
              ) : (
                filteredServices.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-studio">
                    <div className="flex items-center gap-3">
                      <Icon name={serviceIcon(s.status)} className={serviceIconColor(s.status)} />
                      <span className="font-medium text-body-sm">{s.name}</span>
                    </div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">
                      {s.extra ?? (s.pid != null ? `PID: ${s.pid}` : '')}
                    </span>
                  </div>
                ))
              )}
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
                <span className="text-white opacity-60">system@repora-alpha-01: /var/log</span>
              </div>
              <div className="flex gap-4">
                <span className="text-status-final">FLUX EN DIRECT</span>
                <span className="text-white opacity-40">UTF-8</span>
              </div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto pr-2 space-y-1 text-green-400 font-mono custom-scrollbar">
              {logsLoading ? (
                <div className="flex items-center justify-center h-full text-white/50">
                  Chargement des logs...
                </div>
              ) : logsError ? (
                <div className="flex items-center justify-center h-full text-red-400">
                  Erreur de chargement des logs
                </div>
              ) : displayLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/30">
                  Aucun log disponible
                </div>
              ) : (
                displayLogs.map((entry, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-white opacity-30">[{new Date().toISOString().replace('T', ' ').split('.')[0]}]</span>
                    <span className={entry.color}>{entry.type}</span>
                    <span>{entry.msg}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-2 border-t border-on-surface-variant flex gap-2">
              <span className="text-status-final">$</span>
              <Input
                className="border-none bg-transparent p-0 focus-visible:ring-0 text-white w-full font-mono outline-none"
                placeholder="Saisir commande diagnostic..."
                value={diagInput}
                onChange={(e) => setDiagInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDiagCommand() }}
              />
            </div>
          </div>

          <div className="col-span-12 bg-white p-6 rounded-xl border border-outline-variant">
            <h3 className="font-headline-md text-headline-md mb-6">Charge systeme active (24h)</h3>
            {infraLoading ? (
              <div className="flex items-center justify-center h-24 text-on-surface-variant text-body-sm">
                Chargement...
              </div>
            ) : loadHistory.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-on-surface-variant text-body-sm">
                Donnees de charge indisponibles
              </div>
            ) : (
              <div className="flex gap-1 h-24 items-end">
                {loadHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${h > 80 ? 'bg-error' : h > 60 ? 'bg-status-review' : 'bg-secondary'} opacity-40 hover:opacity-100 transition-opacity rounded-t-sm`}
                    style={{ height: `${Math.min(h, 100)}%` }}
                  />
                ))}
              </div>
            )}
            <div className="flex justify-between mt-2 text-[10px] font-label-sm text-on-surface-variant uppercase">
              <span>Il y a 24 heures</span>
              <span>Il y a 12 heures</span>
              <span>A l&apos;instant</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
